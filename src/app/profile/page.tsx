"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Mail, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface SessionBooking {
  id: number;
  sessionType: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  clientName: string;
  clientEmail: string;
  notes: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/profile");
    } else if (session?.user) {
      fetchUserSessions();
    }
  }, [session, isPending, router]);

  const fetchUserSessions = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/sessions?userId=${session?.user?.id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        toast.error("Failed to load session history");
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load session history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">My Profile</CardTitle>
                  <CardDescription>Your account information and session history</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{session.user.name || "Not provided"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{session.user.email}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{session.user.role || "User"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Total Sessions</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{sessions.length} {sessions.length === 1 ? "session" : "sessions"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Booking History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Session Booking History</CardTitle>
              <CardDescription>
                View all your tarot reading sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Book your first tarot reading session to get started
                  </p>
                  <Button onClick={() => router.push("/#book-session")}>
                    Book a Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((booking) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{booking.sessionType}</h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {booking.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{booking.time} ({booking.duration} min)</span>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <span className="font-medium">Notes: </span>
                                {booking.notes}
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground">
                            <span className="block md:text-right">
                              Booked on{" "}
                              {new Date(booking.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/")}>
              <CardContent className="p-6 text-center space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold">Book New Session</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule another tarot reading
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/shop")}>
              <CardContent className="p-6 text-center space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold">Browse Products</h3>
                <p className="text-sm text-muted-foreground">
                  Explore our mystical collection
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
