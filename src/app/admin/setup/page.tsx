"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const adminSetupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminSetupFormValues = z.infer<typeof adminSetupSchema>;

export default function AdminSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminSetupFormValues>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AdminSetupFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMap: Record<string, string> = {
          EMAIL_EXISTS: "An admin with this email already exists. Please use a different email.",
          INVALID_EMAIL: "Invalid email format.",
          INVALID_PASSWORD: "Password must be at least 8 characters.",
          MISSING_REQUIRED_FIELDS: "All fields are required.",
        };
        toast.error(errorMap[result.code] || result.error || "Failed to create admin account.");
        setIsLoading(false);
        return;
      }

      toast.success("Admin account created successfully! You can now login.");
      setTimeout(() => {
        router.push("/admin/login");
      }, 1500);
    } catch (error) {
      console.error("Setup error:", error);
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
              Admin Setup
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl">Create Admin Account</CardTitle>
            <CardDescription>Set up administrator credentials for localhost</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              This page should be deleted after creating your admin account in production.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Admin Name" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Admin Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Already have an admin account?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/admin/login")}>
            Go to Admin Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}