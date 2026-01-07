import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("token");

    if (token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const { order_id, status, remarks, location, timestamp } = payload;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // Find the order in our DB
    const orderResults = await db
      .select()
      .from(orders)
      .where(eq(orders.shippingOrderId, order_id.toString()))
      .limit(1);

    if (orderResults.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResults[0];

    // Add tracking log
    await db.insert(orderTracking).values({
      orderId: order.id,
      status: status || "Updated",
      description: remarks || `Order status updated to ${status}`,
      location: location || "Unknown",
      createdAt: timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update order status if it's a significant status
    const statusMap: Record<string, string> = {
      "PICKED UP": "shipped",
      "IN TRANSIT": "shipped",
      "OUT FOR DELIVERY": "shipped",
      "DELIVERED": "delivered",
      "CANCELLED": "cancelled",
      "RETURNED": "returned",
    };

    if (status && statusMap[status.toUpperCase()]) {
      await db
        .update(orders)
        .set({
          status: statusMap[status.toUpperCase()],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shipping webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
