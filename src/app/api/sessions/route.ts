import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessionBookings } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { sendSessionBookingEmail } from '@/lib/email';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single session by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const session = await db
        .select()
        .from(sessionBookings)
        .where(eq(sessionBookings.id, parseInt(id)))
        .limit(1);

      if (session.length === 0) {
        return NextResponse.json(
          { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(session[0], { status: 200 });
    }

    // List sessions with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = db.select().from(sessionBookings);

    const conditions = [];

    if (userId) {
      // userId is now TEXT, no need to parse to integer
      conditions.push(eq(sessionBookings.userId, userId));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(sessionBookings.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const sessions = await query
      .orderBy(desc(sessionBookings.date), desc(sessionBookings.time))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionType,
      date,
      time,
      duration,
      clientName,
      clientEmail,
      notes,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // userId is now TEXT, validate it's a string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId must be a non-empty string', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!sessionType || typeof sessionType !== 'string' || sessionType.trim() === '') {
      return NextResponse.json(
        { error: 'sessionType is required', code: 'MISSING_SESSION_TYPE' },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string' || date.trim() === '') {
      return NextResponse.json(
        { error: 'date is required', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    if (!time || typeof time !== 'string' || time.trim() === '') {
      return NextResponse.json(
        { error: 'time is required', code: 'MISSING_TIME' },
        { status: 400 }
      );
    }

    if (!duration) {
      return NextResponse.json(
        { error: 'duration is required', code: 'MISSING_DURATION' },
        { status: 400 }
      );
    }

    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt <= 0) {
      return NextResponse.json(
        { error: 'duration must be a positive integer', code: 'INVALID_DURATION' },
        { status: 400 }
      );
    }

    if (!clientName || typeof clientName !== 'string' || clientName.trim() === '') {
      return NextResponse.json(
        { error: 'clientName is required', code: 'MISSING_CLIENT_NAME' },
        { status: 400 }
      );
    }

    if (!clientEmail || typeof clientEmail !== 'string' || clientEmail.trim() === '') {
      return NextResponse.json(
        { error: 'clientEmail is required', code: 'MISSING_CLIENT_EMAIL' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(clientEmail.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Create new session - DO NOT include id field
    const now = new Date().toISOString();
    const insertValues = {
      userId: userId.trim(),
      sessionType: sessionType.trim(),
      date: date.trim(),
      time: time.trim(),
      duration: durationInt,
      status: 'pending' as const,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      notes: notes ? notes.trim() : null,
      createdAt: now,
      updatedAt: now,
    };

    const newSession = await db
      .insert(sessionBookings)
      .values(insertValues)
      .returning();

    // Send confirmation email (fire-and-forget to not block response)
    console.log('📧 Sending session booking confirmation email...');
    void sendSessionBookingEmail({
      to: clientEmail.trim().toLowerCase(),
      userName: clientName.trim(),
      sessionType: sessionType.trim(),
      date: date.trim(),
      time: time.trim(),
      duration: durationInt,
      notes: notes ? notes.trim() : undefined,
    }).then(() => {
      console.log('✅ Session booking email sent successfully');
    }).catch((error) => {
      console.error('❌ Failed to send session booking email:', error);
      // Don't fail the booking if email fails
    });

    return NextResponse.json(newSession[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const sessionId = parseInt(id);

    // Check if session exists
    const existing = await db
      .select()
      .from(sessionBookings)
      .where(eq(sessionBookings.id, sessionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.sessionType !== undefined) {
      if (typeof body.sessionType !== 'string' || body.sessionType.trim() === '') {
        return NextResponse.json(
          { error: 'sessionType must be a non-empty string', code: 'INVALID_SESSION_TYPE' },
          { status: 400 }
        );
      }
      updates.sessionType = body.sessionType.trim();
    }

    if (body.date !== undefined) {
      if (typeof body.date !== 'string' || body.date.trim() === '') {
        return NextResponse.json(
          { error: 'date must be a non-empty string', code: 'INVALID_DATE' },
          { status: 400 }
        );
      }
      updates.date = body.date.trim();
    }

    if (body.time !== undefined) {
      if (typeof body.time !== 'string' || body.time.trim() === '') {
        return NextResponse.json(
          { error: 'time must be a non-empty string', code: 'INVALID_TIME' },
          { status: 400 }
        );
      }
      updates.time = body.time.trim();
    }

    if (body.duration !== undefined) {
      const durationInt = parseInt(body.duration);
      if (isNaN(durationInt) || durationInt <= 0) {
        return NextResponse.json(
          { error: 'duration must be a positive integer', code: 'INVALID_DURATION' },
          { status: 400 }
        );
      }
      updates.duration = durationInt;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.clientName !== undefined) {
      if (typeof body.clientName !== 'string' || body.clientName.trim() === '') {
        return NextResponse.json(
          { error: 'clientName must be a non-empty string', code: 'INVALID_CLIENT_NAME' },
          { status: 400 }
        );
      }
      updates.clientName = body.clientName.trim();
    }

    if (body.clientEmail !== undefined) {
      if (typeof body.clientEmail !== 'string' || body.clientEmail.trim() === '') {
        return NextResponse.json(
          { error: 'clientEmail must be a non-empty string', code: 'INVALID_CLIENT_EMAIL' },
          { status: 400 }
        );
      }
      if (!EMAIL_REGEX.test(body.clientEmail.trim())) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }
      updates.clientEmail = body.clientEmail.trim().toLowerCase();
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes ? body.notes.trim() : null;
    }

    // Always update updatedAt
    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(sessionBookings)
      .set(updates)
      .where(eq(sessionBookings.id, sessionId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const sessionId = parseInt(id);

    // Check if session exists
    const existing = await db
      .select()
      .from(sessionBookings)
      .where(eq(sessionBookings.id, sessionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(sessionBookings)
      .where(eq(sessionBookings.id, sessionId))
      .returning();

    return NextResponse.json(
      {
        message: 'Session deleted successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}