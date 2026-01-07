
import { db } from "@/db";
import { orderTracking, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.error("❌ Shiprocket credentials missing");
    return null;
  }

  try {
    const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Shiprocket login failed");
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("❌ Error getting Shiprocket token:", error);
    return null;
  }
}

export async function createShiprocketOrder(orderId: number) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      console.error(`❌ Order not found: ${orderId}`);
      return;
    }

    const token = await getShiprocketToken();
    if (!token) return;

    const shippingAddress = typeof order.shippingAddress === 'string' 
      ? JSON.parse(order.shippingAddress) 
      : order.shippingAddress;
      
    const items = typeof order.items === 'string' 
      ? JSON.parse(order.items) 
      : order.items;

    if (!Array.isArray(items)) {
      console.error("❌ Order items is not an array");
      return;
    }

      // Prepare Shiprocket order data
        const shiprocketOrderData = {
          order_id: order.id.toString(),
          order_date: new Date(order.createdAt).toISOString().split('T')[0],
          pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
          billing_customer_name: (shippingAddress.name || "Customer").split(' ')[0] || "Customer",
          billing_last_name: (shippingAddress.name || "").split(' ').slice(1).join(' ') || "Customer",
          billing_address: shippingAddress.address || shippingAddress.street || "Address not provided",
          billing_address_2: shippingAddress.address2 || "",
          billing_city: shippingAddress.city || "City not provided",
          billing_pincode: shippingAddress.pincode || shippingAddress.zip || "000000",
          billing_state: shippingAddress.state || "State not provided",
          billing_country: shippingAddress.country || "India",
          billing_email: shippingAddress.email || "customer@example.com",
          billing_phone: (shippingAddress.phone || "").replace(/\D/g, '').slice(-10) || "0000000000",
          shipping_is_billing: true,
          is_test: process.env.SHIPROCKET_TEST_MODE === "true" ? 1 : 0,
          order_items: items.map((item: any) => ({
            name: item.name || "Product",
            sku: (item.sku || item.id || item.productId || Math.random().toString(36).substring(7)).toString(),
            units: item.quantity || 1,
            selling_price: item.price || 0,
            discount: 0,
            tax: 0,
            hsn: ""
          })),
          payment_method: "Prepaid",
          sub_total: order.totalAmount,
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5
        };

      console.log(`📤 Sending order ${order.id} to Shiprocket...`);

      const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shiprocketOrderData),
      });

      const result = await response.json();

      if (response.ok && result.order_id) {
        console.log(`✅ Shiprocket order created: ${result.order_id}, Shipment ID: ${result.shipment_id}`);
        // Update order with Shiprocket ID
        await db.update(orders)
          .set({ 
            shiprocketOrderId: result.order_id.toString(),
            shiprocketShipmentId: result.shipment_id?.toString() || null,
            trackingId: result.shipment_id?.toString() || null, // AWB is usually generated later, but shipment_id is a good start
            courierName: result.courier_name || null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(orders.id, orderId));
        
      // Log initial status
      await db.insert(orderTracking).values({
        orderId: orderId,
        status: "Shiprocket Order Created",
        description: "Order has been synchronized with Shiprocket",
        location: "System",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      console.error("❌ Shiprocket order creation failed:", result);
    }
  } catch (error) {
    console.error("❌ Error in createShiprocketOrder:", error);
  }
}
