"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Loader2, Search, ChevronLeft, ChevronRight, Trash2, Eye, Truck, CreditCard, User } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<{ id: number; name: string; email: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      shipped: "bg-blue-500",
      delivered: "bg-purple-500",
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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold mb-2">Order Management</h1>
              <p className="text-muted-foreground">View and manage all customer orders</p>
            </div>
            <div className="text-right hidden sm:block">
              <Badge variant="outline" className="text-primary border-primary/20">
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
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          {paginatedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No orders found</h2>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Orders will appear here when customers make purchases"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all">
                    <CardHeader className="bg-muted/30 pb-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                             <Badge className={`${getStatusColor(order.status)} text-white border-0`}>
                               {order.status.toUpperCase()}
                             </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {order.user?.name || "Unknown"} ({order.user?.email || "N/A"})
                            </p>
                            <p>
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
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:bg-destructive hover:text-white"
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
                          <h4 className="font-bold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                            <Package className="h-4 w-4" /> Items Ordered
                          </h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                                <span className="font-medium">
                                  {item.name || `Product #${item.productId}`} <span className="text-muted-foreground font-normal">x {item.quantity}</span>
                                </span>
                                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center px-2">
                              <span className="font-bold">Total Amount</span>
                              <span className="text-xl font-bold text-primary">
                                ${order.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <h4 className="font-bold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                                <Truck className="h-4 w-4" /> Shipping
                              </h4>
                              <p className="text-sm leading-relaxed p-3 bg-muted/20 rounded">
                                <span className="font-semibold">{order.shippingAddress.name}</span>
                                <br />
                                {order.shippingAddress.address || order.shippingAddress.street}
                                <br />
                                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                                {order.shippingAddress.zip || order.shippingAddress.zipCode}
                                <br />
                                {order.shippingAddress.country}
                              </p>
                           </div>
                           <div>
                              <h4 className="font-bold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                                <CreditCard className="h-4 w-4" /> Payment Info
                              </h4>
                              <div className="text-sm p-3 bg-muted/20 rounded">
                                <p className="flex justify-between mb-1">
                                  <span className="text-muted-foreground">Method:</span>
                                  <span className="font-medium">Razorpay</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className={`font-medium ${order.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {order.status === 'pending' ? 'Processing' : 'Completed'}
                                  </span>
                                </p>
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
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>Order #{selectedOrder?.id}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOrder(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
