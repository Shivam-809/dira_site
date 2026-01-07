
import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq } from "drizzle-orm";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

async function getAuthToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("Shiprocket credentials not configured");
  }

  const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Shiprocket");
  }

  const data = await response.json();
  return data.token;
}

export async function createShiprocketOrder(orderId: number) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) throw new Error("Order not found");

    const token = await getAuthToken();
    const shippingAddress = typeof order.shippingAddress === 'string' 
      ? JSON.parse(order.shippingAddress) 
      : order.shippingAddress;
    
    const items = typeof order.items === 'string'
      ? JSON.parse(order.items)
      : order.items;

    // Prepare Shiprocket payload
    const payload = {
      order_id: order.id.toString(),
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: "Primary", // Should match Shiprocket dashboard
      billing_customer_name: shippingAddress.name.split(' ')[0],
      billing_last_name: shippingAddress.name.split(' ').slice(1).join(' ') || ".",
      billing_address: shippingAddress.address,
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: "India",
      billing_email: shippingAddress.email,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: items.map((item: any) => ({
        name: item.name,
        sku: item.id.toString(),
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: 0
      })),
      payment_method: "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.totalAmount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.order_id) {
      await db.update(orders)
        .set({ 
          status: 'processing',
          updatedAt: new Date().toISOString()
        })
        .where(eq(orders.id, order.id));
      
      // Log tracking
      await db.insert(orderTracking).values({
        orderId: order.id,
        status: 'Order Placed',
        description: 'Order successfully synced with shipping partner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return result;
    }
    
    return null;
  } catch (error) {
    console.error("Shiprocket order creation failed:", error);
    return null;
  }
}

export async function getTrackingDetails(awbCode: string) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/track/awb/${awbCode}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch tracking details:", error);
    return null;
  }
}
