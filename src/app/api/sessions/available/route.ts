import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceSlots } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    const today = new Date().toISOString().split('T')[0];

    // Build the query to get slots that are either general (serviceId is null)
    // or specifically for this service.
    // However, if serviceId is provided, the admin might want to show ONLY slots for that service
    // or both. Usually, it's specific.
    
    let whereClause;
    if (serviceId) {
      whereClause = and(
        eq(serviceSlots.isAvailable, true),
        gte(serviceSlots.date, today),
        eq(serviceSlots.serviceId, parseInt(serviceId))
      );
    } else {
      whereClause = and(
        eq(serviceSlots.isAvailable, true),
        gte(serviceSlots.date, today)
      );
    }

    const slots = await db.select().from(serviceSlots).where(whereClause);

    // Map to the expected format if needed
    const formattedSlots = slots.map(slot => ({
      id: slot.id,
      date: slot.date,
      time: slot.time,
      available: slot.isAvailable,
      serviceId: slot.serviceId
    }));

    return NextResponse.json(formattedSlots, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
