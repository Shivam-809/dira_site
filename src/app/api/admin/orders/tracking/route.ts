import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderTracking, orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { adminSession, admin } from '@/db/schema';

async function verifyAdminAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: NextResponse.json({ error: 'Admin token required', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    const token = authHeader.substring(7);

    // Verify admin session token
    const sessions = await db.select()
      .from(adminSession)
      .where(eq(adminSession.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return { error: NextResponse.json({ error: 'Invalid admin token', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    const session = sessions[0];

    // Check if session has expired
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      return { error: NextResponse.json({ error: 'Admin session expired', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    // Get admin details
    const admins = await db.select()
      .from(admin)
      .where(eq(admin.id, session.adminId))
      .limit(1);

    if (admins.length === 0) {
      return { error: NextResponse.json({ error: 'Admin not found', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    return { admin: admins[0], session };
  } catch (error) {
    return { error: NextResponse.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, { status: 401 }) };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await verifyAdminAccess(request);
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const body = await request.json();
    const { orderId, status, description, location } = body;

    // Validate required fields
    if (!orderId || !status || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: orderId, status, and description are required',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate orderId is a valid integer
    const orderIdInt = parseInt(orderId);
    if (isNaN(orderIdInt)) {
      return NextResponse.json({ 
        error: 'Invalid orderId: must be a valid integer',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Trim and validate string fields
    const trimmedStatus = status.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location ? location.trim() : null;

    if (!trimmedStatus || !trimmedDescription) {
      return NextResponse.json({ 
        error: 'Status and description cannot be empty',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, orderIdInt))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Create tracking event
    const now = new Date().toISOString();
    const newTracking = await db.insert(orderTracking)
      .values({
        orderId: orderIdInt,
        status: trimmedStatus,
        description: trimmedDescription,
        location: trimmedLocation,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newTracking[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await verifyAdminAccess(request);
    if (adminCheck.error) {
      return adminCheck.error;
    }

    // Get and validate ID from query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const trackingId = parseInt(id);

    // Get request body
    const body = await request.json();
    const { status, description, location } = body;

    // Check if at least one field is provided
    if (!status && !description && location === undefined) {
      return NextResponse.json({ 
        error: 'At least one field (status, description, or location) must be provided for update',
        code: 'NO_UPDATE_FIELDS' 
      }, { status: 400 });
    }

    // Verify tracking event exists
    const existingTracking = await db.select()
      .from(orderTracking)
      .where(eq(orderTracking.id, trackingId))
      .limit(1);

    if (existingTracking.length === 0) {
      return NextResponse.json({ 
        error: 'Tracking event not found',
        code: 'TRACKING_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (status !== undefined) {
      const trimmedStatus = status.trim();
      if (!trimmedStatus) {
        return NextResponse.json({ 
          error: 'Status cannot be empty',
          code: 'MISSING_REQUIRED_FIELDS' 
        }, { status: 400 });
      }
      updates.status = trimmedStatus;
    }

    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (!trimmedDescription) {
        return NextResponse.json({ 
          error: 'Description cannot be empty',
          code: 'MISSING_REQUIRED_FIELDS' 
        }, { status: 400 });
      }
      updates.description = trimmedDescription;
    }

    if (location !== undefined) {
      updates.location = location ? location.trim() : null;
    }

    // Update tracking event
    const updatedTracking = await db.update(orderTracking)
      .set(updates)
      .where(eq(orderTracking.id, trackingId))
      .returning();

    return NextResponse.json(updatedTracking[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}