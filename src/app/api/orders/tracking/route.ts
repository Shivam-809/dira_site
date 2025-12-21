import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderTracking, orders, session, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

async function verifyUserAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    const token = authHeader.substring(7);

    // Verify user session token
    const sessions = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return { error: NextResponse.json({ error: 'Invalid session token', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    const userSession = sessions[0];

    // Check if session has expired
    const expiresAt = new Date(userSession.expiresAt);
    if (expiresAt < new Date()) {
      return { error: NextResponse.json({ error: 'Session expired', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    // Get user details
    const users = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (users.length === 0) {
      return { error: NextResponse.json({ error: 'User not found', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    return { user: users[0], session: userSession };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: NextResponse.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authCheck = await verifyUserAccess(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get('orderId');

    // Validate orderId parameter
    if (!orderIdParam) {
      return NextResponse.json(
        { error: 'Order ID is required', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const orderId = parseInt(orderIdParam);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Valid order ID is required', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    // Query order to verify it exists
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization: verify user owns the order or is admin
    const userOwnsOrder = order[0].userId === authCheck.user.id;
    const isAdmin = authCheck.user.role === 'admin';

    if (!userOwnsOrder && !isAdmin) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to view this order tracking', 
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Get tracking history for the order
    const trackingHistory = await db
      .select()
      .from(orderTracking)
      .where(eq(orderTracking.orderId, orderId))
      .orderBy(desc(orderTracking.createdAt));

    return NextResponse.json(trackingHistory, { status: 200 });

  } catch (error) {
    console.error('GET order tracking error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}