"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Service {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  category: string | null;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Book Consultation", "Book Healing", "Advance Services"];

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-white border-b border-primary/5">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase mb-6">
              <Sparkles className="h-3 w-3" />
              Divine Offerings
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic text-slate-900 mb-6 tracking-tight">
              Our Sacred Services
            </h1>
            <p className="text-lg text-slate-600 font-serif leading-relaxed max-w-2xl mx-auto">
              Embark on a journey of self-discovery and healing through our soul-led consultation and energy work services.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-20">
            {categories.map((category) => {
              const categoryServices = services.filter(s => s.category === category);
              if (categoryServices.length === 0) return null;

              return (
                <div key={category} className="mb-20 last:mb-0">
                  <div className="flex items-center gap-4 mb-10">
                    <h2 className="text-3xl font-serif italic text-slate-900 whitespace-nowrap">{category}</h2>
                    <div className="h-px bg-primary/10 w-full" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryServices.map((service) => (
                      <Card key={service.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden rounded-3xl">
                        <CardHeader className="p-8 pb-4">
                          <CardTitle className="text-2xl font-serif text-slate-900 mb-2 group-hover:text-primary transition-colors">
                            {service.heading}
                          </CardTitle>
                          {service.subheading && (
                            <CardDescription className="text-primary italic font-serif">
                              {service.subheading}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                          <p className="text-slate-600 leading-relaxed mb-8 line-clamp-4 font-serif italic">
                            {service.description}
                          </p>
                          <Link href="/contact">
                            <Button className="w-full rounded-2xl h-14 text-base font-serif italic bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                              Book Your Session
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
