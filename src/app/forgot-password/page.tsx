"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to send reset email");
        return;
      }

      setEmailSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>We've sent you a password reset link</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p className="mb-4">
                If an account exists with the email you provided, you will receive a password reset link shortly.
              </p>
              <p className="text-sm">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
              <span className="text-3xl mystical-text bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                Dira Tarot
              </span>
            </Link>
          </div>
          <div>
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>Enter your email to reset your password</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Back to Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
