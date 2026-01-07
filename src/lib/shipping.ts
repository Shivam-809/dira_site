import { db } from '@/db';
import { orders, orderTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ShippingData {
  orderId: number;
  customerName: string;
  address: string;
  phone: string;
  email: string;
  items: any[];
}

export const shippingService = {
  /**
   * Creates a shipment with the provider
   * In a real app, this would call Shiprocket, Delhivery, etc.
   */
  async createShipment(data: ShippingData) {
    console.log('📦 Creating shipment for order:', data.orderId);
    
    // Simulate API call to shipping provider
    const mockTrackingId = `SHIP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const mockCourier = 'Dira Express';
    
    // Update order with shipping details
    await db.update(orders)
      .set({
        courierName: mockCourier,
        trackingId: mockTrackingId,
        status: 'shipped',
        updatedAt: new Date().toISOString()
      })
      .where(eq(orders.id, data.orderId));
      
    // Create initial tracking entry
    await db.insert(orderTracking).values({
      orderId: data.orderId,
      status: 'shipped',
      description: 'Order has been packed and handed over to the courier.',
      location: 'Warehouse',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      trackingId: mockTrackingId,
      courier: mockCourier
    };
  },

  /**
   * Updates tracking info from webhook
   */
  async updateTracking(orderId: number, status: string, description: string, location?: string) {
    await db.insert(orderTracking).values({
      orderId,
      status,
      description,
      location: location || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update main order status if necessary
    if (['delivered', 'cancelled', 'returned'].includes(status.toLowerCase())) {
      await db.update(orders)
        .set({ 
          status: status.toLowerCase(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(orders.id, orderId));
    }
  }
};
