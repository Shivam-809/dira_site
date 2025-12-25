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
import { Calendar, Clock, Sparkles, CheckCircle2, CreditCard, Globe, Loader2 } from "lucide-react";
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
  id: number;
  date: string;
  time: string;
  available: boolean;
  serviceId: number | null;
}

interface Service {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  price: number;
  category: string | null;
}

export default function SessionBooking() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    serviceId: "",
    sessionType: "",
    date: "",
    time: "",
    duration: 60,
    price: 0,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  });

  const { formatPrice, currency } = useCurrency();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (formData.serviceId) {
      fetchAvailableSlots(formData.serviceId);
    } else {
      setAvailableSlots([]);
    }
  }, [formData.serviceId]);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchAvailableSlots = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/sessions/available?serviceId=${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data);
      }
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
    }
  };

  const handleServiceChange = (id: string) => {
    const service = services.find(s => s.id.toString() === id);
    if (service) {
      setFormData(prev => ({
        ...prev,
        serviceId: id,
        sessionType: service.heading,
        duration: 60,
        price: service.price,
        date: "",
        time: "",
      }));
    }
  };

  const handlePayment = async () => {
    if (!session?.user) {
      toast.error("Please login to book a session");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!formData.serviceId || !formData.date || !formData.time || !formData.clientName || !formData.clientEmail || !formData.clientPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay Order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formData.price,
          customerName: formData.clientName,
          customerEmail: formData.clientEmail,
          customerPhone: formData.clientPhone,
          receipt: `session_${Date.now()}`,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Configure Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dira Sakalya Wellbeing",
        description: `${formData.sessionType}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment and Save Booking (Atomic)
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                type: "service",
                data: {
                  serviceId: parseInt(formData.serviceId),
                  sessionType: formData.sessionType,
                  clientName: formData.clientName,
                  clientEmail: formData.clientEmail,
                  clientPhone: formData.clientPhone,
                  date: formData.date,
                  timeSlot: formData.time,
                  notes: formData.notes,
                  amount: formData.price,
                },
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success("Payment successful! Session booked.");
              setBookingSuccess(true);
              router.push(`/sessions/success?paymentId=${response.razorpay_payment_id}&service=${encodeURIComponent(formData.sessionType)}&date=${formData.date}&time=${formData.time}`);
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: formData.clientName,
          email: formData.clientEmail,
          contact: formData.clientPhone,
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

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
      setLoading(false);
    }
  };

  const availableDates = Array.from(
    new Set(availableSlots.map(slot => slot.date))
  ).sort().slice(0, 14);

  const availableTimes = availableSlots
    .filter(slot => slot.date === formData.date)
    .map(slot => slot.time);

  const selectedService = services.find(s => s.id.toString() === formData.serviceId);

  return (
    <Card className="w-full bg-card/50 border-primary/20 gold-border shadow-2xl">
      <CardHeader className="border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bebas tracking-wide text-primary uppercase">Book a Session</CardTitle>
            <CardDescription className="text-muted-foreground font-serif italic text-base">
              Schedule your mystical guidance and healing journey
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {bookingSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-serif text-center text-primary italic">Session Confirmed!</h3>
            <p className="text-muted-foreground text-center max-w-md font-serif italic">
              Your divine appointment has been scheduled. Check your email for details.
            </p>
            <Button onClick={() => setBookingSuccess(false)} variant="outline" className="border-primary/30 hover:bg-primary/10 font-serif italic">
              Book Another Session
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6 font-serif">
            <div className="space-y-2">
              <Label htmlFor="sessionType" className="text-foreground text-lg">Select Sacred Service *</Label>
              <Select
                value={formData.serviceId}
                onValueChange={handleServiceChange}
                required
              >
                <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50 py-6 text-lg">
                  <SelectValue placeholder="Choose a session type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-lg">{service.heading} — {formatPrice(service.price)}</span>
                        <span className="text-xs text-muted-foreground italic">
                          {service.subheading}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground text-lg">Choose Date *</Label>
                <Select
                  value={formData.date}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, date: value, time: "" }))}
                  required
                >
                  <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50 py-6 text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
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
                  <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50 py-6 text-lg">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-foreground text-lg">Your Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                  className="bg-background/50 border-primary/20 focus:border-primary/50 py-6 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="text-foreground text-lg">Phone Number *</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+91..."
                  required
                  className="bg-background/50 border-primary/20 focus:border-primary/50 py-6 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-foreground text-lg">Email Address *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="your.email@example.com"
                required
                className="bg-background/50 border-primary/20 focus:border-primary/50 py-6 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground text-lg">Divine Intentions (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Share any specific questions or areas you'd like to focus on during your session..."
                rows={4}
                className="bg-background/50 border-primary/20 focus:border-primary/50 text-lg"
              />
            </div>

            {selectedService && (
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest">Energy Exchange</p>
                  <p className="text-3xl font-bebas text-primary tracking-wider">{formatPrice(selectedService.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground italic">Approx. {formData.duration} Minutes</p>
                  {currency === 'USD' && (
                    <p className="text-[10px] text-muted-foreground">Processed as ₹{selectedService.price.toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bebas text-3xl tracking-[0.2em] py-10 h-auto shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                disabled={loading || isPending}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                    <span>Proceed to Booking</span>
                  </div>
                )}
              </Button>

              {currency === 'USD' && (
                <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary italic">
                  <Globe className="h-5 w-5 shrink-0" />
                  <p>International exchange will be processed in Indian Rupees (INR) at current market rates.</p>
                </div>
              )}
            </div>

            {!session?.user && !isPending && (
              <p className="text-sm text-muted-foreground text-center font-serif italic">
                A portal account is required for bookings.{" "}
                <a href="/login" className="text-primary hover:underline font-bold">
                  Login or Sign Up
                </a>
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
