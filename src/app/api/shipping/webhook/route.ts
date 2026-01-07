import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Shipping Webhook received:", JSON.stringify(body, null, 2));

    // Verify webhook token if needed
    // const token = req.headers.get("x-shiprocket-token");
    // if (token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { 
      order_id, 
      shipment_id, 
      awb, 
      status, 
      current_status, 
      scanned_location, 
      current_timestamp 
    } = body;

    if (!awb) {
      return NextResponse.json({ message: "No AWB provided, ignoring" }, { status: 200 });
    }

    // Find the order in our database
    // Shiprocket's order_id might be our internal order ID or their own ID
    // We should have stored their ID in shippingOrderId
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.awbCode, awb),
    });

    if (!existingOrder) {
      console.warn(`Order with AWB ${awb} not found in database`);
      return NextResponse.json({ message: "Order not found" }, { status: 200 });
    }

    // Update order status if it's a major update
    if (status) {
      await db.update(orders)
        .set({ 
          status: status.toLowerCase(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(orders.id, existingOrder.id));
    }

    // Add to tracking history
    await db.insert(orderTracking).values({
      orderId: existingOrder.id,
      status: current_status || status || "Updated",
      description: `Shipment status updated to ${current_status || status}`,
      location: scanned_location || "Transit",
      createdAt: current_timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shipping webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
