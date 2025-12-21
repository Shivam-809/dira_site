import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Helper function to exclude password from user object
function excludePassword(user: any) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single user fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const user = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(excludePassword(user[0]), { status: 200 });
    }

    // List users with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let query = db.select().from(adminUsers);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(adminUsers.name, `%${search}%`),
          like(adminUsers.email, `%${search}%`)
        )
      );
    }

    if (role) {
      conditions.push(eq(adminUsers.role, role));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);
    
    // Exclude password from all results
    const sanitizedResults = results.map(user => excludePassword(user));

    return NextResponse.json(sanitizedResults, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: "Missing required fields: email, password, and name are required",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long",
        code: "INVALID_PASSWORD" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Check if email already exists
    const existingUser = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const now = new Date().toISOString();
    const newUser = await db.insert(adminUsers)
      .values({
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        role: role || 'user',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(excludePassword(newUser[0]), { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Handle email update
    if (email !== undefined) {
      // Validate email format
      if (!isValidEmail(email)) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      const sanitizedEmail = email.trim().toLowerCase();

      // Check if email is already taken by another user
      const emailCheck = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.email, sanitizedEmail))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== userId) {
        return NextResponse.json({ 
          error: "Email already exists",
          code: "EMAIL_EXISTS" 
        }, { status: 400 });
      }

      updates.email = sanitizedEmail;
    }

    // Handle password update
    if (password !== undefined) {
      // Validate password length
      if (password.length < 6) {
        return NextResponse.json({ 
          error: "Password must be at least 6 characters long",
          code: "INVALID_PASSWORD" 
        }, { status: 400 });
      }

      updates.password = await bcrypt.hash(password, 10);
    }

    // Handle name update
    if (name !== undefined) {
      updates.name = name.trim();
    }

    // Handle role update
    if (role !== undefined) {
      updates.role = role;
    }

    // Update user
    const updatedUser = await db.update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, userId))
      .returning();

    return NextResponse.json(excludePassword(updatedUser[0]), { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Delete user
    const deleted = await db.delete(adminUsers)
      .where(eq(adminUsers.id, userId))
      .returning();

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