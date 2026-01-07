
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received Shiprocket Webhook:", JSON.stringify(body, null, 2));

    const {
      order_id,
      awb,
      current_status,
      current_timestamp,
      courier_name,
      scans
    } = body;

    let order;

    // Fix for NaN error: check if order_id is a numeric string or number
    const numericOrderId = order_id && !isNaN(parseInt(order_id)) ? parseInt(order_id) : null;

    if (numericOrderId) {
      order = await db.query.orders.findFirst({
        where: eq(orders.id, numericOrderId),
      });
    }

    if (!order && awb) {
      order = await db.query.orders.findFirst({
        where: eq(orders.trackingId, awb.toString()),
      });
    }

    if (!order) {
      console.warn(`Order not found for ID: ${order_id} or AWB: ${awb}`);
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Update order status if it's not already cancelled or delivered (or as per business logic)
    await db.update(orders)
      .set({
        status: current_status,
        courierName: courier_name || order.courierName,
        trackingId: awb?.toString() || order.trackingId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    // Log tracking update
    const latestScan = scans && scans.length > 0 ? scans[scans.length - 1] : null;
    
    await db.insert(orderTracking).values({
      orderId: order.id,
      status: current_status,
      description: latestScan?.activity || `Status updated to ${current_status}`,
      location: latestScan?.location || "In Transit",
      createdAt: current_timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
