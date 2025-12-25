"use client";

import { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar, Clock, User, Phone, Mail, CreditCard, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface Booking {
  id: number;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  timeSlot: string;
  status: string;
  amount: number;
  paymentId: string;
  createdAt: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Service Bookings
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage and view all ritual and session bookings.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email or service..." 
            className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-primary shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-slate-900">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Confirmed Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-green-600">
              ₹{bookings.reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xl font-bold text-slate-700">Live System</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/60 bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-700 py-6 pl-8">Client Info</TableHead>
                <TableHead className="font-bold text-slate-700">Service & Status</TableHead>
                <TableHead className="font-bold text-slate-700">Date & Time</TableHead>
                <TableHead className="font-bold text-slate-700">Payment</TableHead>
                <TableHead className="font-bold text-slate-700 pr-8">Booked On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-slate-500 font-medium">Loading bookings...</p>
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <p className="text-slate-500 font-medium">No bookings found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="py-6 pl-8">
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 text-lg flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          {booking.clientName}
                        </p>
                        <div className="flex flex-col gap-1 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> {booking.clientEmail}</span>
                          <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> {booking.clientPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <p className="font-bold text-slate-800">{booking.serviceName}</p>
                        <Badge className={cn(
                          "font-bold uppercase tracking-wider text-[10px] px-2.5 py-1",
                          booking.status === "paid" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        )}>
                          {booking.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {booking.date}
                        </p>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {booking.timeSlot}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-black text-primary text-lg">₹{booking.amount}</p>
                        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {booking.paymentId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="pr-8">
                      <p className="text-sm font-medium text-slate-500 italic">
                        {format(new Date(booking.createdAt), "PPP")}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
