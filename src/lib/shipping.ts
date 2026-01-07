import { db } from "@/db";
import { orders, orderTracking } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createShipment(orderId: number, shippingData: any) {
  try {
    // This is a placeholder for actual shipping provider integration (e.g., Shiprocket, Delhivery)
    // For now, we simulate the shipment creation
    const trackingId = `TRK${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const courierName = "Dira Express";

    await db.update(orders)
      .set({ 
        trackingId, 
        courierName,
        status: 'shipped',
        updatedAt: new Date().toISOString() 
      })
      .where(eq(orders.id, orderId));

    await db.insert(orderTracking).values({
      orderId,
      status: 'shipped',
      description: 'Order has been picked up by the courier partner.',
      location: 'Warehouse',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, trackingId, courierName };
  } catch (error) {
    console.error("Failed to create shipment:", error);
    return { success: false, error };
  }
}

export async function updateTracking(trackingId: string, status: string, description: string, location?: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.trackingId, trackingId)
    });

    if (!order) throw new Error("Order not found for tracking ID");

    await db.insert(orderTracking).values({
      orderId: order.id,
      status,
      description,
      location: location || 'Transit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.update(orders)
      .set({ 
        status: status.toLowerCase(),
        updatedAt: new Date().toISOString() 
      })
      .where(eq(orders.id, order.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to update tracking:", error);
    return { success: false, error };
  }
}
