import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (id) {
      const userRecord = await db.select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      if (userRecord.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(userRecord[0]);
    }

    let query = db.select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }).from(user);

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(user.email, `%${search}%`),
          like(user.name, `%${search}%`)
        )
      );
    }

    if (role) {
      if (!['user', 'admin'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role filter. Must be "user" or "admin"', code: 'INVALID_ROLE_FILTER' },
          { status: 400 }
        );
      }
      conditions.push(eq(user.role, role));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const users = await query
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(users);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 401 }
      );
    }

    const body = await request.json();
    const { userId, role: newRole } = body;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'User ID is required and must be a non-empty string', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!newRole) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    if (!['user', 'admin'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updatedUser = await db.update(user)
      .set({
        role: newRole,
        updatedAt: new Date().toISOString()
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser[0]);

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
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete related data first if necessary (sessions, accounts, etc.)
    // Better-auth should handle some of this if configured, but let's be safe
    // For now, let's just delete the user
    await db.delete(user).where(eq(user.id, userId));

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
