
export interface ShippingOrderData {
  order_id: string;
  order_date: string;
  pickup_location?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  width: number;
  height: number;
  weight: number;
}

class ShippingService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  private async authenticate() {
    const now = Date.now();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
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
      this.token = data.token;
      // Token is valid for 10 days, let's refresh every 9 days
      this.tokenExpiry = now + 9 * 24 * 60 * 60 * 1000;
      return this.token;
    } catch (error) {
      console.error("Shipping authentication error:", error);
      throw error;
    }
  }

  async createOrder(orderData: ShippingOrderData) {
    const token = await this.authenticate();

    try {
      const response = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Shipping order creation error:", data);
        throw new Error(data.message || "Failed to create shipping order");
      }

      return data;
    } catch (error) {
      console.error("Shipping service error:", error);
      throw error;
    }
  }

  async trackShipment(shipmentId: string) {
    const token = await this.authenticate();

    try {
      const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to track shipment");
      }

      return await response.json();
    } catch (error) {
      console.error("Shipping tracking error:", error);
      throw error;
    }
  }

  async getTrackingByAWB(awb: string) {
    const token = await this.authenticate();

    try {
      const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to track AWB");
      }

      return await response.json();
    } catch (error) {
      console.error("Shipping AWB tracking error:", error);
      throw error;
    }
  }
}

export const shippingService = new ShippingService();
