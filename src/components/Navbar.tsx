"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, X, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { useCurrency } from "@/hooks/use-currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { data: session } = useSession();
  const { currency, setCurrency, symbol } = useCurrency();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminSession, setAdminSession] = useState<{ id: number; name: string; email: string } | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminSession = async () => {
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          setAdminSession(data.admin);
        } else {
          localStorage.removeItem("admin_token");
        }
      } catch (error) {
        console.error("Admin session check failed:", error);
        localStorage.removeItem("admin_token");
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminSession();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
    }
  }, [session]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(`/api/cart?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  const handleAdminLogout = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      localStorage.removeItem("admin_token");
      setAdminSession(null);
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAdmin = adminSession !== null;
  const currentUser = isAdmin ? adminSession : session?.user;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
            <div className="flex h-20 items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-primary/10 shadow-sm flex-shrink-0">
                    <Image 
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/icon-1-1766429667844.png?width=8000&height=8000&resize=contain" 
                      alt="Dira Logo" 
                      width={48} 
                      height={48} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-serif tracking-tight text-primary leading-none">
                      Dira
                    </span>
                    <span className="text-sm md:text-base font-felipa text-primary/80 leading-tight mt-0.5">
                      Sakalya Wellbeing
                    </span>
                  </div>
                </Link>


              <div className="hidden md:flex items-center space-x-10 font-serif italic">
                <Link href="/" className="text-base font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                  Home
                </Link>
                <Link href="/#about" className="text-base font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                  About Us
                </Link>
                <Link href="/shop" className="text-base font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                  Shop
                </Link>
                <Link href="/contact" className="text-base font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                  Contact
                </Link>
              </div>



          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-primary/10 text-primary font-serif">
                  <Globe className="h-4 w-4" />
                  <span>{currency}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-primary/20">
                <DropdownMenuItem onClick={() => setCurrency('INR')} className="cursor-pointer font-serif">
                  🇮🇳 INR (₹)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency('USD')} className="cursor-pointer font-serif">
                  🇺🇸 USD ($)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isAdmin && (
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
                    {isAdmin ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-primary/20">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium text-foreground">{currentUser.name || currentUser.email}</div>
                    {isAdmin && (
                      <div className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                        <Shield className="h-3 w-3" />
                        Administrator
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  
                  {isAdmin ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/orders" className="cursor-pointer">
                          Manage Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="cursor-pointer">
                          Manage Users
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary/10" />
                      <DropdownMenuItem onClick={handleAdminLogout} className="cursor-pointer text-destructive">
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="cursor-pointer">
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary/10" />
                      <DropdownMenuItem asChild>
                        <Link href="/logout" className="cursor-pointer">
                          Logout
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !checkingAdmin && (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                    Login
                  </Button>
                </Link>
              )
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-primary/10">
            <Link
              href="/"
              className="block px-4 py-2 text-sm font-medium hover:bg-primary/10 rounded-md tracking-wider uppercase"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/#about"
              className="block px-4 py-2 text-sm font-medium hover:bg-primary/10 rounded-md tracking-wider uppercase"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/shop"
              className="block px-4 py-2 text-sm font-medium hover:bg-primary/10 rounded-md tracking-wider uppercase"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 text-sm font-medium hover:bg-primary/10 rounded-md tracking-wider uppercase"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}