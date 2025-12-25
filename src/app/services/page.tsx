"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BookingDialog from "@/components/BookingDialog";

interface Service {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          setServices(data.filter((s: Service) => s.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleBookNow = (service: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5DC]">
      <Navbar />
      <main className="flex-1 py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black mb-4 flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 text-primary" />
              Sacred Services
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto italic">
              Experience divine guidance and healing through our specialized mystical offerings.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card key={service.id} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white overflow-hidden group">
                  <div className="h-3 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2 bg-primary/10 text-primary border-none font-bold">
                      {service.category}
                    </Badge>
                    <CardTitle className="text-3xl font-black">{service.heading}</CardTitle>
                    <CardDescription className="text-lg font-serif italic text-primary/70">{service.subheading}</CardDescription>
                  </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-600 leading-relaxed font-medium line-clamp-3">
                          {service.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-primary/10 pt-4">
                        <span className="text-2xl font-black text-primary">₹{service.price}</span>
                        <Button 
                          className="font-bold group bg-primary hover:bg-primary/90"
                          onClick={() => handleBookNow(service)}
                        >
                          Book Now <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedService && (
              <BookingDialog 
                isOpen={isBookingOpen} 
                onOpenChange={setIsBookingOpen} 
                service={selectedService} 
              />
            )}
          </div>
        </main>
        <Footer />
      </div>

  );
}
