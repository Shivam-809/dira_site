"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, Sparkles, Moon, Sun } from "lucide-react";
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
        <main className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden bg-gradient-to-b from-background via-primary/[0.02] to-background">
          {/* Background elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
              <Sparkles className="absolute top-[10%] left-[15%] h-32 w-32 text-primary/10 animate-float" />
              <Sparkles className="absolute bottom-[10%] right-[15%] h-32 w-32 text-primary/10 animate-float-delayed" />
              <Moon className="absolute top-[20%] right-[10%] h-24 w-24 text-primary/5 animate-pulse" />
              <Sun className="absolute bottom-[20%] left-[10%] h-24 w-24 text-primary/5 animate-pulse" />
          </div>

          <div className="max-w-2xl w-full bg-card/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-primary/20 gold-border shadow-2xl relative z-10 text-center space-y-10 animate-in fade-in zoom-in duration-1000">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
                  <CheckCircle2 className="h-16 w-16 text-primary animate-bounce-slow" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl text-primary font-serif italic tracking-tight drop-shadow-sm">Payment Received</h1>
                <p className="text-2xl md:text-3xl text-foreground/70 font-serif italic">
                  Your divine encounter is set in the stars.
                </p>
                <div className="flex justify-center items-center gap-4 py-2">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                  <span className="text-xs uppercase tracking-[0.4em] font-serif text-primary/60">Session Booked</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
                </div>
              </div>

            {sessionData && (
              <div className="bg-primary/[0.03] rounded-[2rem] p-8 border border-primary/10 space-y-6 text-left relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Calendar className="h-24 w-24" />
                </div>
                
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Calendar className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold mb-1">Sacred Date</p>
                    <p className="text-2xl font-serif">{new Date(sessionData.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold mb-1">Celestial Time</p>
                    <p className="text-2xl font-serif">{sessionData.time} <span className="text-sm italic text-muted-foreground ml-2">({sessionData.duration} soulful minutes)</span></p>
                  </div>
                </div>

                <div className="pt-6 border-t border-primary/10">
                  <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold mb-1">Chosen Path</p>
                  <p className="text-2xl font-serif text-primary">{sessionData.sessionType}</p>
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl italic text-foreground/80 font-serif leading-relaxed">
              <Sparkles className="h-5 w-5 text-primary/40 mx-auto mb-3" />
              The scrolls of confirmation have been dispatched to your digital hearth (email). Please check your inbox for the invitation.
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <Link href="/profile" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif text-xl px-12 py-8 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  My Bookings
                </Button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-primary/30 hover:bg-primary/5 font-serif text-xl px-12 py-8 rounded-full transition-all hover:scale-105 active:scale-95">
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
