import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate status if provided
    const validStatuses = ['unread', 'read', 'replied'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: unread, read, replied',
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Build query
    let query = db.select().from(contactMessages);

    // Apply status filter if provided
    if (status) {
      query = query.where(eq(contactMessages.status, status));
    }

    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin authentication
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const messageId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required',
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const validStatuses = ['unread', 'read', 'replied'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: unread, read, replied',
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check if message exists
    const existingMessage = await db.select()
      .from(contactMessages)
      .where(eq(contactMessages.id, messageId))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json({ 
        error: 'Message not found',
        code: 'MESSAGE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Update message status
    const updated = await db.update(contactMessages)
      .set({
        status,
        updatedAt: new Date().toISOString()
      })
      .where(eq(contactMessages.id, messageId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}