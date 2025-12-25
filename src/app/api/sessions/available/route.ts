import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceSlots } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    const today = new Date().toISOString().split('T')[0];

    let query = db.select().from(serviceSlots)
      .where(
        and(
          eq(serviceSlots.isAvailable, true),
          gte(serviceSlots.date, today)
        )
      );
    
    // If serviceId is provided, get slots for that service OR general slots (serviceId is null)
    // If not provided, just get general slots or all slots? 
    // Usually SessionBooking is for a specific service or general.
    
    const slots = await query;

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
