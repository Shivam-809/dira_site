import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admin, adminAccount, adminSession } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, pbkdf2Sync } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email and password are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query admin_account table to find admin by email (stored in accountId)
    const adminAccountResult = await db
      .select({
        accountId: adminAccount.id,
        accountEmail: adminAccount.accountId,
        storedPassword: adminAccount.password,
        adminId: adminAccount.adminId,
        adminEmail: admin.email,
        adminName: admin.name,
        adminEmailVerified: admin.emailVerified,
        adminImage: admin.image,
      })
      .from(adminAccount)
      .innerJoin(admin, eq(adminAccount.adminId, admin.id))
      .where(eq(adminAccount.accountId, normalizedEmail))
      .limit(1);

    // If no admin found with that email
    if (adminAccountResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    const adminData = adminAccountResult[0];
    const storedPassword = adminData.storedPassword;

    if (!storedPassword) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Verify password using better-auth format (salt:hash)
    const [salt, storedHash] = storedPassword.split(':');
    
    if (!salt || !storedHash) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Hash the provided password with the salt
    const computedHash = pbkdf2Sync(
      password,
      salt,
      100000,
      64,
      'sha256'
    ).toString('hex');

    // Compare computed hash with stored hash
    if (computedHash !== storedHash) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Authentication successful - create session
    const sessionToken = randomBytes(32).toString('hex');
    const sessionId = randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Extract IP address from request headers
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null;

    // Extract user agent from request headers
    const userAgent = request.headers.get('user-agent') || null;

    const now = new Date().toISOString();

    // Insert new session into admin_session table
    await db.insert(adminSession).values({
      id: sessionId,
      token: sessionToken,
      adminId: adminData.adminId,
      expiresAt: expiresAt.toISOString(),
      ipAddress,
      userAgent,
      createdAt: now,
      updatedAt: now,
    });

    // Return success response with token and admin details
    return NextResponse.json(
      {
        success: true,
        token: sessionToken,
        admin: {
          id: adminData.adminId,
          email: adminData.adminEmail,
          name: adminData.adminName,
          emailVerified: adminData.adminEmailVerified,
          image: adminData.adminImage,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}