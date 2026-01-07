import { NextRequest, NextResponse } from 'next/server';
import { shippingService } from '@/lib/shipping';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Received shipping webhook:', body);

    // Basic validation
    const { orderId, status, description, location, trackingId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // 1. Update tracking in database
    await shippingService.updateTracking(
      parseInt(orderId),
      status || 'updated',
      description || 'Tracking information updated.',
      location
    );

    // 2. Fetch order and customer details for email
    const orderData = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (orderData.length > 0) {
      const order = orderData[0];
      const shippingAddress = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress;

      // 3. Send email notification to customer
      if (shippingAddress && shippingAddress.email) {
        try {
          await sendOrderStatusUpdateEmail({
            to: shippingAddress.email,
            userName: shippingAddress.name || 'Valued Customer',
            orderId: order.id,
            newStatus: status || order.status,
            trackingLink: `https://diratarot.com/track-order?id=${order.id}`
          });
          console.log(`📧 Status update email sent to ${shippingAddress.email}`);
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Shipping webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
