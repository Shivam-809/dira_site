import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, user, orderTracking } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status || 401 });
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
      
      // Fetch tracking for this order
      const tracking = await db.select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, order.id))
        .orderBy(desc(orderTracking.createdAt));

      const parsedOrder = {
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []),
        shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {}),
        tracking
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
      const validStatuses = [
        'pending', 
        'paid', 
        'placed', 
        'confirmed',
        'processing', 
        'shipped', 
        'delivered', 
        'cancelled',
        'refunded',
        'Order Packed',
        'Dispatched',
        'In Transit',
        'Out for Delivery'
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Received: ${status}. Must be one of: ${validStatuses.join(', ')}`, 
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

    // Fetch tracking for all results
    const parsedResults = await Promise.all(results.map(async (order) => {
      const tracking = await db.select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, order.id))
        .orderBy(desc(orderTracking.createdAt));

        return {
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []),
          shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {}),
          tracking
        };
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
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status || 401 });
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

    const validStatuses = [
      'pending', 
      'paid', 
      'placed', 
      'confirmed',
      'processing', 
      'shipped', 
      'delivered', 
      'cancelled',
      'refunded',
      'Order Packed',
      'Dispatched',
      'In Transit',
      'Out for Delivery'
    ];
    
    // Normalize status to lowercase for standardized ones, but keep legacy as is
    const normalizedStatus = status.toLowerCase();
    const finalStatus = validStatuses.includes(status) ? status : (validStatuses.includes(normalizedStatus) ? normalizedStatus : status);

    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Received: ${status}. Must be one of: ${validStatuses.join(', ')}`, 
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
        status: finalStatus,
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
    
    // Fetch user info for email notification
    try {
      const orderUser = await db.select()
        .from(user)
        .where(eq(user.id, updatedOrder.userId))
        .limit(1);

      if (orderUser.length > 0) {
        await sendOrderStatusUpdateEmail({
          to: orderUser[0].email,
          userName: orderUser[0].name,
          orderId: updatedOrder.id,
          newStatus: finalStatus,
          trackingLink: `${request.nextUrl.origin}/track-order?order_id=${updatedOrder.id}`
        });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the request if email fails
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

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

    // Check if order exists
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

    // Delete order tracking info first
    await db.delete(orderTracking).where(eq(orderTracking.orderId, orderIdNum));

    // Delete the order
    await db.delete(orders).where(eq(orders.id, orderIdNum));

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
