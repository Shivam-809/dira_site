import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      console.error('❌ Failed to parse webhook JSON:', e);
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    console.log('📥 Received shipping webhook payload:', JSON.stringify(payload, null, 2));

    const {
      awb,
      courier_name,
      current_status,
      order_id,
      scans
    } = payload;

    // Check for dummy/test payload from Shiprocket
    const isDummy = (val: any) => val?.toString().toLowerCase().includes('dummy') || val?.toString().toLowerCase().includes('dummpy');
    
    if (isDummy(order_id) || isDummy(awb)) {
      console.log('🧪 Handling test/dummy webhook payload - returning 200 OK');
      return NextResponse.json({ success: true, message: 'Test webhook received' }, { status: 200 });
    }

    // Try to find the order
    let existingOrder = null;

    // 1. Try by numeric ID
    const numericOrderId = parseInt(order_id);
    if (!isNaN(numericOrderId)) {
      console.log('🔍 Looking for order by ID:', numericOrderId);
      const results = await db.select().from(orders).where(eq(orders.id, numericOrderId)).limit(1);
      if (results.length > 0) existingOrder = results[0];
    }

    // 2. Try by AWB if not found
    if (!existingOrder && awb) {
      console.log('🔍 Looking for order by AWB:', awb);
      const results = await db.select().from(orders).where(eq(orders.trackingId, awb)).limit(1);
      if (results.length > 0) existingOrder = results[0];
    }

    if (!existingOrder) {
      console.error('❌ Order not found for ID:', order_id, 'or AWB:', awb);
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 200 });
    }

    console.log('✅ Found order:', existingOrder.id);

    // Update order status
    const newStatus = current_status?.toLowerCase() === 'delivered' ? 'delivered' : 
                    current_status?.toLowerCase() === 'shipped' ? 'shipped' : 
                    existingOrder.status;

    await db.update(orders)
      .set({
        status: newStatus,
        courierName: courier_name || existingOrder.courierName,
        trackingId: awb || existingOrder.trackingId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(orders.id, existingOrder.id));

    // Add tracking update record
    if (current_status) {
      const description = (scans && scans.length > 0) 
        ? (scans[scans.length - 1].activity || scans[scans.length - 1]['sr-status-label'] || `Status: ${current_status}`)
        : `Status updated to ${current_status}`;
      
      const location = (scans && scans.length > 0) ? scans[scans.length - 1].location : null;

      await db.insert(orderTracking).values({
        orderId: existingOrder.id,
        status: current_status,
        description: description,
        location: location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('❌ Shipping webhook fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
  }
}
