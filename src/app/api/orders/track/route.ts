import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { trackShipment } from '@/lib/shiprocket';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required', 
        code: 'MISSING_ORDER_ID' 
      }, { status: 400 });
    }

    const orderIdNum = parseInt(orderId);
    if (isNaN(orderIdNum)) {
      return NextResponse.json({ 
        error: 'Invalid Order ID format', 
        code: 'INVALID_ORDER_ID' 
      }, { status: 400 });
    }

    const result = await db.select()
      .from(orders)
      .where(eq(orders.id, orderIdNum))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found. Please check your Order ID.', 
        code: 'ORDER_NOT_FOUND' 
      }, { status: 404 });
    }

    const order = result[0];
    let liveTracking = null;

    // Fetch live tracking from Shiprocket if AWB exists
    if (order.awbCode) {
      try {
        const srTracking = await trackShipment(order.awbCode);
        liveTracking = srTracking.tracking_data;
      } catch (srError) {
        console.error('Shiprocket live tracking failed:', srError);
      }
    }

    // Fetch detailed tracking logs from our DB
    const trackingLogs = await db.select()
      .from(orderTracking)
      .where(eq(orderTracking.orderId, order.id))
      .orderBy(desc(orderTracking.createdAt));

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.totalAmount,
      lastUpdated: order.updatedAt,
      placedAt: order.createdAt,
      courierName: order.courierName,
      awbCode: order.awbCode,
      trackingUrl: order.trackingUrl,
      tracking: trackingLogs,
      liveTracking: liveTracking
    }, { status: 200 });

  } catch (error) {
    console.error('Tracking API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}
