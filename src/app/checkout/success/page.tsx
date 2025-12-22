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
        <main className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden bg-gradient-to-b from-background via-primary/[0.01] to-background">
          {/* Background elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
              <Sparkles className="absolute top-[15%] right-[20%] h-32 w-32 text-primary/10 animate-float" />
              <Sparkles className="absolute bottom-[15%] left-[20%] h-32 w-32 text-primary/10 animate-float-delayed" />
              <Package className="absolute top-[25%] left-[10%] h-24 w-24 text-primary/5 -rotate-12 animate-pulse" />
              <Truck className="absolute bottom-[25%] right-[10%] h-24 w-24 text-primary/5 rotate-12 animate-pulse" />
          </div>

          <div className="max-w-2xl w-full bg-card/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-primary/20 gold-border shadow-2xl relative z-10 text-center space-y-10 animate-in fade-in zoom-in duration-1000">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
                  <CheckCircle2 className="h-16 w-16 text-primary animate-bounce-slow" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl text-primary font-serif italic tracking-tight drop-shadow-sm">Payment Received</h1>
              <p className="text-2xl md:text-3xl text-foreground/70 font-serif italic">
                Your sacred treasures are on their way.
              </p>
              <div className="flex justify-center items-center gap-4 py-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                <span className="text-xs uppercase tracking-[0.4em] font-serif text-primary/60">Order Confirmed</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
              </div>
            </div>

            {orderData && (
              <div className="bg-primary/[0.03] rounded-[2rem] p-8 border border-primary/10 space-y-8 text-left relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                <div className="flex justify-between items-center border-b border-primary/10 pb-6">
                  <div>
                    <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold mb-1">Ritual ID</p>
                    <p className="text-2xl font-mono text-primary">#{orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold mb-1">Sacred Exchange</p>
                    <p className="text-3xl font-serif text-primary">₹{orderData.totalAmount}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                      <Truck className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-2xl text-foreground mb-4">Journey Status</h3>
                      
                      {trackingHistory.length > 0 ? (
                        <div className="space-y-6 mt-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-primary/20">
                          {trackingHistory.map((step, index) => (
                            <div key={step.id} className="relative pl-8 pb-2">
                              <div className={`absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary text-primary-foreground scale-110 shadow-lg' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                <div className="h-3 w-3 rounded-full bg-current" />
                              </div>
                              <p className={`text-lg font-serif ${index === 0 ? 'text-primary' : 'text-foreground/80'} capitalize`}>{step.status}</p>
                              <p className="text-sm text-muted-foreground font-serif italic">{step.description}</p>
                              {step.location && <p className="text-[10px] text-primary/70 uppercase tracking-widest mt-1">{step.location}</p>}
                              <p className="text-[10px] text-muted-foreground font-mono mt-2">
                                {new Date(step.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-6 border border-dashed border-primary/30 space-y-4">
                          <div className="flex items-center gap-3 text-primary animate-pulse">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm font-serif uppercase tracking-[0.2em]">Preparing your treasures</span>
                          </div>
                          <p className="text-sm text-muted-foreground font-serif italic leading-relaxed">
                            Your order is now entering our inner sanctum. We will infuse your items with intention and update your tracking as they begin their journey to you.
                          </p>
                          <div className="pt-4 border-t border-primary/10 flex justify-between items-center text-[10px] text-primary/60 uppercase tracking-[0.1em]">
                            <span>Expected Dispatch</span>
                            <span className="text-foreground font-bold">Within 24-48 solar hours</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-6 pt-6 border-t border-primary/10">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                      <Package className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-foreground mb-4">Destination</h3>
                      <div className="text-lg text-muted-foreground font-serif italic leading-relaxed">
                          <p className="font-bold text-foreground not-italic mb-1">{orderData.shippingAddress?.name}</p>
                          <p>{orderData.shippingAddress?.address}</p>
                          <p>{orderData.shippingAddress?.city}, {orderData.shippingAddress?.state} {orderData.shippingAddress?.zip}</p>
                          <p className="uppercase tracking-[0.3em] text-[10px] mt-2 text-primary/70 font-sans not-italic font-bold">{orderData.shippingAddress?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <Link href="/orders" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif text-xl px-12 py-8 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  My Orders
                </Button>
              </Link>
              <Link href="/shop" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-primary/30 hover:bg-primary/5 font-serif text-xl px-12 py-8 rounded-full transition-all hover:scale-105 active:scale-95">
                  <ShoppingBag className="mr-3 h-6 w-6" />
                  Continue Shop
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
