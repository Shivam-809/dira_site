"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Sparkles, CheckCircle2, CreditCard, Globe } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/use-currency";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

const SESSION_TYPES = [
  { value: "Tarot Reading", label: "Tarot Reading", duration: 60, price: 1500, description: "Insightful card readings for guidance" },
  { value: "Chakra Alignment", label: "Chakra Alignment", duration: 90, price: 2000, description: "Energy balancing and healing" },
  { value: "Astrology Consultation", label: "Astrology Consultation", duration: 60, price: 1800, description: "Cosmic insights and birth chart analysis" },
  { value: "Past Life Reading", label: "Past Life Reading", duration: 90, price: 2500, description: "Explore your soul's journey" },
];

export default function SessionBooking() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formData, setFormData] = useState({
    sessionType: "",
    date: "",
    time: "",
    duration: 60,
    price: 0,
    clientName: "",
    clientEmail: "",
    notes: "",
  });

  const { formatPrice, currency } = useCurrency();

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        clientName: session.user.name || "",
        clientEmail: session.user.email || "",
      }));
    }
  }, [session]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch("/api/sessions/available");
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slice(0, 42));
      }
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
    }
  };

  const handleSessionTypeChange = (value: string) => {
    const sessionType = SESSION_TYPES.find(st => st.value === value);
    setFormData(prev => ({
      ...prev,
      sessionType: value,
      duration: sessionType?.duration || 60,
      price: sessionType?.price || 0,
    }));
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!session?.user) {
      toast.error("Please login to book a session");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!formData.sessionType || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await initializeRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load");
        setLoading(false);
        return;
      }

      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formData.price,
          currency: "INR",
          receipt: `session_${Date.now()}`,
          customerName: formData.clientName,
          customerEmail: formData.clientEmail,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dira",
        description: `${formData.sessionType} - ${formData.duration} min`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              const token = localStorage.getItem("bearer_token");
              const sessionResponse = await fetch("/api/sessions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                  userId: session.user.id,
                  sessionType: formData.sessionType,
                  date: formData.date,
                  time: formData.time,
                  duration: formData.duration,
                  clientName: formData.clientName,
                  clientEmail: formData.clientEmail,
                  notes: formData.notes || null,
                  paymentId: response.razorpay_payment_id,
                  paymentStatus: "paid",
                  amount: formData.price,
                }),
              });

                if (sessionResponse.ok) {
                  const savedSession = await sessionResponse.json();
                  toast.success("Payment successful! Session booked.");
                  router.push(`/sessions/success?sessionId=${savedSession.id}`);
                } else {
                toast.error("Payment successful but session booking failed. Please contact support.");
              }
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: formData.clientName,
          email: formData.clientEmail,
        },
        theme: {
          color: "#d4af37",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const availableDates = Array.from(
    new Set(availableSlots.map(slot => slot.date))
  ).slice(0, 14);

  const availableTimes = formData.date
    ? availableSlots
        .filter(slot => slot.date === formData.date && slot.available)
        .map(slot => slot.time)
    : [];

  const selectedSessionType = SESSION_TYPES.find(st => st.value === formData.sessionType);

  return (
    <Card className="w-full bg-card/50 border-primary/20 gold-border">
      <CardHeader className="border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
            <div>
              <CardTitle className="text-3xl font-bebas tracking-wide text-primary">Book a Session</CardTitle>
              <CardDescription className="text-muted-foreground font-serif italic text-base">
                Schedule a personalized reading with our experienced practitioners
              </CardDescription>
            </div>

        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {bookingSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-20 w-20 rounded-full bg-green-900/30 border border-green-600/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-center text-primary">Booking Confirmed!</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your session has been booked and paid successfully. We'll send a confirmation email shortly.
            </p>
            <Button onClick={() => setBookingSuccess(false)} variant="outline" className="border-primary/30 hover:bg-primary/10">
              Book Another Session
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6 font-serif">
            <div className="space-y-2">
              <Label htmlFor="sessionType" className="text-foreground text-lg">Sacred Service *</Label>
              <Select
                value={formData.sessionType}
                onValueChange={handleSessionTypeChange}
                required
              >
                <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50">
                  <SelectValue placeholder="Choose a session type" />
                </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label} - {formatPrice(type.price)}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description} • {type.duration} min
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>

              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground text-lg">Choose Date *</Label>
                <Select
                  value={formData.date}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, date: value, time: "" }))}
                  required
                >
                  <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50 font-serif">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 font-serif">
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-foreground text-lg">Choose Time *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                  disabled={!formData.date}
                  required
                >
                  <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50 font-serif">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 font-serif">
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-foreground text-lg">Your Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter your name"
                  required
                  className="bg-background/50 border-primary/20 focus:border-primary/50 font-serif"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail" className="text-foreground text-lg">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                  className="bg-background/50 border-primary/20 focus:border-primary/50 font-serif"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground text-lg">Divine Intentions (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Share any specific questions or areas you'd like to focus on..."
                rows={4}
                className="bg-background/50 border-primary/20 focus:border-primary/50 font-serif"
              />
            </div>

            {selectedSessionType && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Session Price</span>
                  <span className="text-2xl font-bold text-primary">₹{selectedSessionType.price}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bebas text-2xl tracking-widest py-8"
              disabled={loading || isPending}
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay & Book Session
                </>
              )}
            </Button>

            {!session?.user && (
              <p className="text-sm text-muted-foreground text-center">
                You need to be logged in to book a session.{" "}
                <a href="/login" className="text-primary hover:underline">
                  Login here
                </a>
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}