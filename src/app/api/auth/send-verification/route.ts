import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("📧 Manual verification email request for:", email);

    // Check if user exists
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = existingUser[0];

    // Check if already verified
    if (userData.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Generate verification token and ID
    const token = randomBytes(32).toString("hex");
    const verificationId = randomBytes(16).toString("hex");
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old verification tokens for this email
    await db.delete(verification).where(eq(verification.identifier, email));

    // Store new verification token with proper schema
    await db.insert(verification).values({
      id: verificationId,
      identifier: email,
      value: token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    // Send verification email using Gmail SMTP
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    await sendVerificationEmail(email, token, baseUrl);

    console.log("✅ Verification email sent successfully via Gmail SMTP to:", email);

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}