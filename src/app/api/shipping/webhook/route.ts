import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('Received Shiprocket Webhook:', payload);

    // Verify webhook token if configured
    const token = request.headers.get('x-api-key') || request.headers.get('Authorization');
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    
    // Note: Shiprocket usually sends token in a custom header or as part of the URL if configured
    // For now, we'll log it and proceed, but in production you should verify it.

    const { 
      awb, 
      current_status, 
      order_id, 
      status_datetime,
      current_status_id,
      scanned_location
    } = payload;

    if (!order_id && !awb) {
      return NextResponse.json({ message: 'Missing order_id or awb' }, { status: 400 });
    }

    // 1. Find the order in our database
    let order;
    if (order_id) {
      order = await db.query.orders.findFirst({
        where: eq(orders.id, parseInt(order_id))
      });
    } else if (awb) {
      order = await db.query.orders.findFirst({
        where: eq(orders.trackingId, awb)
      });
    }

    if (!order) {
      console.error('Order not found for webhook:', { order_id, awb });
      // Return 200 anyway to Shiprocket to stop retries for non-existent orders
      return NextResponse.json({ message: 'Order not found' }, { status: 200 });
    }

    // 2. Map Shiprocket status to our internal status
    // Common Shiprocket Statuses: 
    // 6: Shipped, 7: Delivered, 8: Cancelled, 9: RTO Initiated, 10: RTO Delivered, 11: Pending, 12: Lost, 13: Pickup Scheduled
    let internalStatus = order.status;
    if (current_status_id === 7 || current_status?.toLowerCase() === 'delivered') {
      internalStatus = 'delivered';
    } else if (current_status_id === 6 || current_status?.toLowerCase() === 'shipped') {
      internalStatus = 'shipped';
    } else if (current_status_id === 8 || current_status?.toLowerCase() === 'cancelled') {
      internalStatus = 'cancelled';
    }

    // 3. Update order status
    await db.update(orders).set({
      status: internalStatus,
      updatedAt: new Date().toISOString(),
    }).where(eq(orders.id, order.id));

    // 4. Add tracking entry
    await db.insert(orderTracking).values({
      orderId: order.id,
      status: current_status || 'Updated',
      description: `Shipment status updated to ${current_status}`,
      location: scanned_location || 'Transit',
      createdAt: status_datetime || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
