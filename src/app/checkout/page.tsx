"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useCurrency } from "@/hooks/use-currency";
import { CreditCard, Loader2, Smartphone, Globe } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
    },
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        toast.error("Please login to checkout");
        router.push("/login");
      } else {
        fetchCartData();
        form.setValue("name", session.user.name || "");
      }
    }
  }, [session, isPending]);

  const fetchCartData = async () => {
    try {
      const [cartRes, productsRes] = await Promise.all([
        fetch(`/api/cart?userId=${session?.user?.id}`),
        fetch("/api/products?limit=100"),
      ]);

      if (cartRes.ok && productsRes.ok) {
        const cartData = await cartRes.json();
        const productsData = await productsRes.json();
        
        if (cartData.length === 0) {
          toast.error("Your cart is empty");
          router.push("/cart");
          return;
        }
        
        setCartItems(cartData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleRazorpayPayment = async (shippingData: CheckoutFormValues) => {
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setProcessing(true);

    try {
      const totalAmount = calculateTotal();

      // Create Razorpay order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          customerName: shippingData.name,
          customerEmail: session?.user?.email,
          customerPhone: "",
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Razorpay checkout options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dira Tarot",
        description: "Purchase from Dira Tarot",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          await verifyAndCompleteOrder(response, shippingData);
        },
        prefill: {
          name: shippingData.name,
          email: session?.user?.email || "",
          contact: "",
        },
        theme: {
          color: "#6b21a8",
        },
        method: {
          upi: paymentMethod === "upi",
          card: paymentMethod === "card",
          netbanking: true,
          wallet: true,
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  const verifyAndCompleteOrder = async (razorpayResponse: any, shippingData: CheckoutFormValues) => {
    try {
      // Verify payment signature
      const verifyResponse = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error("Payment verification failed");
      }

      // Create order in database
      const orderItems = cartItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product?.price || 0,
        };
      });

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          items: orderItems,
          totalAmount: calculateTotal(),
          status: "paid",
          paymentIntentId: razorpayResponse.razorpay_payment_id,
          shippingAddress: {
            name: shippingData.name,
            address: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            zip: shippingData.zip,
            country: shippingData.country,
          },
        }),
      });

        if (!orderResponse.ok) {
          throw new Error("Failed to save order");
        }

        const savedOrder = await orderResponse.json();

        // Clear cart
        await Promise.all(
          cartItems.map(item => 
            fetch(`/api/cart?id=${item.id}`, { method: "DELETE" })
          )
        );

        toast.success("Payment successful! Order placed.");
        router.push(`/checkout/success?orderId=${savedOrder.id}`);
    } catch (error: any) {
      console.error("Order completion error:", error);
      toast.error(error.message || "Failed to complete order");
    } finally {
      setProcessing(false);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    await handleRazorpayPayment(data);
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
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping & Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Shipping Address */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Shipping Address</h3>
                        
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input placeholder="State" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="zip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PIN Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="PIN Code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="Country" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="space-y-4 border-t pt-6">
                        <h3 className="font-semibold text-lg">Payment Method</h3>
                        
                        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "upi")}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="card" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Card Payment
                            </TabsTrigger>
                            <TabsTrigger value="upi" className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              UPI Payment
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="card" className="space-y-2 mt-4">
                            <p className="text-sm text-muted-foreground">
                              Pay securely using your credit or debit card through Razorpay
                            </p>
                          </TabsContent>
                          
                          <TabsContent value="upi" className="space-y-2 mt-4">
                            <p className="text-sm text-muted-foreground">
                              Pay using UPI (Google Pay, PhonePe, Paytm, BHIM, etc.)
                            </p>
                          </TabsContent>
                        </Tabs>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg" 
                        disabled={processing || !razorpayLoaded}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : !razorpayLoaded ? (
                          "Loading payment gateway..."
                        ) : (
                          `Pay ₹${calculateTotal().toFixed(2)}`
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        🔒 Payments are secured by Razorpay
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map(item => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {product?.name} x {item.quantity}
                          </span>
                          <span>₹{((product?.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}