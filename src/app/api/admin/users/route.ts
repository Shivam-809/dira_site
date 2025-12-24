import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { verifyAdminRequest } from '@/lib/admin-auth';

// Helper function to exclude password from user object
function excludePassword(userData: any) {
  const { password, ...userWithoutPassword } = userData;
  return userWithoutPassword;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('userId') || searchParams.get('id');

    // Single user fetch
    if (id) {
      const userData = await db.select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      if (userData.length === 0) {
        return NextResponse.json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(excludePassword(userData[0]), { status: 200 });
    }

    // List users with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

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

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    if (role && role !== 'all') {
      conditions.push(eq(user.role, role));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    const { userId, email, password, name, role } = body;

    // Validate ID
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Handle email update
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      const sanitizedEmail = email.trim().toLowerCase();
      const emailCheck = await db.select()
        .from(user)
        .where(eq(user.email, sanitizedEmail))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== userId) {
        return NextResponse.json({ 
          error: "Email already exists",
          code: "EMAIL_EXISTS" 
        }, { status: 400 });
      }

      updates.email = sanitizedEmail;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json({ 
          error: "Password must be at least 6 characters long",
          code: "INVALID_PASSWORD" 
        }, { status: 400 });
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role;

    const updatedUser = await db.update(user)
      .set(updates)
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

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('userId') || searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(user)
      .where(eq(user.id, id))
      .returning({
        id: user.id
      });

    return NextResponse.json({
      message: 'User deleted successfully',
      id: deleted[0].id
    }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
