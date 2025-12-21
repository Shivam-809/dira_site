import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSession } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Validate token is provided
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Session token is required',
          code: 'MISSING_TOKEN' 
        },
        { status: 400 }
      );
    }

    // Query admin_session table to find session by token
    const existingSession = await db
      .select()
      .from(adminSession)
      .where(eq(adminSession.token, token))
      .limit(1);

    // If session not found, return 404
    if (existingSession.length === 0) {
      return NextResponse.json(
        { 
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Delete the session from admin_session table
    await db
      .delete(adminSession)
      .where(eq(adminSession.id, existingSession[0].id));

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Logged out successfully' 
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