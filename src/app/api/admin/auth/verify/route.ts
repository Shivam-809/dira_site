import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admin, adminSession } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate token is provided
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json(
        {
          error: 'Session token is required',
          code: 'MISSING_TOKEN',
        },
        { status: 400 }
      );
    }

    // Query admin_session table to find session by token
    const sessions = await db
      .select()
      .from(adminSession)
      .where(eq(adminSession.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid session token',
          code: 'INVALID_SESSION',
        },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Check if session has expired
    const sessionExpiry = new Date(session.expiresAt);
    const now = new Date();

    if (sessionExpiry < now) {
      // Delete expired session
      await db.delete(adminSession).where(eq(adminSession.id, session.id));

      return NextResponse.json(
        {
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    // Query admin table to get admin details
    const admins = await db
      .select()
      .from(admin)
      .where(eq(admin.id, session.adminId))
      .limit(1);

    if (admins.length === 0) {
      return NextResponse.json(
        {
          error: 'Admin not found',
          code: 'ADMIN_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const adminUser = admins[0];

    // Return valid session with admin details
    return NextResponse.json(
      {
        valid: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          emailVerified: adminUser.emailVerified,
          image: adminUser.image,
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}