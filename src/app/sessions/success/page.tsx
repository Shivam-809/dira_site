"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function SessionSuccessContent() {
  const searchParams = useSearchParams();
  const [sessionData, setSessionData] = useState<any>(null);
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/sessions?id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => setSessionData(data))
        .catch((err) => console.error("Error fetching session details:", err));
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col font-serif">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
            <Sparkles className="absolute top-20 left-20 h-40 w-40 text-primary animate-pulse" />
            <Sparkles className="absolute bottom-20 right-20 h-40 w-40 text-primary animate-pulse decoration-300" />
        </div>

        <div className="max-w-2xl w-full bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-primary/20 gold-border shadow-2xl relative z-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-100/10 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl text-primary font-bebas tracking-wide">Payment Received!</h1>
            <p className="text-xl md:text-2xl text-foreground/80 italic">
              Your session has been successfully booked.
            </p>
          </div>

          {sessionData && (
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Scheduled Date</p>
                  <p className="text-lg">{new Date(sessionData.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Scheduled Time</p>
                  <p className="text-lg">{sessionData.time} ({sessionData.duration} minutes)</p>
                </div>
              </div>

              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Service</p>
                <p className="text-lg font-medium text-primary">{sessionData.sessionType}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50/5 border border-blue-500/20 p-4 rounded-xl italic text-foreground/70">
            A confirmation email with all details has been sent to your registered address.
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/profile">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bebas text-xl px-10">
                View My Bookings
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:bg-primary/5 font-bebas text-xl px-10">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SessionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background font-serif text-2xl text-primary animate-pulse">Loading Blessing...</div>}>
      <SessionSuccessContent />
    </Suspense>
  );
}
