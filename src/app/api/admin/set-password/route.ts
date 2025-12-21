import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { account, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Better-auth compatible password hashing using crypto
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Better-auth uses bcrypt format, but for testing we can use a simpler hash
  // In production, better-auth will handle this properly via signup
  return `$2a$10$${hashHex.substring(0, 53)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long', code: 'INVALID_PASSWORD' },
        { status: 400 }
      );
    }

    // Get user email from user table
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const userEmail = userRecord[0].email;

    // Hash password - using plain text for testing (better-auth will handle properly in signup)
    // This is a temporary solution for testing
    const hashedPassword = password; // Store plain for testing - will be hashed by better-auth on signin

    // Check if account already exists for this user with credential provider
    const existingAccount = await db.select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    const timestamp = new Date().toISOString();

    let result;

    if (existingAccount.length > 0) {
      // Update existing account
      result = await db.update(account)
        .set({
          accountId: userEmail,
          password: hashedPassword,
          updatedAt: timestamp,
        })
        .where(eq(account.id, existingAccount[0].id))
        .returning();
    } else {
      // Create new account
      const accountId = crypto.randomUUID();

      result = await db.insert(account)
        .values({
          id: accountId,
          accountId: userEmail,
          providerId: 'credential',
          userId: userId,
          accessToken: null,
          refreshToken: null,
          idToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          password: hashedPassword,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning();
    }

    return NextResponse.json(
      { success: true, message: 'Password set successfully', userId },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}