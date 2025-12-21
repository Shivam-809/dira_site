"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, Edit, Trash2, Loader2, Shield, Users, Package, DollarSign, Clock, ShoppingBag, UserCog, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    // Validate file size (5MB max)
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
      paid: "bg-green-500",
      shipped: "bg-blue-500",
      delivered: "bg-purple-500",
      cancelled: "bg-red-500",
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome, {adminSession?.name || "Admin"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/admin/orders">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Package className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manage</p>
                      <p className="text-lg font-semibold">Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <UserCog className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manage</p>
                      <p className="text-lg font-semibold">Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/contact-messages">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <ShoppingBag className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">View</p>
                      <p className="text-lg font-semibold">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manage</p>
                    <p className="text-lg font-semibold">Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Orders */}
          {stats && stats.recentOrders.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.user?.name || "Unknown"} • {order.user?.email || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                          <Badge className={getStatusColor(order.status)} variant="secondary">
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/admin/orders">
                  <Button variant="outline" className="w-full mt-4">
                    View All Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Product Management */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Product Management</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Image Upload */}
                    <FormItem>
                      <FormLabel>Product Image</FormLabel>
                      <div className="space-y-4">
                        {imagePreview ? (
                          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                            <Image
                              src={imagePreview}
                              alt="Product preview"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Upload a product image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPEG, PNG, WebP, or GIF (Max 5MB)
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="cursor-pointer"
                        />
                        
                        {uploading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </div>
                        )}
                      </div>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter a detailed description of the product"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
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
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
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
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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

                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Featured Product</FormLabel>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={submitting || uploading}>
                        {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                {product.imageUrl && (
                  <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span>{product.stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="capitalize">{product.category}</span>
                    </div>
                    {product.featured && (
                      <div className="text-xs text-primary font-semibold">★ Featured</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setProductToDelete(product.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}