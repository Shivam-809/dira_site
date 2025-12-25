import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courseEnrollments, courses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const allEnrollments = await db.select({
      id: courseEnrollments.id,
      courseId: courseEnrollments.courseId,
      courseName: courses.heading,
      clientName: courseEnrollments.clientName,
      clientEmail: courseEnrollments.clientEmail,
      clientPhone: courseEnrollments.clientPhone,
      deliveryType: courseEnrollments.deliveryType,
      status: courseEnrollments.status,
      amount: courseEnrollments.amount,
      paymentId: courseEnrollments.paymentId,
      createdAt: courseEnrollments.createdAt,
    })
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .orderBy(desc(courseEnrollments.createdAt));

    return NextResponse.json(allEnrollments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
