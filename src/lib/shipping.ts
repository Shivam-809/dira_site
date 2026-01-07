
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

      const shippingAddress = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : (order.shippingAddress || {});
      
      // Map order items for Shiprocket
      const items = (typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])).map((item: any) => ({
        name: item.name,
        sku: item.id?.toString() || "SKU",
        units: item.quantity,
        selling_price: item.price,
        discount: "",
        tax: "",
        hsn: ""
      }));

      const payload = {
        order_id: order.id.toString(),
        order_date: new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location: "Primary",
        billing_customer_name: shippingAddress.name || "Customer",
        billing_last_name: "",
        billing_address: shippingAddress.address || "Address",
        billing_city: shippingAddress.city || "City",
        billing_pincode: shippingAddress.pincode || "000000",
        billing_state: shippingAddress.state || "State",
        billing_country: "India",
        billing_email: shippingAddress.email || "email@example.com",
        billing_phone: shippingAddress.phone || "0000000000",
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
        order_id,
        courier_name,
        scans
      } = payload;

      console.log("🔍 Looking for order ID:", order_id);

      // Handle dummy/test payloads from Shiprocket
      if (typeof order_id === 'string' && order_id.includes('dummpy')) {
        console.log("ℹ️ Received test webhook from Shiprocket. Skipping processing.");
        return true; 
      }

      const orderIdNum = typeof order_id === 'string' ? parseInt(order_id) : order_id;
      
      if (isNaN(orderIdNum)) {
        console.error("❌ Invalid order ID in webhook:", order_id);
        // We return true here to acknowledge receipt even if ID is invalid, to stop retries
        return true; 
      }

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderIdNum))
        .limit(1);

      if (!orderResult || orderResult.length === 0) {
        console.warn("⚠️ Order not found for tracking update:", orderIdNum);
        // Maybe try to find by trackingId if we have it
        if (awb) {
          const fallbackResult = await db
            .select()
            .from(orders)
            .where(eq(orders.trackingId, awb))
            .limit(1);
          
          if (fallbackResult.length > 0) {
            console.log("✅ Found order by tracking ID fallback:", fallbackResult[0].id);
            return this.processUpdate(fallbackResult[0].id, payload);
          }
        }
        return true; // Still return true to stop Shiprocket retries
      }

      return this.processUpdate(orderIdNum, payload);
    } catch (error) {
      console.error("Error updating tracking:", error);
      return false;
    }
  }

  private static async processUpdate(orderId: number, payload: any) {
    const { awb, current_status, courier_name, scans } = payload;
    
    await db
      .update(orders)
      .set({
        status: current_status.toLowerCase(),
        trackingId: awb,
        courierName: courier_name,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    await db.insert(orderTracking).values({
      orderId: orderId,
      status: current_status,
      description: scans?.[0]?.activity || `Status updated to ${current_status}`,
      location: scans?.[0]?.location || "In Transit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Tracking updated for order ${orderId}`);
    return true;
  }
}
