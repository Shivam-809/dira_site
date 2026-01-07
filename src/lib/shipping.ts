
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getShippingToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with shipping provider");
  }

  const data = await response.json();
  cachedToken = data.token;
  // Token usually expires in 10 days, setting safety margin
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

export async function createShippingOrder(orderId: number) {
  try {
    const token = await getShippingToken();

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new Error("Order not found");

    const shippingAddress = JSON.parse(order.shippingAddress as string);
    const items = JSON.parse(order.items as string);

    const orderData = {
      order_id: order.id.toString(),
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: "Primary", // Should be configured in Shiprocket panel
      billing_customer_name: shippingAddress.name,
      billing_last_name: "",
      billing_address: shippingAddress.address,
      billing_address_2: "",
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
        discount: "",
        tax: "",
        hsn: ""
      })),
      payment_method: "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.totalAmount,
      length: 10,
      width: 10,
      height: 10,
      weight: 0.5
    };

    const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (data.order_id) {
      await db.update(orders)
        .set({
          shippingOrderId: data.order_id.toString(),
          shippingShipmentId: data.shipment_id.toString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId));
      
      return data;
    } else {
      console.error("Shipping order creation failed:", data);
      return null;
    }
  } catch (error) {
    console.error("Error in createShippingOrder:", error);
    return null;
  }
}

export async function getShippingTracking(shipmentId: string) {
  try {
    const token = await getShippingToken();
    const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/shipment/${shipmentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching shipping tracking:", error);
    return null;
  }
}
