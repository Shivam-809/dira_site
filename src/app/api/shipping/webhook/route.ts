
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Received Shiprocket Webhook:', payload);

    const {
      order_id,
      awb,
      courier_name,
      current_status,
      current_timestamp,
      scans
    } = payload;

    if (!order_id && !awb) {
      return NextResponse.json({ error: 'Missing order_id or awb' }, { status: 400 });
    }

    let order;
    
    // Fix: Robust parsing of order_id to avoid NaN errors
    const parsedOrderId = order_id ? parseInt(order_id) : NaN;

    if (!isNaN(parsedOrderId)) {
      order = await db.query.orders.findFirst({
        where: eq(orders.id, parsedOrderId)
      });
    }

    // Fallback to searching by AWB if order not found by ID
    if (!order && awb) {
      order = await db.query.orders.findFirst({
        where: eq(orders.trackingId, awb)
      });
    }

    if (!order) {
      console.warn(`Order not found for order_id: ${order_id}, awb: ${awb}`);
      return NextResponse.json({ message: 'Order not found' }, { status: 200 }); // Still return 200 to Shiprocket
    }

    // Map Shiprocket status to internal status
    // Shiprocket statuses: 1: 'AWB Assigned', 6: 'Shipped', 7: 'Delivered', 8: 'Cancelled', 17: 'Out for Delivery', etc.
    let internalStatus = order.status;
    if (current_status === 'Delivered') {
      internalStatus = 'delivered';
    } else if (current_status === 'Shipped') {
      internalStatus = 'shipped';
    } else if (current_status === 'Canceled' || current_status === 'Cancelled') {
      internalStatus = 'cancelled';
    } else if (current_status === 'Out for Delivery') {
      internalStatus = 'out_for_delivery';
    }

    // Update order
    await db.update(orders)
      .set({
        status: internalStatus,
        courierName: courier_name || order.courierName,
        trackingId: awb || order.trackingId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    // Add tracking log
    await db.insert(orderTracking).values({
      orderId: order.id,
      status: current_status,
      description: scans?.[0]?.activity || `Status updated to ${current_status}`,
      location: scans?.[0]?.location || 'N/A',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
