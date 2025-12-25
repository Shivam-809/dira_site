import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    let query = db.select().from(services).where(eq(services.isActive, true));
    
    if (category) {
      const allServices = await db.select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(desc(services.createdAt));
      
      const filtered = allServices.filter(s => s.category === category);
      return NextResponse.json(filtered);
    }

    const allServices = await db.select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(desc(services.createdAt));

    return NextResponse.json(allServices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
