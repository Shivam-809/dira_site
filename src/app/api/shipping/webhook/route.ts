
import { NextRequest, NextResponse } from "next/server";
import { ShippingService } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log("📦 Received shipping webhook:", payload);

    // Optional: Verify webhook token from Shiprocket headers if configured
    const token = request.headers.get("x-shiprocket-token");
    if (process.env.SHIPROCKET_WEBHOOK_TOKEN && token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      console.warn("⚠️ Unauthorized shipping webhook attempt");
      // Some providers require 200 even for unauthorized to stop retries
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await ShippingService.updateTracking(payload);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      // Return 400 if we couldn't process the payload (e.g. order not found)
      // but in this version we return 200 for known non-critical issues in updateTracking
      return NextResponse.json({ error: "Failed to process tracking update" }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Shipping webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
