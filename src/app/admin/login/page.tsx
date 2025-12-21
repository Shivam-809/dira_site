"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Check if admin just verified their email
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      toast.success("Email verified! You may now login to admin portal.");
    }
  }, [searchParams]);

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    try {
      // Call the new admin-specific login endpoint
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMap: Record<string, string> = {
          INVALID_CREDENTIALS: "Invalid admin credentials. Please check your email and password.",
          INVALID_EMAIL_FORMAT: "Invalid email format.",
          INVALID_PASSWORD_LENGTH: "Password must be at least 6 characters.",
          MISSING_REQUIRED_FIELDS: "Email and password are required.",
        };
        toast.error(errorMap[result.code] || result.error || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Store admin session token in localStorage
      if (result.token) {
        localStorage.setItem("admin_token", result.token);
      }

      // Success
      const wasVerified = searchParams.get("verified") === "true";
      
      if (wasVerified) {
        toast.success("Email verified and admin login successful!");
      } else {
        toast.success(`Welcome back, ${result.admin.name}!`);
      }
      
      router.push("/admin");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/30 bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="text-3xl mystical-text bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Admin Portal
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Administrator access only</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Login as Admin"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-semibold">
              ← Back to User Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}