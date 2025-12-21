import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single order by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json(
          { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Verify user owns this order (unless admin)
      if (session.user.role !== 'admin' && order[0].userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Parse JSON fields
      const orderData = {
        ...order[0],
        items: order[0].items ? JSON.parse(order[0].items as string) : [],
        shippingAddress: order[0].shippingAddress
          ? JSON.parse(order[0].shippingAddress as string)
          : null,
      };

      return NextResponse.json(orderData, { status: 200 });
    }

    // List orders - users can only see their own orders
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');

    let query = db.select().from(orders);

    // Build where conditions - always filter by user ID for non-admins
    const conditions = [];
    
    // Non-admin users can only see their own orders
    if (session.user.role !== 'admin') {
      conditions.push(eq(orders.userId, session.user.id));
    }
    
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    // Parse JSON fields for all orders
    const ordersWithParsedJson = results.map((order) => ({
      ...order,
      items: order.items ? JSON.parse(order.items as string) : [],
      shippingAddress: order.shippingAddress
        ? JSON.parse(order.shippingAddress as string)
        : null,
    }));

    return NextResponse.json(ordersWithParsedJson, { status: 200 });
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
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { items, totalAmount, status, paymentIntentId, shippingAddress } = body;

    // Use authenticated user's ID
    const userId = session.user.id;

    // Validation: Required fields
    if (!items || totalAmount === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields: items and totalAmount are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validation: items must be array with at least 1 item
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: 'items must be an array with at least one item',
          code: 'INVALID_ITEMS',
        },
        { status: 400 }
      );
    }

    // Validation: each item must have required fields
    for (const item of items) {
      if (!item.productId || !item.quantity || item.price === undefined) {
        return NextResponse.json(
          {
            error: 'Each item must have productId, quantity, and price',
            code: 'INVALID_ITEMS',
          },
          { status: 400 }
        );
      }
    }

    // Validation: totalAmount must be greater than 0
    if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      return NextResponse.json(
        {
          error: 'totalAmount must be a number greater than 0',
          code: 'INVALID_TOTAL_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Validation: status must be valid if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Prepare insert data
    const insertData: any = {
      userId: userId,
      items: JSON.stringify(items),
      totalAmount: parseFloat(totalAmount),
      status: status || 'pending',
      createdAt: now,
      updatedAt: now,
    };

    if (paymentIntentId) {
      insertData.paymentIntentId = paymentIntentId;
    }

    if (shippingAddress) {
      insertData.shippingAddress = JSON.stringify(shippingAddress);
    }

    const newOrder = await db.insert(orders).values(insertData).returning();

    // Parse JSON fields for response
    const orderResponse = {
      ...newOrder[0],
      items: JSON.parse(newOrder[0].items as string),
      shippingAddress: newOrder[0].shippingAddress
        ? JSON.parse(newOrder[0].shippingAddress as string)
        : null,
    };

    return NextResponse.json(orderResponse, { status: 201 });
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
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validation: ID is required
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, paymentIntentId, shippingAddress } = body;

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user owns this order (unless admin)
    if (session.user.role !== 'admin' && existingOrder[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validation: status must be valid if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (paymentIntentId !== undefined) {
      updateData.paymentIntentId = paymentIntentId;
    }

    if (shippingAddress !== undefined) {
      updateData.shippingAddress = JSON.stringify(shippingAddress);
    }

    const updatedOrder = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    // Parse JSON fields for response
    const orderResponse = {
      ...updatedOrder[0],
      items: updatedOrder[0].items ? JSON.parse(updatedOrder[0].items as string) : [],
      shippingAddress: updatedOrder[0].shippingAddress
        ? JSON.parse(updatedOrder[0].shippingAddress as string)
        : null,
    };

    return NextResponse.json(orderResponse, { status: 200 });
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
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validation: ID is required
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user owns this order (unless admin)
    if (session.user.role !== 'admin' && existingOrder[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(orders)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Order deleted successfully',
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