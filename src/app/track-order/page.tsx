"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Truck, Package, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { Separator } from "@/components/ui/separator";

interface TrackingInfo {
  orderId: number;
  status: string;
  amount: number;
  lastUpdated: string;
  placedAt: string;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingInfo | null>(null);
  const { formatPrice } = useCurrency();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error("Please enter an Order ID");
      return;
    }

    setLoading(true);
    setTrackingData(null);

    try {
      const response = await fetch(`/api/orders/track?order_id=${orderId}`);
      const data = await response.json();

      if (response.ok) {
        setTrackingData(data);
      } else {
        toast.error(data.error || "Order not found");
      }
    } catch (error) {
      console.error("Tracking error:", error);
      toast.error("Failed to fetch tracking information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
      case "shipped":
        return <Truck className="h-8 w-8 text-blue-500" />;
      case "processing":
      case "placed":
      case "paid":
        return <Clock className="h-8 w-8 text-amber-500" />;
      default:
        return <Package className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col font-serif">
      <Navbar />
      
      <main className="flex-1 py-20 bg-primary/[0.02]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-primary">Track Your Order</h1>
              <p className="text-muted-foreground italic text-lg">Enter your order ID to see the current status of your sacred items.</p>
            </div>

            <Card className="gold-border shadow-xl bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-8">
                <form onSubmit={handleTrack} className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. 12345"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="pl-10 h-14 text-lg border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="h-14 px-8 bg-primary hover:bg-primary/90 text-lg">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Track"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {trackingData && (
              <Card className="gold-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="border-b border-primary/10 bg-primary/[0.03]">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">Order ID</p>
                      <CardTitle className="text-2xl font-cinzel">#{trackingData.orderId}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">Amount</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(trackingData.amount)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-8 space-y-8">
                  <div className="flex items-center gap-6 p-6 bg-white rounded-xl border border-primary/5 shadow-sm">
                    <div className="p-4 bg-primary/5 rounded-full">
                      {getStatusIcon(trackingData.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">Current Status</p>
                      <h3 className="text-3xl font-bold text-foreground">
                        {getStatusDisplay(trackingData.status)}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Order Placed</p>
                      <p className="text-lg font-medium">
                        {new Date(trackingData.placedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trackingData.placedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Last Updated</p>
                      <p className="text-lg font-medium">
                        {new Date(trackingData.lastUpdated).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trackingData.lastUpdated).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="bg-primary/10" />
                  
                  <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 flex gap-3 items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 italic">
                      Please note that status updates may take up to 24 hours to reflect after changes are made.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 flex justify-center py-6">
                  <p className="text-sm text-muted-foreground italic">
                    Thank you for trusting Dira with your spiritual journey.
                  </p>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
