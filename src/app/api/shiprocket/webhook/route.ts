import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWebhook } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('x-api-key');

    if (!verifyWebhook(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      order_id, 
      status, 
      current_status, 
      awb, 
      courier_name,
      location,
      remarks 
    } = body;

    // Find the order in our database
    // Note: Shiprocket order_id might be a string, and we store it in shiprocketOrderId
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.shiprocketOrderId, order_id.toString()))
      .limit(1);

    if (existingOrder.length === 0) {
      console.warn(`Webhook received for unknown Shiprocket Order ID: ${order_id}`);
      return NextResponse.json({ message: 'Order not found' }, { status: 200 });
    }

    const order = existingOrder[0];

    // Map Shiprocket status to our internal status if needed
    // For now, we'll keep it simple and update the main status and add a log
    await db.update(orders)
      .set({
        status: current_status || status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    // Add tracking log
    await db.insert(orderTracking).values({
      orderId: order.id,
      status: current_status || status,
      description: remarks || `Status updated to ${current_status || status}`,
      location: location || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Shiprocket webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
