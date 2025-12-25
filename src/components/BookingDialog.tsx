"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: number;
    heading: string;
    price: number;
  };
}

export default function BookingDialog({ isOpen, onOpenChange, service }: BookingDialogProps) {
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    timeSlot: "",
    notes: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !formData.timeSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay Order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: service.price,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          receipt: `service_${service.id}_${Date.now()}`,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dira Sakalya Wellbeing",
        description: `Booking for ${service.heading}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // 3. Verify Payment and Save Booking
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                type: "service",
                data: {
                  serviceId: service.id,
                  serviceName: service.heading,
                  clientName: formData.name,
                  clientEmail: formData.email,
                  clientPhone: formData.phone,
                  date: format(date, "yyyy-MM-dd"),
                  timeSlot: formData.timeSlot,
                  notes: formData.notes,
                  amount: service.price,
                },
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success("Booking confirmed!");
              router.push(`/services/success?paymentId=${response.razorpay_payment_id}&service=${encodeURIComponent(service.heading)}&date=${format(date, "PPP")}&time=${formData.timeSlot}`);
              onOpenChange(false);
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("An error occurred during verification");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#6b21a8",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to initiate booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Book {service.heading}
          </DialogTitle>
          <DialogDescription className="font-medium italic">
            Fill in your details to schedule your divine session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBooking} className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Enter your name" 
                required 
                value={formData.name}
                onChange={handleInputChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  required 
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="+91..." 
                  required 
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-primary/20",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Preferred Time Slot</Label>
                <Input 
                  id="timeSlot" 
                  name="timeSlot" 
                  placeholder="e.g. 10:00 AM" 
                  required 
                  value={formData.timeSlot}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Any specific focus for the session?" 
                value={formData.notes}
                onChange={handleInputChange}
                className="border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full font-bold h-12 text-lg" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Proceed to Payment (₹${service.price})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
