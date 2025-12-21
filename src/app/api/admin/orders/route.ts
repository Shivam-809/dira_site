import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, user } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function verifyAdminAccess(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return { error: NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 }) };
    }
    
    if (session.user.role !== 'admin') {
      return { error: NextResponse.json({ error: 'Admin access required', code: 'FORBIDDEN' }, { status: 403 }) };
    }
    
    return { session };
  } catch (error) {
    return { error: NextResponse.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdminAccess(request);
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (id) {
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        return NextResponse.json({ 
          error: 'Valid order ID is required', 
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const result = await db.select({
        id: orders.id,
        userId: orders.userId,
        items: orders.items,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentIntentId: orders.paymentIntentId,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .where(eq(orders.id, orderId))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ 
          error: 'Order not found', 
          code: 'ORDER_NOT_FOUND' 
        }, { status: 404 });
      }

      const order = result[0];
      const parsedOrder = {
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
      };

      return NextResponse.json(parsedOrder, { status: 200 });
    }

    let query = db.select({
      id: orders.id,
      userId: orders.userId,
      items: orders.items,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentIntentId: orders.paymentIntentId,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id));

    const conditions = [];

    if (status) {
      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status. Must be one of: pending, paid, shipped, delivered, cancelled', 
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(orders.status, status));
    }

    if (search) {
      const searchCondition = or(
        like(user.email, `%${search}%`),
        like(user.name, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const parsedResults = results.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
    }));

    return NextResponse.json(parsedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await verifyAdminAccess(request);
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required', 
        code: 'MISSING_ORDER_ID' 
      }, { status: 400 });
    }

    const orderIdNum = parseInt(orderId);
    if (isNaN(orderIdNum)) {
      return NextResponse.json({ 
        error: 'Valid order ID is required', 
        code: 'INVALID_ORDER_ID' 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required', 
        code: 'MISSING_STATUS' 
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: pending, paid, shipped, delivered, cancelled', 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, orderIdNum))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found', 
        code: 'ORDER_NOT_FOUND' 
      }, { status: 404 });
    }

    const updated = await db.update(orders)
      .set({
        status,
        updatedAt: new Date().toISOString()
      })
      .where(eq(orders.id, orderIdNum))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update order', 
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    const updatedOrder = updated[0];
    const parsedOrder = {
      ...updatedOrder,
      items: typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items,
      shippingAddress: typeof updatedOrder.shippingAddress === 'string' ? JSON.parse(updatedOrder.shippingAddress) : updatedOrder.shippingAddress,
    };

    return NextResponse.json(parsedOrder, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}