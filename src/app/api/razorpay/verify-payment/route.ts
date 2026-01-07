import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { serviceBookings, courseEnrollments, orders, cart, orderTracking } from '@/db/schema';
import { sendEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';
import { createShiprocketOrder, generateAWB } from '@/lib/shiprocket';

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
      // Create order
      const newOrder = await db.insert(orders).values({
        userId: data.userId,
        items: JSON.stringify(data.items),
        totalAmount: data.totalAmount,
        status: 'paid',
        paymentIntentId: razorpayPaymentId,
        shippingAddress: JSON.stringify(data.shippingAddress),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();

      // Clear user's cart
      await db.delete(cart).where(eq(cart.userId, data.userId));

      // Integrate Shiprocket
      try {
        const orderId = newOrder[0].id;
        const shipping = data.shippingAddress;
        
        const shiprocketOrderData = {
          order_id: orderId.toString(),
          order_date: new Date().toISOString(),
          pickup_location: "Primary", // This should match a pickup location in Shiprocket
          billing_customer_name: shipping.name,
          billing_last_name: "",
          billing_address: shipping.address,
          billing_address_2: shipping.apartment || "",
          billing_city: shipping.city,
          billing_pincode: shipping.pincode,
          billing_state: shipping.state,
          billing_country: "India",
          billing_email: shipping.email || data.clientEmail || "",
          billing_phone: shipping.phone,
          shipping_is_billing: true,
          order_items: data.items.map((item: any) => ({
            name: item.name,
            sku: item.id.toString(),
            units: item.quantity,
            selling_price: item.price.toString(),
          })),
          payment_method: "Prepaid",
          shipping_charges: 0,
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: 0,
          sub_total: data.totalAmount,
          length: 10, // Default dimensions
          width: 10,
          height: 10,
          weight: 0.5,
        };

        const shiprocketResponse = await createShiprocketOrder(shiprocketOrderData);
        console.log('✅ Shiprocket order created:', shiprocketResponse.order_id);

        if (shiprocketResponse.shipment_id) {
          const awbResponse = await generateAWB(shiprocketResponse.shipment_id);
          console.log('✅ Shiprocket AWB generated:', awbResponse);
          
          if (awbResponse && awbResponse.response && awbResponse.response.data && awbResponse.response.data.awb_code) {
            await db.update(orders)
              .set({ 
                trackingId: awbResponse.response.data.awb_code,
                courierName: awbResponse.response.data.courier_name,
                updatedAt: new Date().toISOString()
              })
              .where(eq(orders.id, orderId));
            
            // Initial tracking entry
            await db.insert(orderTracking).values({
              orderId: orderId,
              status: 'Processing',
              description: 'Order confirmed and being prepared for shipment.',
              location: 'Warehouse',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (shiprocketError) {
        console.error('❌ Shiprocket Integration Error:', shiprocketError);
        // We don't fail the whole request because payment was successful
      }

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
