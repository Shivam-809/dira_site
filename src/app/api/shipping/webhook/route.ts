
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-api-key") || request.headers.get("Authorization");
    
    // Basic verification against env token
    if (token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, status, awb, tracking_url } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // Map Shiprocket status to internal status if needed
    // For now, we'll store the raw status and update awb/tracking info
    await db.update(orders)
      .set({
        status: status.toLowerCase(),
        awbCode: awb,
        trackingUrl: tracking_url,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, parseInt(order_id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shipping webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
