import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceSlots } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');

    let query = db.select().from(serviceSlots);
    
    if (serviceId) {
      const slots = await query.where(eq(serviceSlots.serviceId, parseInt(serviceId)));
      return NextResponse.json(slots);
    }

    const allSlots = await query;
    return NextResponse.json(allSlots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    console.log('Received slots request body:', body);
    const { serviceId, date, time, slots: bulkSlots, isAvailable } = body;

    if (bulkSlots && Array.isArray(bulkSlots)) {
      console.log('Handling bulk slots:', bulkSlots);
      const insertedSlots = [];
      for (const slot of bulkSlots) {
        try {
          const result = await db.insert(serviceSlots).values({
            serviceId: serviceId ? parseInt(serviceId) : null,
            date: slot.date || date,
            time: slot.time,
            isAvailable: slot.isAvailable ?? isAvailable ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).returning();
          insertedSlots.push(result[0]);
        } catch (err) {
          console.error('Error inserting individual slot:', err, slot);
          throw err;
        }
      }
      return NextResponse.json(insertedSlots);
    }

    console.log('Handling single slot:', { serviceId, date, time, isAvailable });
    const newSlot = await db.insert(serviceSlots).values({
      serviceId: serviceId ? parseInt(serviceId) : null,
      date,
      time,
      isAvailable: isAvailable ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newSlot[0]);
  } catch (error: any) {
    console.error('API Error in /api/admin/services/slots:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { isAvailable, time, date } = body;

    const updatedSlot = await db.update(serviceSlots)
      .set({
        isAvailable,
        time,
        date,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(serviceSlots.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedSlot[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(serviceSlots).where(eq(serviceSlots.id, parseInt(id)));

    return NextResponse.json({ message: 'Slot deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
