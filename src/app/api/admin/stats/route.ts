import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, orders } from '@/db/schema';
import { eq, or, desc, sql } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    // Calculate total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user);
    const totalUsers = Number(totalUsersResult[0]?.count ?? 0);

    // Calculate total orders
    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const totalOrders = Number(totalOrdersResult[0]?.count ?? 0);

    // Calculate total revenue (sum of paid and delivered orders)
    const totalRevenueResult = await db
      .select({ sum: sql<number>`COALESCE(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(or(eq(orders.status, 'paid'), eq(orders.status, 'delivered')));
    const totalRevenue = Math.round(Number(totalRevenueResult[0]?.sum ?? 0) * 100) / 100;

    // Calculate pending orders count
    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'pending'));
    const pendingOrders = Number(pendingOrdersResult[0]?.count ?? 0);

    // Get recent orders with user details
    const recentOrdersRaw = await db
      .select()
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Format recent orders with parsed JSON and user details
    const recentOrders = recentOrdersRaw.map(row => {
      const order = row.orders;
      const userData = row.user;

      // Parse JSON fields
      let items = [];
      let shippingAddress = null;

      try {
        items = order.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : [];
      } catch (error) {
        console.error('Failed to parse items JSON:', error);
        items = [];
      }

      try {
        shippingAddress = order.shippingAddress 
          ? (typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress) 
          : null;
      } catch (error) {
        console.error('Failed to parse shippingAddress JSON:', error);
        shippingAddress = null;
      }

      return {
        id: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status,
        items,
        shippingAddress,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        } : null
      };
    });

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      pendingOrders,
      recentOrders
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}