
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
      shiprocket_order_id,
      awb,
      current_status,
      current_timestamp,
      courier_name,
      scans
    } = body;

    let order;

    // 1. Try matching by Shiprocket's order ID (sr_order_id or shiprocket_order_id)
    const srOrderId = shiprocket_order_id || body.sr_order_id || order_id;
    if (srOrderId) {
      order = await db.query.orders.findFirst({
        where: eq(orders.shiprocketOrderId, srOrderId.toString()),
      });
    }

    // 2. Try matching by our internal order ID if Shiprocket passed it back in order_id
    if (!order && order_id && !isNaN(parseInt(order_id))) {
      order = await db.query.orders.findFirst({
        where: eq(orders.id, parseInt(order_id)),
      });
    }

    // 3. Try matching by AWB
    if (!order && awb) {
      order = await db.query.orders.findFirst({
        where: eq(orders.trackingId, awb.toString()),
      });
    }

    if (!order) {
      console.warn(`Order not found for ID: ${order_id} or AWB: ${awb}. This might be a test webhook or an order from another source. Returning 200 OK.`);
      return NextResponse.json({ message: "Order not found, but webhook acknowledged" }, { status: 200 });
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
