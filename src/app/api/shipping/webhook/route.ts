import { NextRequest, NextResponse } from "next/server";
import { updateTracking } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook payload (this would normally involve checking a signature)
    const { trackingId, status, description, location, secret } = body;

    // Basic security check (placeholder for real signature verification)
    if (secret !== process.env.SHIPPING_WEBHOOK_SECRET) {
      console.warn("Unauthorized shipping webhook attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!trackingId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await updateTracking(trackingId, status, description || status, location);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to update tracking" }, { status: 500 });
    }
  } catch (error) {
    console.error("Shipping webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
