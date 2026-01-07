
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-api-key'); // Shiprocket uses x-api-key or custom header for token

    // Simple token verification if configured
    if (process.env.SHIPROCKET_WEBHOOK_TOKEN && signature !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      console.warn('⚠️ Invalid Shiprocket webhook token');
      // Some systems use this for security, adjust if Shiprocket uses a different header
    }

    console.log('📥 Shiprocket Webhook received:', body);

    // Shiprocket sends different payloads for different events
    // Common fields: order_id (our DB ID), status, current_status, awb, courier_name
    
    const { 
      order_id,
      channel_order_id,
      status, 
      current_status, 
      awb,
      courier_name,
      status_datetime
    } = body;

    // Use channel_order_id if available (our internal ID), otherwise order_id
    const shiprocketOrderId = channel_order_id || order_id;

    // Map Shiprocket status to our internal status
    let internalStatus = 'paid';
    const s = (current_status || status || '').toLowerCase();
    
    if (s.includes('shipped')) internalStatus = 'shipped';
    else if (s.includes('delivered')) internalStatus = 'delivered';
    else if (s.includes('canceled') || s.includes('cancelled')) internalStatus = 'cancelled';
    else if (s.includes('out for delivery')) internalStatus = 'out_for_delivery';
    else if (s.includes('picked up')) internalStatus = 'processing';
    else if (s.includes('packed')) internalStatus = 'processing';

    // Find the order in our database
    let dbOrderId = parseInt(shiprocketOrderId);

    // If parsing fails, try to find by AWB
    if (isNaN(dbOrderId) && awb) {
      const orderResults = await db.select().from(orders).where(eq(orders.trackingId, awb)).limit(1);
      if (orderResults.length > 0) {
        dbOrderId = orderResults[0].id;
      }
    }

    if (!isNaN(dbOrderId)) {
      // Update order status
      await db.update(orders)
        .set({ 
          status: internalStatus,
          trackingId: awb || undefined,
          courierName: courier_name || undefined,
          updatedAt: new Date().toISOString()
        })
        .where(eq(orders.id, dbOrderId));

      // Add tracking entry
      await db.insert(orderTracking).values({
        orderId: dbOrderId,
        status: current_status || status || 'Updated',
        description: `Shipment status updated to: ${current_status || status}`,
        location: body.current_location || 'Transit',
        createdAt: status_datetime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Order ${dbOrderId} updated to ${internalStatus} via webhook`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Shiprocket Webhook Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
