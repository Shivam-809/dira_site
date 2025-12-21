import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt, customerName, customerEmail, customerPhone } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials missing');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
      },
    };

    console.log('📦 Creating Razorpay order:', options);

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created:', order.id);

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}
