"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, BookOpen, User, CreditCard, Sparkles, Home, PlayCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const courseName = searchParams.get("course");
  const deliveryType = searchParams.get("type");

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5DC]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-20">
        <Card className="max-w-2xl w-full border-none shadow-2xl bg-white overflow-hidden">
          <div className="h-4 bg-primary" />
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-4xl font-black text-slate-900">Enrollment Successful!</CardTitle>
            <CardDescription className="text-xl font-medium italic mt-2">
              Welcome to your sacred learning journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-4 col-span-1 md:col-span-2">
                <BookOpen className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Course</p>
                  <p className="text-xl font-bold text-slate-900">{courseName}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CreditCard className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Payment ID</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{paymentId}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <User className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Delivery Type</p>
                  <p className="text-lg font-bold text-slate-900 capitalize">
                    {deliveryType === "one-to-one" ? "1-on-1 Sessions" : "Recorded Content"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <p className="text-slate-700 font-medium leading-relaxed">
                  {deliveryType === "one-to-one" 
                    ? "Our team will contact you within 24 hours to schedule your first 1-on-1 session. Check your email for more details."
                    : "You now have full access to the course materials. You can find them in your dashboard or check the enrollment email for direct links."}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link href="/" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full sm:w-auto font-bold gap-2 py-6 text-lg px-8">
                    <Home className="h-5 w-5" /> Go to Home
                  </Button>
                </Link>
                <Link href="/profile" className="flex-1 sm:flex-none">
                  <Button className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/90 py-6 text-lg px-8 gap-2">
                    <PlayCircle className="h-5 w-5" /> Access Content
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function EnrollmentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
