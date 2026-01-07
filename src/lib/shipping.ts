
import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq } from "drizzle-orm";

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v2/gateway/libs";

export class ShippingService {
  private static token: string | null = null;

  private static async getToken() {
    if (this.token) return this.token;

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      console.error("Shiprocket credentials missing");
      return null;
    }

    try {
      const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Shiprocket auth failed");

      const data = await response.json();
      this.token = data.token;
      return this.token;
    } catch (error) {
      console.error("Error getting Shiprocket token:", error);
      return null;
    }
  }

  static async createShipment(orderId: number) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) return { success: false, error: "Order not found" };

      const shippingAddress = order.shippingAddress as any;
      
      // Map order items for Shiprocket
      const items = JSON.parse(order.items as string || '[]').map((item: any) => ({
        name: item.name,
        sku: item.id.toString(),
        units: item.quantity,
        selling_price: item.price,
        discount: "",
        tax: "",
        hsn: ""
      }));

      const payload = {
        order_id: order.id.toString(),
        order_date: new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location: "Primary", // Should be configured in Shiprocket
        billing_customer_name: shippingAddress.name,
        billing_last_name: "",
        billing_address: shippingAddress.address,
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.pincode,
        billing_state: shippingAddress.state,
        billing_country: "India",
        billing_email: shippingAddress.email,
        billing_phone: shippingAddress.phone,
        shipping_is_billing: true,
        order_items: items,
        payment_method: "Prepaid",
        sub_total: order.totalAmount,
        length: 10,
        width: 10,
        height: 10,
        weight: 0.5
      };

      const token = await this.getToken();
      if (!token) return { success: false, error: "Auth failed" };

      const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.order_id) {
        await db
          .update(orders)
          .set({
            status: "processing",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, orderId));
          
        return { success: true, shiprocket_order_id: data.order_id };
      }

      return { success: false, error: data.message || "Failed to create shipment" };
    } catch (error) {
      console.error("Error creating shipment:", error);
      return { success: false, error: "Internal error" };
    }
  }

  static async updateTracking(payload: any) {
    try {
      const {
        awb,
        current_status,
        order_id, // This is our system's order ID if we sent it correctly
        courier_name,
        current_timestamp,
        scans
      } = payload;

      // Find order by ID (Shiprocket's order_id field in webhook is usually our system's ID)
      console.log("🔍 Looking for order ID:", order_id);
      const orderIdNum = typeof order_id === 'string' ? parseInt(order_id) : order_id;
      
      if (isNaN(orderIdNum)) {
        console.error("❌ Invalid order ID in webhook:", order_id);
        return false;
      }

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderIdNum))
        .limit(1);

      if (!orderResult || orderResult.length === 0) {
        console.error("❌ Order not found for tracking update:", orderIdNum);
        return false;
      }

      const order = orderResult[0];
      console.log("✅ Found order:", order.id);

      // Update order status and tracking info
      await db
        .update(orders)
        .set({
          status: current_status.toLowerCase(),
          trackingId: awb,
          courierName: courier_name,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderIdNum));

      console.log("📝 Inserting tracking record...");
      // Add to tracking history
      await db.insert(orderTracking).values({
        orderId: orderIdNum,
        status: current_status,
        description: scans?.[0]?.activity || `Status updated to ${current_status}`,
        location: scans?.[0]?.location || "In Transit",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Tracking record inserted");

      return true;
    } catch (error) {
      console.error("Error updating tracking:", error);
      return false;
    }
  }
}
