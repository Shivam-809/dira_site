import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Received create-order request:', body);
    const { amount, currency = 'INR', receipt, customerName, customerEmail, customerPhone } = body;

    // Ensure amount is a number and convert to paise
    const numericAmount = parseFloat(String(amount));
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amountInPaise = Math.round(numericAmount * 100);

    console.log('🔢 Amount conversion:', {
      original: amount,
      numeric: numericAmount,
      paise: amountInPaise
    });

    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: 'Minimum order amount is ₹1.00' },
        { status: 400 }
      );
    }

    const options = {
      amount: amountInPaise, // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
      },
    };

    console.log('📦 Creating Razorpay order:', {
      ...options,
      originalAmount: amount,
      amountInPaise
    });

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
