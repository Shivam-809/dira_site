import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(orderId)),
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const trackingHistory = await db.query.orderTracking.findMany({
      where: eq(orderTracking.orderId, order.id),
      orderBy: [desc(orderTracking.createdAt)],
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.totalAmount,
      trackingId: order.trackingId,
      courierName: order.courierName,
      lastUpdated: order.updatedAt,
      placedAt: order.createdAt,
      tracking: trackingHistory.map(h => ({
        id: h.id,
        status: h.status,
        description: h.description,
        location: h.location,
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error('Tracking fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
