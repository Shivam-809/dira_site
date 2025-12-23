"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Star, Moon, Sun, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionBooking from "@/components/SessionBooking";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  featured: boolean;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const emailVerified = searchParams.get("emailVerified");
    if (emailVerified === "true") {
      toast.success("Email verified! Welcome to Dira!");
    }
    
    fetchFeaturedProducts();
  }, [searchParams]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch("/api/products?featured=true&limit=6");
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-serif">
      <Navbar />
      
      <main className="flex-1">
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
            
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="relative w-[600px] h-[600px]">
              <div className="absolute inset-0 border border-primary/20 rounded-full" />
              <div className="absolute inset-12 border border-primary/10 rounded-full" />
              <div className="absolute inset-24 border border-primary/5 rounded-full" />
            </div>
          </div>

          <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <div className="flex justify-center items-center gap-6">
                <Moon className="h-10 w-10 text-primary/40" />
                <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <Sparkles className="h-8 w-8 text-primary/60" />
                <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <Moon className="h-10 w-10 text-primary/40 transform rotate-180" />
              </div>
              
              <div className="relative flex flex-col items-center">
                <div className="relative mb-8 animate-float text-center">
                  <h1 className="text-6xl md:text-8xl font-serif tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                    Dira Sakalya <br className="md:hidden" /> Divine Healing
                  </h1>
                </div>
              </div>
              
              <p className="text-2xl md:text-3xl font-serif italic text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
                Unlock the mysteries of your soul. Discover curated tarot collections and sacred crystals for your spiritual path.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Link href="/shop">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-8 text-xl font-serif">
                    <ShoppingCart className="mr-3 h-6 w-6" />
                    Enter the Shop
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/40 hover:bg-primary/5 px-10 py-8 text-xl font-serif">
                    Seek Guidance
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Homepage Introduction */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-serif italic text-primary">Welcome.</h2>
              <div className="space-y-6 text-xl md:text-2xl font-serif leading-relaxed text-foreground/80">
                <p>
                  I’m Dr. Diksha Malhotra, PT — a Twin Flame Coach, Tarot Card Reader, Reiki Grandmaster, and Angel Healer.
                </p>
                <p>
                  For over 6 years, I’ve supported individuals across the world through emotionally intense phases of life — especially those navigating the Twin Flame journey. My work focuses on bringing clarity where there is confusion, stability where there is emotional overwhelm, and healing where patterns keep repeating.
                </p>
                <p>
                  With 12,000+ accurate and successful readings, I’ve helped people move from uncertainty into self-awareness, emotional regulation, and conscious alignment. I don’t offer rigid predictions or dependency-based guidance — I offer clear insight, ethical guidance, and deep healing, so you can move forward with confidence and self-trust.
                </p>
                <p className="italic text-primary/70">
                  This space is for those who are ready to understand themselves more deeply and realign with their soul path.
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <div className="w-24 h-px bg-primary/20" />
                <Sparkles className="mx-4 h-6 w-6 text-primary/40" />
                <div className="w-24 h-px bg-primary/20" />
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-24 md:py-40 relative bg-primary/[0.02]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl gold-border relative z-10 group">
                  <img 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/WhatsApp-Image-2025-12-21-at-2.08.22-PM-1766307514281.jpeg?width=8000&height=8000&resize=contain" 
                    alt="Dr. Diksha Malhotra" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 border-t-2 border-l-2 border-primary/30 z-0" />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b-2 border-r-2 border-primary/30 z-0" />
                <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden md:block opacity-20">
                  <Moon className="h-24 w-24 text-primary" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="font-signature text-4xl text-primary/60 italic">About Me</h3>
                  <h2 className="text-4xl md:text-6xl font-serif tracking-tight">Dr. Diksha Malhotra</h2>
                </div>
                
                <div className="space-y-6 text-lg font-serif italic text-muted-foreground leading-relaxed">
                  <p>
                    My journey into healing and intuitive work began with awareness long before it had a name. Over time, that sensitivity evolved into disciplined mastery through years of study, practice, and lived experience. Each phase of my path became a milestone in understanding universal laws, energetic intelligence, and soul evolution.
                  </p>
                  <p>
                    Alongside my work as a physiotherapist (PT), I integrate a strong body–mind foundation into my spiritual practice. This allows me to work safely across physical, emotional, subconscious, ancestral, and energetic layers, creating sessions that are grounded, integrative, and ethically held.
                  </p>
                  <p>
                    As a Reiki Grandmaster and Angel Healer, I work with Reiki, hypnosis, candle rituals, subconscious reprogramming, and NLP-based techniques to help release emotional trauma, limiting belief systems, and deeply ingrained patterns. My sessions often include inner child healing and ancestral trauma healing, supporting clients in breaking inherited emotional cycles and restoring inner safety.
                  </p>
                  <p>
                    Through tarot, angel communication, intuition-led guidance, dowsing, runes, and soul scanning, I translate subtle energetic information into grounded, practical insight. I also work with numerology, astrology, palm reading, coffee cup reading, and Human Design, helping clients understand their energetic blueprint, life themes, timing cycles, and decision-making patterns.
                  </p>
                  <p>
                    My work extends into past-life regression and Akashic readings, where karmic imprints, soul contracts, and recurring lessons across lifetimes become visible and ready for healing. These practices are guided by my understanding of free will, cause and effect, energetic balance, and conscious choice — never fear or dependency.
                  </p>
                  <p>
                    My intuitive and psychic abilities include claircognizance (clear knowing), clairsentience (emotional and energetic sensitivity), intuitive perception, and multidimensional energy scanning. These abilities are used consciously and responsibly, always respecting personal autonomy.
                  </p>
                  <p className="text-primary font-medium border-l-2 border-primary/20 pl-6 py-2">
                    I don’t guide people to chase outcomes or union. I guide them to heal, align, and trust themselves — because true transformation and union are natural outcomes of inner harmony.
                  </p>
                  <p>
                    If you’ve arrived here, it’s because something within you is ready to be seen, understood, and integrated. I’m here to help you listen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 relative border-t border-primary/5">
          <div className="absolute inset-0 bg-background/30" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-20">
              <div className="flex justify-center items-center gap-4 mb-8">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/40" />
                <Sparkles className="h-8 w-8 text-primary/60" />
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/40" />
              </div>
              <h2 className="text-4xl md:text-6xl font-serif mb-6 text-foreground/90">Sacred Collection</h2>
              <p className="text-muted-foreground text-xl font-serif italic max-w-xl mx-auto">
                Handpicked treasures to illuminate your spiritual journey.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden bg-white/40 border-primary/5 shadow-sm animate-pulse h-96" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {featuredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden bg-white/50 border-primary/10 hover:border-primary/30 transition-all duration-500 group gold-border shadow-xl hover:shadow-2xl">
                    <div className="relative h-72 bg-muted/10 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.imageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {product.featured && (
                        <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-full text-xs font-serif uppercase tracking-[0.2em] shadow-lg">
                          Sanctified
                        </div>
                      )}
                    </div>
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-2xl font-serif text-foreground group-hover:text-primary transition-colors">{product.name}</CardTitle>
                      <p className="text-base text-muted-foreground line-clamp-2 font-serif italic">
                        {product.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between border-t border-primary/5 pt-4">
                        <span className="text-3xl font-serif text-primary">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm font-serif italic text-muted-foreground">
                          Limited Stock
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/products/${product.id}`} className="w-full">
                        <Button className="w-full bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all font-serif py-6 text-lg">
                          Discover More
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/shop">
                <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-primary/[0.03]" />
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto">
              <SessionBooking />
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 relative">
          <div className="absolute inset-0 bg-primary/[0.03]" />
          <div className="container mx-auto px-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="text-center space-y-6 group">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-white/50 border border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500 shadow-lg">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-primary">Sanctified Quality</h3>
                <p className="text-muted-foreground font-serif italic text-lg leading-relaxed">
                  Every deck and crystal is hand-selected and blessed for its spiritual resonance and authenticity.
                </p>
              </div>
              
              <div className="text-center space-y-6 group">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-white/50 border border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500 shadow-lg">
                    <ShoppingCart className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-primary">Sacred Exchange</h3>
                <p className="text-muted-foreground font-serif italic text-lg leading-relaxed">
                  Seamless and secure spiritual transactions with our integrated Razorpay payment gateway.
                </p>
              </div>
              
              <div className="text-center space-y-6 group">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-white/50 border border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500 shadow-lg">
                    <Star className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-primary">Divine Insights</h3>
                <p className="text-muted-foreground font-serif italic text-lg leading-relaxed">
                  Deepen your practice with guidance from our masters of tarot and ancient spiritual wisdom.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse font-serif text-4xl text-primary">Dira...</div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}
