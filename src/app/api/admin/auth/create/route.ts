import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admin, adminAccount } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import * as crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, image } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: email, password, and name are required',
          code: 'MISSING_REQUIRED_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL' 
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters',
          code: 'INVALID_PASSWORD' 
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();

    // Check if admin with this email already exists
    const existingAdmin = await db.select()
      .from(admin)
      .where(eq(admin.email, sanitizedEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { 
          error: 'Admin with this email already exists',
          code: 'EMAIL_EXISTS' 
        },
        { status: 400 }
      );
    }

    // Generate admin ID and account ID
    const adminId = randomBytes(16).toString('hex');
    const accountId = randomBytes(16).toString('hex');

    // Hash password using Better-Auth format
    const salt = randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    const hashedPassword = `${salt}:${hash}`;

    const normalizedEmail = email.toLowerCase().trim();

    // Create timestamps
    const timestamp = new Date().toISOString();

    // Insert new admin
    const [newAdmin] = await db.insert(admin)
      .values({
        id: adminId,
        email: normalizedEmail,
        emailVerified: false,
        name: sanitizedName,
        image: image || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    // Insert admin account
    await db.insert(adminAccount)
      .values({
        id: accountId,
        accountId: normalizedEmail,
        providerId: 'credential',
        adminId: adminId,
        password: hashedPassword,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

    // Return created admin without password
    return NextResponse.json(
      {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        emailVerified: newAdmin.emailVerified,
        image: newAdmin.image,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}