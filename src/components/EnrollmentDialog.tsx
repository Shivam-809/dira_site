"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, BookOpen, Video, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EnrollmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: number;
    heading: string;
    price: number;
  };
}

export default function EnrollmentDialog({ isOpen, onOpenChange, course }: EnrollmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    deliveryType: "recorded", // 'one-to-one' or 'recorded'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Razorpay Order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: course.price,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          receipt: `course_${course.id}_${Date.now()}`,
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
        description: `Enrollment for ${course.heading}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // 3. Verify Payment and Save Enrollment
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                type: "course",
                data: {
                  courseId: course.id,
                  courseName: course.heading,
                  clientName: formData.name,
                  clientEmail: formData.email,
                  clientPhone: formData.phone,
                  deliveryType: formData.deliveryType,
                  amount: course.price,
                },
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success("Enrolled successfully!");
              router.push(`/courses/success?paymentId=${response.razorpay_payment_id}&course=${encodeURIComponent(course.heading)}&type=${formData.deliveryType}`);
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
      console.error("Enrollment error:", error);
      toast.error("Failed to initiate enrollment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Enroll in {course.heading}
          </DialogTitle>
          <DialogDescription className="font-medium italic">
            Select your preferred delivery method and provide your details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEnrollment} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Delivery Type</Label>
              <RadioGroup 
                value={formData.deliveryType} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, deliveryType: val }))}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="recorded" id="recorded" className="peer sr-only" />
                  <Label
                    htmlFor="recorded"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Video className="mb-3 h-6 w-6" />
                    <span className="text-sm font-bold">Recorded</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Self-paced content</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="one-to-one" id="one-to-one" className="peer sr-only" />
                  <Label
                    htmlFor="one-to-one"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Users className="mb-3 h-6 w-6" />
                    <span className="text-sm font-bold">1-on-1</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Live personal sessions</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Enter your name" 
                required 
                value={formData.name}
                onChange={handleInputChange}
                className="border-primary/20"
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
                  className="border-primary/20"
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
                  className="border-primary/20"
                />
              </div>
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
                `Enroll Now (₹${course.price})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
