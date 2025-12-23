"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search } from "lucide-react";
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
    originalPrice?: number | null;
    benefits?: string | null;
  }


export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = "/api/products?limit=100";
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Shop All Products</h1>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="decks">Tarot Decks</SelectItem>
                <SelectItem value="crystals">Crystals</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all group relative border-primary/10">
                        <div className="relative h-56 bg-muted flex items-center justify-center overflow-hidden">
                          <img
                            src={product.imageUrl || `https://placehold.co/400x300/f5f5f5/333333?text=${encodeURIComponent(product.name)}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          {product.stock <= 0 && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-serif text-sm font-bold tracking-widest uppercase shadow-lg">
                                Out of Stock
                              </span>
                            </div>
                          )}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-20 shadow-md">
                              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                            </div>
                          )}
                        </div>
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-xl font-serif line-clamp-1 group-hover:text-primary transition-colors">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2 font-serif italic">
                        {product.description}
                      </p>
                    </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-serif font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-muted-foreground line-through decoration-primary/30">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        
                        {product.benefits && (
                          <div className="text-[10px] font-serif italic text-primary/70 bg-primary/5 p-2 rounded border border-primary/10 line-clamp-1">
                            ✨ {product.benefits}
                          </div>
                        )}
                      </CardContent>


                  <CardFooter>
                    <Link href={`/products/${product.id}`} className="w-full">
                      <Button className="w-full" size="sm">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
