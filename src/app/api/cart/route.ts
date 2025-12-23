import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cart, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

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

    // Single cart item fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const cartItem = await db
        .select()
        .from(cart)
        .where(eq(cart.id, parseInt(id)))
        .limit(1);

      if (cartItem.length === 0) {
        return NextResponse.json(
          { error: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Verify user owns this cart item (unless admin)
      if (session.user.role !== 'admin' && cartItem[0].userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      return NextResponse.json(cartItem[0], { status: 200 });
    }

    // List cart items - users can only see their own cart
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(cart);

    // Non-admin users can only see their own cart items
    if (session.user.role !== 'admin') {
      query = query.where(eq(cart.userId, session.user.id));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { productId, quantity } = body;

    // Use authenticated user's ID
    const userId = session.user.id;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    // Validate productId
    const productIdInt = parseInt(productId);
    if (isNaN(productIdInt)) {
      return NextResponse.json(
        { error: 'Valid product ID is required', code: 'INVALID_PRODUCT_ID' },
        { status: 400 }
      );
    }

    // Check product stock
    const productData = await db
      .select()
      .from(products)
      .where(eq(products.id, productIdInt))
      .limit(1);

    if (productData.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const availableStock = productData[0].stock || 0;

    // Validate quantity if provided
    let quantityValue = 1; // default
    if (quantity !== undefined) {
      const quantityInt = parseInt(quantity);
      if (isNaN(quantityInt) || quantityInt < 1) {
        return NextResponse.json(
          { error: 'Quantity must be a positive integer (minimum 1)', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
      
      if (quantityInt > availableStock) {
        return NextResponse.json(
          { error: `Only ${availableStock} items available in stock`, code: 'INSUFFICIENT_STOCK' },
          { status: 400 }
        );
      }
      
      quantityValue = quantityInt;
    }

    const now = new Date().toISOString();

    const newCartItem = await db
      .insert(cart)
      .values({
        userId: userId,
        productId: productIdInt,
        quantity: quantityValue,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newCartItem[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const idInt = parseInt(id);

    // Check if cart item exists
    const existingCartItem = await db
      .select()
      .from(cart)
      .where(eq(cart.id, idInt))
      .limit(1);

    if (existingCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user owns this cart item (unless admin)
    if (session.user.role !== 'admin' && existingCartItem[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    // Validate quantity if provided
    if (quantity !== undefined) {
      const quantityInt = parseInt(quantity);
      if (isNaN(quantityInt) || quantityInt < 1) {
        return NextResponse.json(
          { error: 'Quantity must be a positive integer (minimum 1)', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }

      // Check stock
      const productData = await db
        .select()
        .from(products)
        .where(eq(products.id, existingCartItem[0].productId))
        .limit(1);
      
      const availableStock = productData[0]?.stock || 0;
      if (quantityInt > availableStock) {
        return NextResponse.json(
          { error: `Only ${availableStock} items available in stock`, code: 'INSUFFICIENT_STOCK' },
          { status: 400 }
        );
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (quantity !== undefined) {
      updates.quantity = parseInt(quantity);
    }

    const updatedCartItem = await db
      .update(cart)
      .set(updates)
      .where(eq(cart.id, idInt))
      .returning();

    return NextResponse.json(updatedCartItem[0], { status: 200 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const idInt = parseInt(id);

    // Check if cart item exists
    const existingCartItem = await db
      .select()
      .from(cart)
      .where(eq(cart.id, idInt))
      .limit(1);

    if (existingCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user owns this cart item (unless admin)
    if (session.user.role !== 'admin' && existingCartItem[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(cart)
      .where(eq(cart.id, idInt))
      .returning();

    return NextResponse.json(
      { message: 'Cart item removed successfully', id: deleted[0].id },
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