"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useCurrency } from "@/hooks/use-currency";

interface CartItem {
  id: number;
  userId: string;
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
}

export default function CartPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        toast.error("Please login to view your cart");
        router.push("/login");
      } else {
        fetchCart();
      }
    }
  }, [session, isPending]);

  const fetchCart = async () => {
    try {
      const [cartRes, productsRes] = await Promise.all([
        fetch(`/api/cart?userId=${session?.user?.id}`),
        fetch("/api/products?limit=100"),
      ]);

      if (cartRes.ok && productsRes.ok) {
        const cartData = await cartRes.json();
        const productsData = await productsRes.json();
        
        setCartItems(cartData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        setCartItems(cartItems.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ));
        toast.success("Cart updated");
      } else {
        toast.error("Failed to update cart");
      }
    } catch (error) {
      toast.error("Failed to update cart");
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems(cartItems.filter(item => item.id !== itemId));
        toast.success("Item removed from cart");
      } else {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const getCartItemsWithProducts = () => {
    return cartItems.map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId),
    }));
  };

  const calculateTotal = () => {
    return getCartItemsWithProducts().reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cartItemsWithProducts = getCartItemsWithProducts();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          {cartItemsWithProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Add some mystical items to get started!
                </p>
                <Link href="/shop">
                  <Button>Continue Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItemsWithProducts.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop"
                            alt={item.product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {item.product?.name || "Product"}
                              </h3>
                              <p className="text-primary font-bold">
                                ${(item.product?.price || 0).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                updateQuantity(item.id, val);
                              }}
                              className="w-20 text-center"
                              min="1"
                              max={item.product?.stock || 99}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= (item.product?.stock || 0)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold">Order Summary</h2>
                    
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total</span>
                        <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <Link href="/checkout">
                      <Button className="w-full" size="lg">
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <Link href="/shop">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
