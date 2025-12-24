"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingCart, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
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
  originalPrice?: number | null;
  benefits?: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        toast.error("Product not found");
        router.push("/shop");
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session?.user) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product!.id,
          quantity,
        }),
      });

      if (response.ok) {
        toast.success("Added to cart successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add to cart");
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-96 bg-muted rounded-lg mb-8" />
              <div className="h-8 bg-muted rounded w-1/2 mb-4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Product Image */}
            <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden shadow-2xl gold-border">
              <img
                src={product.imageUrl || `https://placehold.co/800x800/f5f5f5/333333?text=${encodeURIComponent(product.name)}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <Badge variant="destructive" className="text-xl px-8 py-3 rounded-full font-serif font-bold tracking-[0.2em] uppercase shadow-2xl">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">{product.name}</h1>
                  {product.featured && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-serif italic h-7">Featured</Badge>
                  )}
                </div>
                <p className="text-sm text-primary font-serif italic uppercase tracking-[0.2em] border-l-2 border-primary/30 pl-4 py-1">
                  {product.category}
                </p>
              </div>

              <div className="flex items-baseline gap-6">
                <div className="text-5xl font-serif font-bold text-primary">
                  {formatPrice(product.price)}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-muted-foreground line-through decoration-primary/30 font-serif">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed text-xl font-serif italic">
                {product.description}
              </p>

              {product.benefits && (
                <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-8 space-y-4">
                  <h3 className="font-serif font-bold text-primary flex items-center gap-3 text-lg">
                    <Sparkles className="h-5 w-5" /> Sacred Benefits
                  </h3>
                  <div className="text-foreground/80 flex items-start gap-3 text-lg font-serif italic leading-relaxed">
                    <span className="text-primary">✨</span>
                    <span>{product.benefits}</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-serif font-bold text-slate-700">Availability</span>
                  <span className={`font-serif font-bold ${product.stock > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {product.stock > 0 ? `${product.stock} Units Remaining` : "Out of stock"}
                  </span>
                </div>

                {product.stock > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center justify-between p-2 border rounded-xl bg-white min-w-[140px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-serif font-bold text-lg">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (quantity < product.stock) {
                            setQuantity(quantity + 1);
                          } else {
                            toast.error(`Only ${product.stock} items in stock`);
                          }
                        }}
                        disabled={quantity >= product.stock}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      size="lg"
                      className="flex-1 py-8 text-xl font-serif bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                    >
                      <ShoppingCart className="mr-3 h-6 w-6" />
                      {addingToCart ? "Securing..." : "Add to Cart"}
                    </Button>
                  </div>
                )}
                
                {product.stock <= 0 && (
                  <Button
                    size="lg"
                    className="w-full py-8 text-xl font-serif opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Out of Stock
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
