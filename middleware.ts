import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Admin routes handle their own authentication via admin_token
  // No need for middleware to check admin routes
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  
  // For user-protected routes (cart, checkout, orders, profile)
  if (pathname.startsWith("/cart") || 
      pathname.startsWith("/checkout") || 
      pathname.startsWith("/orders") || 
      pathname.startsWith("/profile")) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  // Protect routes that require authentication
  // Homepage (/), /login, /signup, /shop, /products, /contact are PUBLIC
  matcher: [
    "/admin/:path*",
    "/cart",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile"
  ],
};