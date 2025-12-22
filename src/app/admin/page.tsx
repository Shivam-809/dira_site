"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, Edit, Trash2, Loader2, Shield, Users, Package, DollarSign, Clock, ShoppingBag, UserCog, Upload, X, ArrowUpRight, TrendingUp, Inbox, LayoutDashboard, Settings } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  stock: z.number().int().min(0, "Stock must be non-negative"),
  featured: z.boolean(),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  stock: number;
  featured: boolean;
}

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Array<{
    id: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    };
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<{ id: number; name: string; email: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "decks",
      stock: 0,
      featured: false,
      imageUrl: "",
    },
  });

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
        fetchData();
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("admin_token");
        toast.error("Session verification failed. Please login again.");
        router.push("/admin/login");
      }
    };

    verifyAdminSession();
  }, [router]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=100");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setUploadedImageUrl("");
    setImagePreview("");
    form.reset({
      name: "",
      description: "",
      price: 0,
      category: "decks",
      stock: 0,
      featured: false,
      imageUrl: "",
    });
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setUploadedImageUrl(product.imageUrl || "");
    setImagePreview(product.imageUrl || "");
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      imageUrl: product.imageUrl || "",
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadedImageUrl(data.imageUrl);
      setImagePreview(data.imageUrl);
      form.setValue('imageUrl', data.imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedImageUrl("");
    setImagePreview("");
    form.setValue('imageUrl', "");
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/products?id=${editingProduct.id}`
        : "/api/products";
      
      const method = editingProduct ? "PUT" : "POST";

      const payload = {
        ...data,
        imageUrl: uploadedImageUrl || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingProduct ? "Product updated!" : "Product created!");
        setDialogOpen(false);
        setUploadedImageUrl("");
        setImagePreview("");
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save product");
      }
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products?id=${productToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Product deleted!");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-emerald-500",
      shipped: "bg-blue-500",
      delivered: "bg-purple-500",
      cancelled: "bg-destructive",
    };
    return colors[status] || "bg-gray-500";
  };

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
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Control Panel</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-500 font-medium">
                Welcome back, <span className="text-primary font-bold">{adminSession?.name}</span>. Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-3">
               <Link href="/admin/setup">
                 <Button variant="outline" size="sm" className="bg-white border-slate-200">
                   <Settings className="h-4 w-4 mr-2" />
                   Setup
                 </Button>
               </Link>
               <Button onClick={handleAddProduct} className="shadow-lg shadow-primary/20">
                 <Plus className="mr-2 h-4 w-4" />
                 Add Product
               </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="border-none shadow-sm bg-white overflow-hidden group">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold">
                      <TrendingUp className="h-3 w-3 mr-1" /> +12%
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Customers</h3>
                    <p className="text-4xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden group">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Package className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-bold">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Orders</h3>
                    <p className="text-4xl font-black text-slate-900">{stats?.totalOrders || 0}</p>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden group">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div className="flex items-center text-emerald-600 text-xs font-bold">
                       <ArrowUpRight className="h-3 w-3 mr-1" /> Real-time
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Revenue</h3>
                    <p className="text-4xl font-black text-slate-900">${stats?.totalRevenue.toLocaleString()}</p>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden group">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-none font-bold">
                      Priority
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Pending Orders</h3>
                    <p className="text-4xl font-black text-slate-900">{stats?.pendingOrders || 0}</p>
                  </div>
               </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Navigation & Recent Orders */}
            <div className="lg:col-span-2 space-y-8">
               {/* Quick Actions Navigation */}
               <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold">Management Hub</CardTitle>
                    <CardDescription>Direct access to your primary operation areas</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <Link href="/admin/orders" className="block group">
                      <div className="p-6 border rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all text-center">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-slate-900">Orders</p>
                        <p className="text-xs text-slate-400 mt-1">Status & Tracking</p>
                      </div>
                    </Link>
                    <Link href="/admin/users" className="block group">
                      <div className="p-6 border rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all text-center">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <UserCog className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-slate-900">Users</p>
                        <p className="text-xs text-slate-400 mt-1">Roles & Activity</p>
                      </div>
                    </Link>
                    <Link href="/admin/contact-messages" className="block group">
                      <div className="p-6 border rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all text-center">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Inbox className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-slate-900">Messages</p>
                        <p className="text-xs text-slate-400 mt-1">Contact Inquiry</p>
                      </div>
                    </Link>
                  </CardContent>
               </Card>

               {/* Recent Orders List */}
               <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                      <CardDescription>Latest orders from your customers</CardDescription>
                    </div>
                    <Link href="/admin/orders">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 font-bold">
                        View All
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {stats && stats.recentOrders.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {stats.recentOrders.map((order) => (
                          <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                #{order.id}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{order.user?.name || "Anonymous"}</p>
                                <p className="text-xs text-slate-400 font-medium">
                                  {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900">${order.totalAmount.toFixed(2)}</p>
                              <Badge className={`${getStatusColor(order.status)} text-white h-5 text-[10px] uppercase font-black px-2 mt-1`} variant="secondary">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                         <Inbox className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                         <p className="text-slate-400 italic">No recent orders found</p>
                      </div>
                    )}
                  </CardContent>
               </Card>
            </div>

            {/* Side Column - Categories & Store Status */}
            <div className="space-y-8">
               <Card className="border-none shadow-sm bg-white overflow-hidden">
                 <div className="h-2 bg-primary"></div>
                 <CardHeader>
                   <CardTitle className="text-xl font-bold">Store Status</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-emerald-50 text-emerald-700 rounded-2xl">
                       <span className="font-bold">Payments (Razorpay)</span>
                       <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 text-blue-700 rounded-2xl">
                       <span className="font-bold">Email (Resend)</span>
                       <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Inventory Health</p>
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full w-[85%]"></div>
                       </div>
                       <p className="text-xs text-slate-400 font-medium text-right">85% In Stock</p>
                    </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Product Summary</CardTitle>
                    <CardDescription>Catalog overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="flex justify-between p-3 border rounded-xl">
                      <span className="text-slate-600 font-medium">Total Products</span>
                      <span className="font-black text-slate-900">{products.length}</span>
                    </div>
                    <div className="flex justify-between p-3 border rounded-xl">
                      <span className="text-slate-600 font-medium">Featured Items</span>
                      <span className="font-black text-primary">{products.filter(p => p.featured).length}</span>
                    </div>
                    <div className="flex justify-between p-3 border rounded-xl">
                      <span className="text-slate-600 font-medium">Categories</span>
                      <span className="font-black text-slate-900">{new Set(products.map(p => p.category)).size}</span>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </div>

          <Separator className="my-10" />

          {/* Product Grid Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900">Inventory Catalog</h2>
              <div className="text-slate-400 text-sm font-medium">Showing {products.length} products</div>
            </div>

            {products.length === 0 ? (
              <Card className="border-none shadow-sm p-20 text-center">
                 <Package className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                 <h3 className="text-xl font-bold text-slate-800">Your catalog is empty</h3>
                 <p className="text-slate-500 mb-6">Start by adding your first sacred product to the store.</p>
                 <Button onClick={handleAddProduct}>
                   <Plus className="mr-2 h-4 w-4" /> Add Product
                 </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                      {product.featured && (
                        <div className="absolute top-3 left-3">
                           <Badge className="bg-amber-400 text-amber-950 font-black border-none text-[10px] uppercase h-5 px-2">★ Featured</Badge>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Badge className="bg-white/90 backdrop-blur text-slate-900 font-bold border-none text-[10px] uppercase h-5 px-2 capitalize">{product.category}</Badge>
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-2xl font-black text-slate-900">${product.price.toFixed(2)}</p>
                          <p className={`text-xs font-bold ${product.stock > 10 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {product.stock} in stock
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-slate-200 font-bold hover:bg-slate-50"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-slate-200 font-bold hover:bg-destructive hover:text-white"
                          onClick={() => {
                            setProductToDelete(product.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Product Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingProduct ? "Edit Sacred Product" : "Add New Resource"}
            </DialogTitle>
            <CardDescription>Fill in the details for your new product offering.</CardDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="space-y-4">
                    <FormLabel className="font-bold text-slate-700">Product Visual</FormLabel>
                    <div className="relative group">
                      {imagePreview ? (
                        <div className="relative aspect-square border rounded-2xl overflow-hidden bg-slate-50">
                          <Image
                            src={imagePreview}
                            alt="Product preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
                          <Upload className="h-10 w-10 text-slate-300 mb-3" />
                          <p className="text-sm text-slate-400 font-medium">5MB High Resolution</p>
                        </div>
                      )}
                      
                      <div className="mt-4">
                         <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="text-xs cursor-pointer"
                        />
                      </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-4">
                   <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Product Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Sacred Moonstone Deck" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="decks">Tarot Decks</SelectItem>
                            <SelectItem value="crystals">Crystals</SelectItem>
                            <SelectItem value="books">Books</SelectItem>
                            <SelectItem value="accessories">Accessories</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              className="rounded-xl"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Inventory</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="rounded-xl"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share the spiritual benefits and details..."
                        className="min-h-[120px] rounded-2xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 p-4 bg-slate-50 border rounded-2xl">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-5 w-5 accent-primary cursor-pointer rounded-lg"
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="font-bold leading-none cursor-pointer">Show on Homepage</FormLabel>
                      <p className="text-xs text-slate-400 mt-1">Feature this item in the sacred collection section.</p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                <Button type="submit" disabled={submitting || uploading} className="w-full sm:w-auto px-8 rounded-xl font-bold">
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingProduct ? "Update Portfolio" : "Launch Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently remove this item from your divine catalog. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-xl font-bold border-slate-200" onClick={() => setProductToDelete(null)}>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold">
              Yes, Delete It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
