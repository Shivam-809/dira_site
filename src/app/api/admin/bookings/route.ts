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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
