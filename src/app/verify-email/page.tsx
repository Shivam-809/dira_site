"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email for the correct link.");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Your email has been verified successfully! You may now login to your account.");
        
        // Redirect to login page with verified flag after 3 seconds
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed. The link may have expired or is invalid.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("An error occurred during verification. Please try again or contact support.");
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
        setEmail("");
      } else {
        toast.error(data.error || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting you to login page...
              </p>
              <Link href="/login?verified=true">
                <Button className="w-full">Continue to Login</Button>
              </Link>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Resend Verification Email</p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Button
                  onClick={handleResendVerification}
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Back to Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full">Try to Login</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}