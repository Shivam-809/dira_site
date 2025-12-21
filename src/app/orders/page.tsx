"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Loader2, MapPin, Truck, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface Order {
  id: number;
  userId: string;
  items: Array<{ productId: number; quantity: number; price: number }>;
  totalAmount: number;
  status: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  createdAt: string;
}

interface TrackingUpdate {
  id: number;
  orderId: number;
  status: string;
  location: string | null;
  description: string;
  timestamp: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingUpdate[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        toast.error("Please login to view orders");
        router.push("/login");
      } else {
        fetchOrders();
      }
    }
  }, [session, isPending]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setTrackingDialogOpen(true);
    setLoadingTracking(true);

    try {
      const response = await fetch(`/api/orders/tracking?orderId=${orderId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      } else {
        toast.error("Failed to load tracking information");
        setTrackingData([]);
      }
    } catch (error) {
      console.error("Failed to fetch tracking:", error);
      toast.error("Failed to load tracking information");
      setTrackingData([]);
    } finally {
      setLoadingTracking(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      processing: "bg-blue-500",
      shipped: "bg-indigo-500",
      out_for_delivery: "bg-purple-500",
      delivered: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getTrackingIcon = (status: string) => {
    const icons: Record<string, any> = {
      order_placed: Clock,
      processing: Package,
      shipped: Truck,
      out_for_delivery: MapPin,
      delivered: CheckCircle2,
    };
    const Icon = icons[status] || Package;
    return <Icon className="h-5 w-5" />;
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">My Orders</h1>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
                <p className="text-muted-foreground">
                  Start shopping to see your orders here!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Order #{order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Items</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Product #{item.productId} x {item.quantity}
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Shipping Address</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress.name}<br />
                        {order.shippingAddress.address}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                        {order.shippingAddress.country}
                      </p>
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-semibold">Total</span>
                          <span className="text-2xl font-bold text-primary ml-4">
                            ₹{order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleTrackOrder(order.id)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Track Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Tracking - #{selectedOrderId}</DialogTitle>
          </DialogHeader>

          {loadingTracking ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trackingData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tracking information available yet.</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {trackingData.map((update, index) => (
                <div key={update.id} className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-3 ${
                      index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {getTrackingIcon(update.status)}
                    </div>
                    {index !== trackingData.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>

                  {/* Update content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{formatStatus(update.status)}</h4>
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        {new Date(update.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {update.description}
                    </p>
                    {update.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {update.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}