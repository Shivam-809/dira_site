"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, Sparkles, ShoppingBag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      // Fetch order details
      fetch(`/api/orders?id=${orderId}`)
        .then((res) => res.json())
        .then((data) => setOrderData(data))
        .catch((err) => console.error("Error fetching order details:", err));

      // Fetch tracking details
      const token = localStorage.getItem("bearer_token");
      fetch(`/api/orders/tracking?orderId=${orderId}`, {
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` }),
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTrackingHistory(data);
          }
        })
        .catch((err) => console.error("Error fetching tracking details:", err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col font-serif">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
            <Sparkles className="absolute top-20 left-20 h-40 w-40 text-primary animate-pulse" />
            <Sparkles className="absolute bottom-20 right-20 h-40 w-40 text-primary animate-pulse decoration-300" />
        </div>

        <div className="max-w-2xl w-full bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-primary/20 gold-border shadow-2xl relative z-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-100/10 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl text-primary font-bebas tracking-wide">Payment Received!</h1>
            <p className="text-xl md:text-2xl text-foreground/80 italic">
              Thank you for your purchase. Your sacred items are being prepared.
            </p>
            <div className="flex justify-center items-center gap-2 text-primary/60">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm uppercase tracking-[0.2em] font-serif">Order Confirmed</span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          {orderData && (
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-6 text-left">
              <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Order ID</p>
                  <p className="text-lg font-mono">#{orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Amount</p>
                  <p className="text-xl text-primary font-bold">₹{orderData.totalAmount}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">Tracking Details</h3>
                    
                    {trackingHistory.length > 0 ? (
                      <div className="space-y-4 mt-3">
                        {trackingHistory.map((step, index) => (
                          <div key={step.id} className="relative pl-6 pb-2 border-l border-primary/20 last:border-0 last:pb-0">
                            <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                            <p className="text-sm font-semibold text-foreground capitalize">{step.status}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            {step.location && <p className="text-[10px] text-primary/70">{step.location}</p>}
                            <p className="text-[10px] text-muted-foreground font-mono mt-1">
                              {new Date(step.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-background/50 rounded-xl p-4 border border-dashed border-primary/20 space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-semibold uppercase tracking-wider">Processing</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          Your order has been placed successfully and is now moving into our preparation phase. 
                          We will update your tracking details once your items are blessed and dispatched.
                        </p>
                        <div className="pt-2 border-t border-primary/5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Expected Dispatch: <span className="text-foreground">Within 24-48 hours</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-4 border-t border-primary/5">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">Shipping To</h3>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground">{orderData.shippingAddress?.name}</p>
                        <p>{orderData.shippingAddress?.address}</p>
                        <p>{orderData.shippingAddress?.city}, {orderData.shippingAddress?.state} {orderData.shippingAddress?.zip}</p>
                        <p className="uppercase tracking-widest text-[10px] mt-1">{orderData.shippingAddress?.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/orders" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bebas text-xl px-10 py-7">
                View My Orders
              </Button>
            </Link>
            <Link href="/shop" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-primary/30 hover:bg-primary/5 font-bebas text-xl px-10 py-7">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background font-serif text-2xl text-primary animate-pulse">Loading Sacred Receipt...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
