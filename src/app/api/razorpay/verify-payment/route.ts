import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { serviceBookings, courseEnrollments, orders, cart, orderTracking } from '@/db/schema';
import { sendEmail } from '@/lib/email';
import { createShippingOrder } from '@/lib/shipping';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature,
      type, // 'service' or 'course' or 'order'
      data // booking or enrollment or order data
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
        sessionType: data.sessionType,
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
      } else if (type === 'order') {
        // Create order in DB
        const [newOrder] = await db.insert(orders).values({
          userId: data.userId,
          items: JSON.stringify(data.items),
          totalAmount: data.totalAmount,
          status: 'paid',
          paymentIntentId: razorpayPaymentId,
          shippingAddress: JSON.stringify(data.shippingAddress),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning();

        // Add initial tracking log
        await db.insert(orderTracking).values({
          orderId: newOrder.id,
          status: 'Paid',
          description: 'Payment verified. Order is being processed.',
          location: 'System',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Trigger Shipping Order Creation (Async but we'll wait for the ID)
        try {
          const shippingItems = data.items.map((item: any) => ({
            name: item.name,
            sku: `PROD-${item.productId}`,
            units: item.quantity,
            sell_price: item.price,
          }));

          const shippingPayload = {
            order_id: newOrder.id.toString(),
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "Primary",
            billing_customer_name: data.shippingAddress.name.split(' ')[0],
            billing_last_name: data.shippingAddress.name.split(' ').slice(1).join(' ') || 'Customer',
            billing_address: data.shippingAddress.address || data.shippingAddress.street,
            billing_city: data.shippingAddress.city,
            billing_pincode: data.shippingAddress.zip || data.shippingAddress.zipCode,
            billing_state: data.shippingAddress.state,
            billing_country: data.shippingAddress.country,
            billing_email: data.shippingAddress.email || data.clientEmail,
            billing_phone: data.shippingAddress.phone || data.clientPhone,
            shipping_is_billing: true,
            order_items: shippingItems,
            payment_method: "Prepaid",
            sub_total: data.totalAmount,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
          };

          const shiprocketResponse = await createShippingOrder(shippingPayload);
          
          if (shiprocketResponse.order_id) {
            await db.update(orders).set({
              shippingOrderId: shiprocketResponse.order_id.toString(),
              shippingShipmentId: shiprocketResponse.shipment_id?.toString(),
              status: 'placed',
              updatedAt: new Date().toISOString(),
            }).where(eq(orders.id, newOrder.id));

            await db.insert(orderTracking).values({
              orderId: newOrder.id,
              status: 'Placed',
              description: `Order placed with shipping provider. Shipment ID: ${shiprocketResponse.shipment_id}`,
              location: 'Shiprocket Hub',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (shipError) {
          console.error('Failed to create shipping order:', shipError);
        }

        // Clear user's cart
        await db.delete(cart).where(eq(cart.userId, data.userId));


      // Send order confirmation email
      try {
        await sendEmail({
          to: data.shippingAddress.email || data.clientEmail,
          subject: '🛍️ Order Confirmed - Dira',
          html: `
            <div style="font-family: serif; padding: 20px; color: #1a1a1a;">
              <h1 style="color: #6b21a8;">Order Confirmed!</h1>
              <p>Hi ${data.shippingAddress.name},</p>
              <p>Thank you for your purchase from Dira. Your order <strong>#${newOrder[0].id}</strong> has been received and is being processed.</p>
              <div style="background: #fdf6e3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
                <p><strong>Payment ID:</strong> ${razorpayPaymentId}</p>
              </div>
              <p>We'll notify you once your treasures are on their way!</p>
              <p>Best regards,<br/>Dira Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send order email:', emailError);
      }
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
