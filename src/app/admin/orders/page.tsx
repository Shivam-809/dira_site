"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Loader2, Search, ChevronLeft, ChevronRight, Trash2, Eye, Truck, CreditCard, User, ListChecks, PlusCircle, MapPin, Info, Clock, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/use-currency";

interface TrackingLog {
  id: number;
  status: string;
  description: string;
  location?: string;
  createdAt: string;
}

interface Order {
  id: number;
  userId: string;
  items: Array<{ productId: number; name?: string; quantity: number; price: number }>;
  totalAmount: number;
  status: string;
  shippingAddress: {
    name: string;
    address?: string;
    street?: string;
    city: string;
    state: string;
    zip?: string;
    zipCode?: string;
    country: string;
  };
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tracking?: TrackingLog[];
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [adminSession, setAdminSession] = useState<{ id: number; name: string; email: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New Tracking Entry State
  const [newTracking, setNewTracking] = useState({
    status: "",
    description: "",
    location: ""
  });
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Verify admin session
  useEffect(() => {
    const verifyAdminSession = async () => {
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        toast.error("Please login as admin");
        router.push("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          localStorage.removeItem("admin_token");
          toast.error("Session expired. Please login again.");
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        setAdminSession(data.admin);
        setSessionLoading(false);
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("admin_token");
        toast.error("Session verification failed. Please login again.");
        router.push("/admin/login");
      }
    };

    verifyAdminSession();
  }, [router]);

  useEffect(() => {
    if (adminSession) {
      fetchOrders();
    }
  }, [adminSession, statusFilter, searchQuery]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (response.ok) {
        toast.success("Order status updated!");
        fetchOrders();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleDeleteRequest = (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/orders?orderId=${selectedOrder.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Order deleted successfully!");
        fetchOrders();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete order");
      }
    } catch (error) {
      toast.error("Failed to delete order");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleManageTracking = (order: Order) => {
    setSelectedOrder(order);
    setNewTracking({
      status: order.status,
      description: "",
      location: ""
    });
    setTrackingDialogOpen(true);
  };

  const handleAddTracking = async () => {
    if (!selectedOrder || !newTracking.status || !newTracking.description) {
      toast.error("Please fill in status and description");
      return;
    }

    setTrackingLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/orders/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          ...newTracking
        }),
      });

      if (response.ok) {
        toast.success("Tracking update added!");
        // Update order status as well if it changed
        if (newTracking.status !== selectedOrder.status) {
           await handleStatusChange(selectedOrder.id, newTracking.status);
        }
        setNewTracking({ status: "", description: "", location: "" });
        setTrackingDialogOpen(false);
        fetchOrders();
      } else {
        toast.error("Failed to add tracking update");
      }
    } catch (error) {
      toast.error("Error adding tracking update");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      placed: "bg-blue-400",
      processing: "bg-indigo-500",
      shipped: "bg-blue-600",
      delivered: "bg-emerald-600",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold mb-2">Order Management</h1>
              <p className="text-muted-foreground font-serif italic">View and manage all customer orders and tracking</p>
            </div>
            <div className="text-right hidden sm:block">
              <Badge variant="outline" className="text-primary border-primary/20 bg-white">
                Total Orders: {orders.length}
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          {paginatedOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No orders found</h2>
                <p className="text-muted-foreground italic font-serif">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Orders will appear here when customers make purchases"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-6">
                {paginatedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden border-primary/10 hover:border-primary/20 transition-all bg-white shadow-sm">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                             <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                             <Badge className={`${getStatusColor(order.status)} text-white border-0 shadow-sm`}>
                               {order.status.toUpperCase()}
                             </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1 font-medium">
                            <p className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-primary/60" /> {order.user?.name || "Unknown"} ({order.user?.email || "N/A"})
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary/60" />
                              {new Date(order.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
                              onClick={() => handleManageTracking(order)}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Tracking details
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-9 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="placed">Placed</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:bg-destructive hover:text-white border-destructive/20"
                              onClick={() => handleDeleteRequest(order)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider text-slate-500">
                            <Package className="h-4 w-4 text-primary" /> Items Ordered
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="font-medium text-slate-700">
                                  {item.name || `Product #${item.productId}`} <span className="text-muted-foreground font-normal ml-2">× {item.quantity}</span>
                                </span>
                                <span className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center px-1">
                              <span className="font-bold text-slate-900 text-lg">Order Total</span>
                              <span className="text-2xl font-black text-primary">
                                {formatPrice(order.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
                                <Truck className="h-4 w-4 text-primary" /> Shipping Info
                              </h4>
                              <div className="text-sm leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="font-bold text-slate-900 mb-1">{order.shippingAddress.name}</p>
                                <p className="text-slate-600">
                                  {order.shippingAddress.address || order.shippingAddress.street}<br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip || order.shippingAddress.zipCode}<br />
                                  {order.shippingAddress.country}
                                </p>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
                                <CreditCard className="h-4 w-4 text-primary" /> Payment Info
                              </h4>
                              <div className="text-sm p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                <p className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Gateway:</span>
                                  <span className="font-bold text-slate-900">Razorpay</span>
                                </p>
                                <p className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Status:</span>
                                  <Badge variant="outline" className={`font-bold ${order.status === 'pending' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
                                    {order.status === 'pending' ? 'Awaiting' : 'Successful'}
                                  </Badge>
                                </p>
                                {order.tracking && order.tracking.length > 0 && (
                                   <div className="mt-4 pt-4 border-t border-slate-200">
                                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Latest Status</p>
                                     <p className="font-bold text-primary flex items-center gap-2">
                                       <ListChecks className="h-3 w-3" />
                                       {order.tracking[0].status}
                                     </p>
                                   </div>
                                )}
                              </div>
                           </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium bg-white px-4 py-2 rounded-lg border border-slate-200">
                    Page <span className="text-primary font-bold">{currentPage}</span> of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-destructive">Delete Order</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Are you sure you want to delete <strong>Order #{selectedOrder?.id}</strong>? This will remove all associated data. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOrder(null)} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl text-white font-bold">Delete Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tracking Management Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Manage Tracking - Order #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription className="font-serif italic">
              Update shipment status and add tracking logs for the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Add New Log */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                Add New Status Update
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Status</label>
                  <Select 
                    value={newTracking.status} 
                    onValueChange={(val) => setNewTracking({...newTracking, status: val})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Order Packed">Order Packed</SelectItem>
                      <SelectItem value="Dispatched">Dispatched</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Location (Optional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      placeholder="e.g. Mumbai Hub" 
                      className="pl-9 bg-white"
                      value={newTracking.location}
                      onChange={(e) => setNewTracking({...newTracking, location: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <div className="relative">
                  <Info className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <textarea 
                    className="w-full min-h-[80px] p-3 pl-9 bg-white border rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Provide details about this status update..."
                    value={newTracking.description}
                    onChange={(e) => setNewTracking({...newTracking, description: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddTracking} 
                disabled={trackingLoading || !newTracking.status || !newTracking.description}
                className="w-full font-bold shadow-lg shadow-primary/10 py-6"
              >
                {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                Add Tracking Update
              </Button>
            </div>

            {/* Existing Logs */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 px-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Tracking History
              </h3>
              {selectedOrder?.tracking && selectedOrder.tracking.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                  {selectedOrder.tracking.map((log, i) => (
                    <div key={log.id} className="relative">
                      <div className={`absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-300'}`} />
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold">
                            {log.status}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">{log.description}</p>
                        {log.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {log.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Truck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 font-serif italic">No tracking updates added yet.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
             <Button variant="outline" onClick={() => setTrackingDialogOpen(false)} className="rounded-xl w-full sm:w-auto">
               Close Panel
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
