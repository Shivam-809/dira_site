import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
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

    console.log("🔑 Password reset request for:", email);

    // Check if user exists
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    // Always return success to prevent email enumeration
    if (existingUser.length === 0) {
      console.log("⚠️ User not found, but returning success to prevent enumeration");
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent" },
        { status: 200 }
      );
    }

    const userData = existingUser[0];

    // Generate password reset token
    const token = randomBytes(32).toString("hex");
    const verificationId = randomBytes(16).toString("hex");
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete old password reset tokens for this email
    await db.delete(verification).where(eq(verification.identifier, `reset:${email}`));

    // Store password reset token
    await db.insert(verification).values({
      id: verificationId,
      identifier: `reset:${email}`,
      value: token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    // Send password reset email
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Dira Tarot</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 20px 40px;">
                      <h1 style="margin: 0; color: #6b21a8; font-size: 28px; font-family: 'Georgia', serif;">
                        ✨ Dira Tarot
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Reset Your Password</h2>
                      <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background-color: #6b21a8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0 0; color: #999; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0 0; color: #6b21a8; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      
                      <p style="margin: 20px 0 0 0; color: #e74c3c; font-size: 14px; line-height: 1.6;">
                        ⏰ This link will expire in 1 hour.
                      </p>
                      
                      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                      
                      <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 20px 40px; background-color: #f9f9f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        © ${new Date().getFullYear()} Dira Tarot. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: "🔑 Reset Your Password - Dira Tarot",
      html,
      text: `Reset your password by clicking this link: ${resetUrl}`,
    });

    console.log("✅ Password reset email sent to:", email);

    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in forgot password:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
