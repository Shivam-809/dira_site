"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Loader2, Search, Shield, UserCircle, ChevronLeft, ChevronRight, Trash2, Eye, ShoppingBasket, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserOrder {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<{ id: number; name: string; email: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
      fetchUsers();
    }
  }, [adminSession, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams({ limit: "100" });
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChangeRequest = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleDeleteRequest = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/orders?search=${user.email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter strictly by user ID to be sure
        setUserOrders(data.filter((o: any) => o.userId === user.id));
      }
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    const newRole = selectedUser.role === "admin" ? "user" : "admin";

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser.id, role: newRole }),
      });

      if (response.ok) {
        toast.success(`User role updated to ${newRole}!`);
        fetchUsers();
      } else {
        toast.error("Failed to update user role");
      }
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("User deleted successfully!");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-amber-500",
      paid: "text-emerald-500",
      shipped: "text-blue-500",
      delivered: "text-purple-500",
      cancelled: "text-destructive",
    };
    return colors[status] || "text-muted-foreground";
  };

  // Pagination
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice(
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and roles</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Grid */}
          {paginatedUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No users found</h2>
                <p className="text-muted-foreground">
                  {searchQuery || roleFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Users will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedUsers.map((user) => (
                  <Card key={user.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="h-12 w-12 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-base">{user.name}</CardTitle>
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className="mt-1"
                            >
                              {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                              {user.role.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground break-all">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined:{" "}
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        {user.emailVerified && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleRoleChange(user)}
                      >
                        {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                      </Button>
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

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the role of <strong>{selectedUser?.name}</strong> to{" "}
              <strong>{selectedUser?.role === "admin" ? "user" : "admin"}</strong>?
              {selectedUser?.role !== "admin" && (
                <span className="block mt-2 text-amber-600">
                  This will grant them full administrative access to the system.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}