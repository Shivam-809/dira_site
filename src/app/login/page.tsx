"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Clear localStorage on page load for security
  useEffect(() => {
    // Clear any stored user/admin credentials on page reload
    const keysToRemove = ['user', 'admin', 'credentials', 'userCredentials', 'adminCredentials'];
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
      }
    });
  }, []);

  // Check if user just verified their email
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      toast.success("Email verified! You may now login to your account.");
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/",
      });

      if (error?.code) {
        const errorMap: Record<string, string> = {
          INVALID_EMAIL_OR_PASSWORD: "Invalid email or password. Please try again.",
          INVALID_PASSWORD: "Invalid email or password. Please try again.",
          EMAIL_NOT_VERIFIED: "Please verify your email before logging in. Check your inbox for the verification link.",
        };
        toast.error(errorMap[error.code] || "Login failed. Please try again.");
        return;
      }

      // Check if this was after email verification
      const wasVerified = searchParams.get("verified") === "true";
      
      if (wasVerified) {
        toast.success("Email verified and logged in successfully! Welcome!");
        router.push("/?emailVerified=true");
      } else {
        toast.success("Welcome back!");
        router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/30">
                <Image
                  src="/dira-logo-mystical.png"
                  alt="Dira Tarot"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
                <span className="text-3xl font-serif text-primary tracking-tighter">
                  Dira
                </span>

            </Link>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton redirectTo="/" mode="signin" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" autoComplete="email" {...field} />
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-semibold">
              Create account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}