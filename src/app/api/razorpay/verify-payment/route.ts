import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

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

    // Verify signature: HMAC SHA256(order_id|payment_id, key_secret)
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

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
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
