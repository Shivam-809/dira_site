
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log("Received Shiprocket Webhook:", JSON.stringify(payload, null, 2));

    const { 
      awb, 
      courier_name, 
      current_status, 
      order_id, // Our internal order ID (passed as string by Shiprocket)
      shipment_status,
      scans
    } = payload;

    if (!order_id && !awb) {
      return NextResponse.json({ message: "Missing order_id or awb" }, { status: 400 });
    }

    let order;
    const numericOrderId = parseInt(order_id);

    // ✅ FIX: Check if order_id is a valid number before querying
    if (!isNaN(numericOrderId)) {
      order = await db.query.orders.findFirst({
        where: eq(orders.id, numericOrderId),
      });
    }

    // If not found by ID, try searching by AWB if available
    if (!order && awb) {
      order = await db.query.orders.findFirst({
        where: eq(orders.trackingId, awb),
      });
    }

    if (!order) {
      console.warn(`Order not found for ID: ${order_id} or AWB: ${awb}`);
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Update order status and tracking info
    const status = current_status || shipment_status;
    
    await db.update(orders)
      .set({
        status: status.toLowerCase(),
        courierName: courier_name || order.courierName,
        trackingId: awb || order.trackingId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    // Log tracking event
    await db.insert(orderTracking).values({
      orderId: order.id,
      status: status,
      description: scans?.[0]?.activity || `Status updated to ${status}`,
      location: scans?.[0]?.location || "Transit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
