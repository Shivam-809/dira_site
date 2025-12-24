import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Truck, Package, CheckCircle2, Clock, AlertCircle, MapPin, ListChecks } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TrackingLog {
  id: number;
  status: string;
  description: string;
  location?: string;
  createdAt: string;
}

interface TrackingInfo {
  orderId: number;
  status: string;
  amount: number;
  lastUpdated: string;
  placedAt: string;
  tracking: TrackingLog[];
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order_id") || "");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingInfo | null>(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (searchParams.get("order_id")) {
      handleTrack(null, searchParams.get("order_id") || "");
    }
  }, []);

  const handleTrack = async (e?: React.FormEvent, idToTrack?: string) => {
    if (e) e.preventDefault();
    const targetId = idToTrack || orderId;
    
    if (!targetId.trim()) {
      toast.error("Please enter an Order ID");
      return;
    }

    setLoading(true);
    setTrackingData(null);

    try {
      const response = await fetch(`/api/orders/track?order_id=${targetId}`);
      const data = await response.json();

      if (response.ok) {
        setTrackingData(data);
      } else {
        toast.error(data.error || "Order not found");
      }
    } catch (error) {
      console.error("Tracking error:", error);
      toast.error("Failed to fetch tracking information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
    if (s.includes("shipped") || s.includes("transit") || s.includes("delivery")) return <Truck className="h-8 w-8 text-blue-500" />;
    if (s.includes("processing") || s.includes("packed") || s.includes("placed") || s.includes("paid") || s.includes("confirmed")) return <Clock className="h-8 w-8 text-amber-500" />;
    return <Package className="h-8 w-8 text-muted-foreground" />;
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col font-serif">
      <Navbar />
      
      <main className="flex-1 py-20 bg-primary/[0.02]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-primary">Track Your Order</h1>
              <p className="text-muted-foreground italic text-lg">Enter your order ID to see the current status of your sacred items.</p>
            </div>

            <Card className="gold-border shadow-xl bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-8">
                <form onSubmit={(e) => handleTrack(e)} className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. 12345"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="pl-10 h-14 text-lg border-primary/20 focus-visible:ring-primary"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="h-14 px-8 bg-primary hover:bg-primary/90 text-lg">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Track"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {trackingData && (
              <Card className="gold-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <CardHeader className="border-b border-primary/10 bg-primary/[0.03] py-8">
                  <div className="flex justify-between items-center px-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Order Identifier</p>
                      <CardTitle className="text-3xl font-cinzel text-primary">#{trackingData.orderId}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-foreground">{formatPrice(trackingData.amount)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-10 space-y-12">
                  <div className="flex items-center gap-6 p-8 bg-white rounded-2xl border border-primary/5 shadow-md mx-2">
                    <div className="p-5 bg-primary/5 rounded-full ring-8 ring-primary/[0.02]">
                      {getStatusIcon(trackingData.status)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Journey Stage</p>
                      <h3 className="text-3xl font-bold text-primary tracking-tight">
                        {getStatusDisplay(trackingData.status)}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-8 px-4">
                    <div className="flex items-center gap-2 mb-6">
                      <ListChecks className="h-5 w-5 text-primary" />
                      <h4 className="text-lg font-bold uppercase tracking-wider text-slate-700">Journey History</h4>
                    </div>

                    {trackingData.tracking && trackingData.tracking.length > 0 ? (
                      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-primary/10">
                        {trackingData.tracking.map((log, i) => (
                          <div key={log.id} className="relative group">
                            <div className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md transition-all duration-300 ${i === 0 ? 'bg-primary ring-4 ring-primary/20 scale-125' : 'bg-slate-300 group-hover:bg-primary/50'}`} />
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Badge variant="secondary" className={`border-none font-bold px-3 py-1 ${i === 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {log.status}
                                </Badge>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  {new Date(log.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-base text-slate-600 font-medium leading-relaxed">{log.description}</p>
                              {log.location && (
                                <p className="text-xs text-primary/60 flex items-center gap-1 font-bold">
                                  <MapPin className="h-3 w-3" /> {log.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Initial Placed Event */}
                        <div className="relative group pt-4">
                          <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm bg-slate-200" />
                          <div className="space-y-1 opacity-60">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                               {new Date(trackingData.placedAt).toLocaleDateString()} • Order Placed
                            </p>
                            <p className="text-sm text-slate-500 italic">Your sacred order was successfully received.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Truck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-serif italic">Your order is being prepared for its journey.</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-primary/10" />
                  
                  <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50 flex gap-4 items-start mx-2">
                    <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-900">Spiritual Note</p>
                      <p className="text-sm text-amber-800/80 italic leading-relaxed">
                        Each item is prepared with conscious intent. Status updates may take up to 24 hours to reflect after changes are made as they pass through various hubs.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 flex justify-center py-8">
                  <p className="text-sm text-muted-foreground italic font-medium">
                    Thank you for trusting Dira with your spiritual journey.
                  </p>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
