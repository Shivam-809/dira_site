
import { NextRequest, NextResponse } from "next/server";
import { ShippingService } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log("📦 Received shipping webhook:", payload);

    const success = await ShippingService.updateTracking(payload);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Failed to process tracking update" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("❌ Shipping webhook error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message 
    }, { status: 500 });
  }
}
