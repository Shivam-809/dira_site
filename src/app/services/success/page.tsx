"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, CreditCard, Sparkles, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const serviceName = searchParams.get("service");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

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
            <CardTitle className="text-4xl font-black text-slate-900">Booking Confirmed!</CardTitle>
            <CardDescription className="text-xl font-medium italic mt-2">
              Your session has been successfully scheduled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Service</p>
                  <p className="text-lg font-bold text-slate-900">{serviceName}</p>
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
                <Calendar className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Date</p>
                  <p className="text-lg font-bold text-slate-900">{date}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Time Slot</p>
                  <p className="text-lg font-bold text-slate-900">{time}</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-slate-600 font-medium italic">
                A confirmation email with the session details and joining instructions has been sent to your email address.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full sm:w-auto font-bold gap-2">
                    <Home className="h-4 w-4" /> Go to Home
                  </Button>
                </Link>
                <Link href="/services" className="flex-1 sm:flex-none">
                  <Button className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/90">
                    Book Another Session
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

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
