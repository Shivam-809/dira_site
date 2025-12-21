import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { verification, account, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    console.log("🔑 Processing password reset with token");

    // Find the verification token
    const verificationRecords = await db
      .select()
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);

    if (verificationRecords.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const verificationRecord = verificationRecords[0];

    // Check if token is expired
    const expiresAt = new Date(verificationRecord.expiresAt);
    if (expiresAt < new Date()) {
      // Delete expired token
      await db.delete(verification).where(eq(verification.id, verificationRecord.id));
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Extract email from identifier (format: "reset:email@example.com")
    const email = verificationRecord.identifier.replace("reset:", "");

    console.log("🔄 Resetting password for:", email);

    // Find the user by email
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const foundUser = users[0];

    // Hash the new password using better-auth's hashPassword function
    const hashedPassword = await hashPassword(password);
    console.log("🔐 Password hashed successfully");

    // Get all accounts for this user
    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, foundUser.id));

    // Check if user has a credential account
    const credentialAccount = accounts.find(acc => acc.providerId === "credential");

    if (credentialAccount) {
      // Update existing credential account
      await db
        .update(account)
        .set({
          accountId: foundUser.email,
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(account.id, credentialAccount.id));
      console.log("✅ Updated existing credential account password");
    } else if (accounts.length > 0) {
      // User has OAuth account (e.g., Google) but no credential account
      // Convert the first OAuth account to credential OR create a new credential account
      const oauthAccount = accounts[0];
      
      // Delete the OAuth account and create a credential one
      await db.delete(account).where(eq(account.id, oauthAccount.id));
      
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: foundUser.email,
        providerId: "credential",
        userId: foundUser.id,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Converted OAuth account to credential account with password");
    } else {
      // No accounts exist, create new credential account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: foundUser.email,
        providerId: "credential",
        userId: foundUser.id,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Created new credential account with password");
    }

    // Delete the used verification token
    await db.delete(verification).where(eq(verification.id, verificationRecord.id));

    console.log("✅ Password reset successfully for:", email);

    return NextResponse.json(
      { message: "Password reset successfully. You can now login with your new password." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}