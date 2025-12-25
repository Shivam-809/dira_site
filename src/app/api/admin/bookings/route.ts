import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceBookings, services } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const allBookings = await db.select({
      id: serviceBookings.id,
      serviceId: serviceBookings.serviceId,
      serviceName: services.heading,
      clientName: serviceBookings.clientName,
      clientEmail: serviceBookings.clientEmail,
      clientPhone: serviceBookings.clientPhone,
      date: serviceBookings.date,
      timeSlot: serviceBookings.timeSlot,
      status: serviceBookings.status,
      amount: serviceBookings.amount,
      paymentId: serviceBookings.paymentId,
      createdAt: serviceBookings.createdAt,
    })
      .from(serviceBookings)
      .leftJoin(services, eq(serviceBookings.serviceId, services.id))
      .orderBy(desc(serviceBookings.createdAt));

      return NextResponse.json(allBookings);
    } catch (error: any) {
      console.error("GET Bookings Error:", error);
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
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

      const body = await request.json();
      const { status } = body;

      const updated = await db.update(serviceBookings)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(serviceBookings.id, parseInt(id)))
        .returning();

      return NextResponse.json(updated[0]);
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
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

      await db.delete(serviceBookings).where(eq(serviceBookings.id, parseInt(id)));
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

