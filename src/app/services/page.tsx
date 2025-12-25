"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Moon, Sun, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Service {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  category: string | null;
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
    <div className="min-h-screen flex flex-col font-serif bg-background">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M0,30 Q25,-20 50,30 T100,30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="w-12 h-px bg-primary/30" />
                <Sparkles className="h-6 w-6 text-primary/60" />
                <div className="w-12 h-px bg-primary/30" />
              </div>
              <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-foreground">
                Sacred Services
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
                Guided pathways for healing, clarity, and soul alignment.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 border-t-2 border-primary rounded-full animate-spin" />
                <p className="italic text-primary animate-pulse">Gathering cosmic energy...</p>
              </div>
            ) : (
              <div className="space-y-32">
                {categories.map((category) => {
                  const categoryServices = services.filter(s => s.category === category);
                  if (categoryServices.length === 0) return null;

                  return (
                    <div key={category} className="space-y-12">
                      <div className="flex flex-col items-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-serif text-primary text-center">
                          {category}
                        </h2>
                        <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categoryServices.map((service) => (
                          <div 
                            key={service.id} 
                            className="group p-8 rounded-2xl bg-white/50 border border-primary/10 hover:border-primary/30 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-2xl relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                              <Moon className="h-12 w-12 text-primary" />
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                              <div>
                                <h3 className="text-2xl font-serif text-foreground group-hover:text-primary transition-colors">
                                  {service.heading}
                                </h3>
                                {service.subheading && (
                                  <p className="text-sm font-serif italic text-primary/70 mt-1">
                                    {service.subheading}
                                  </p>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground leading-relaxed italic">
                                {service.description}
                              </p>
                              
                              <div className="pt-4">
                                <Link href="/contact">
                                  <Button className="w-full bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all font-serif italic">
                                    Inquire Now
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-24 bg-primary/[0.02] border-y border-primary/5">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-8">
              <Star className="h-10 w-10 text-primary/40 mx-auto" />
              <h2 className="text-3xl md:text-4xl font-serif italic">Need a bespoke healing path?</h2>
              <p className="text-lg text-muted-foreground italic leading-relaxed">
                Every journey is unique. If you feel drawn to a combination of services or a specific area of focus, reach out for a personalized consultation.
              </p>
              <Link href="/contact">
                <Button size="lg" className="rounded-full px-10 py-6 text-lg font-serif italic">
                  Connect with Dr. Diksha
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
