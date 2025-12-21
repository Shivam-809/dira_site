import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, verification } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    console.log("🔍 Verification attempt with token:", token);

    if (!token) {
      console.error("❌ No token provided");
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find verification token (without expiry check first to see if token exists)
    const verificationRecord = await db
      .select()
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);

    console.log("🔍 Verification records found:", verificationRecord.length);

    if (verificationRecord.length === 0) {
      console.error("❌ No verification record found for token");
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    const record = verificationRecord[0];
    console.log("📝 Verification record:", {
      id: record.id,
      identifier: record.identifier,
      expiresAt: record.expiresAt,
      now: new Date().toISOString()
    });

    // Check if token has expired
    const now = new Date();
    const expiryDate = new Date(record.expiresAt);
    
    if (expiryDate < now) {
      console.error("❌ Token expired:", { expiresAt: record.expiresAt, now: now.toISOString() });
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new verification email." },
        { status: 400 }
      );
    }

    console.log("✅ Token is valid, updating user...");

    // Update user's emailVerified status
    const updateResult = await db
      .update(user)
      .set({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(user.email, record.identifier))
      .returning();

    console.log("✅ User update result:", updateResult);

    // Delete used verification token
    await db.delete(verification).where(eq(verification.id, record.id));

    console.log("✅ Email verified successfully for:", record.identifier);

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Email verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email. Please try again or contact support." },
      { status: 500 }
    );
  }
}