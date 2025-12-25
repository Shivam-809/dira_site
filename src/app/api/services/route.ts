import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    let query = db.select().from(services);
    
    if (category) {
      query = query.where(and(eq(services.isActive, true), eq(services.category, category))) as any;
    } else {
      query = query.where(eq(services.isActive, true)) as any;
    }
    
    const results = await query.orderBy(desc(services.createdAt));
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
