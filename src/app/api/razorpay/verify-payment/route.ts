import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { serviceBookings, courseEnrollments } from '@/db/schema';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature,
      type, // 'service' or 'course'
      data // booking or enrollment data
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay secret key not configured');
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpaySignature;

    if (!isSignatureValid) {
      console.error('❌ Payment signature verification failed');
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 401 }
      );
    }

    console.log('✅ Payment verified successfully:', razorpayPaymentId);

    // Save to database based on type
    if (type === 'service') {
      await db.insert(serviceBookings).values({
        serviceId: data.serviceId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: data.date,
        timeSlot: data.timeSlot,
        notes: data.notes,
        status: 'paid',
        paymentId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        amount: data.amount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send confirmation email
      try {
        await sendEmail({
          to: data.clientEmail,
          subject: '✨ Booking Confirmed - Dira',
          html: `
            <div style="font-family: serif; padding: 20px; color: #1a1a1a;">
              <h1 style="color: #6b21a8;">Booking Confirmed!</h1>
              <p>Hi ${data.clientName},</p>
              <p>Your booking for <strong>${data.serviceName}</strong> has been confirmed.</p>
              <div style="background: #fdf6e3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Date:</strong> ${data.date}</p>
                <p><strong>Time:</strong> ${data.timeSlot}</p>
                <p><strong>Payment ID:</strong> ${razorpayPaymentId}</p>
              </div>
              <p>We look forward to seeing you!</p>
              <p>Best regards,<br/>Dira Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

    } else if (type === 'course') {
      await db.insert(courseEnrollments).values({
        courseId: data.courseId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        deliveryType: data.deliveryType,
        status: 'paid',
        paymentId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        amount: data.amount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send confirmation email
      try {
        await sendEmail({
          to: data.clientEmail,
          subject: '✨ Course Enrollment Confirmed - Dira',
          html: `
            <div style="font-family: serif; padding: 20px; color: #1a1a1a;">
              <h1 style="color: #6b21a8;">Enrollment Confirmed!</h1>
              <p>Hi ${data.clientName},</p>
              <p>You have successfully enrolled in <strong>${data.courseName}</strong>.</p>
              <div style="background: #fdf6e3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Delivery Type:</strong> ${data.deliveryType === 'one-to-one' ? 'One-to-One Live Session' : 'Recorded Content'}</p>
                <p><strong>Payment ID:</strong> ${razorpayPaymentId}</p>
              </div>
              <p>You can now access your course content.</p>
              <p>Best regards,<br/>Dira Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send enrollment email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified and data saved successfully',
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
