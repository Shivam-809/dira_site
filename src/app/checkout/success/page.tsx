"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders?id=${orderId}`)
        .then((res) => res.json())
        .then((data) => setOrderData(data))
        .catch((err) => console.error("Error fetching order details:", err));
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

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Tracking Details</h3>
                    <p className="text-sm text-muted-foreground italic mb-2">
                        Your order is currently in processing. Tracking information will be updated as soon as your package is dispatched.
                    </p>
                    <div className="bg-background/50 rounded-lg p-3 border border-dashed border-primary/20 text-xs">
                        <p className="flex justify-between mb-1">
                            <span>Status:</span>
                            <span className="text-primary font-semibold uppercase">Processing</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Expected Dispatch:</span>
                            <span>Within 24-48 hours</span>
                        </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Shipping To</h3>
                    <p className="text-sm text-muted-foreground">
                        {orderData.shippingAddress?.name}<br />
                        {orderData.shippingAddress?.address}<br />
                        {orderData.shippingAddress?.city}, {orderData.shippingAddress?.state} {orderData.shippingAddress?.zip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/orders">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bebas text-xl px-10">
                View My Orders
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:bg-primary/5 font-bebas text-xl px-10">
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
