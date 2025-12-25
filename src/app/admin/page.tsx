"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShoppingBag, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  Inbox,
  Loader2,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalServices: number;
  totalCourses: number;
  recentActivity: Array<{
    id: string;
    type: "order" | "service" | "course" | "user";
    title: string;
    status: string;
    createdAt: string;
    amount?: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from various endpoints or a combined one
      const [statsRes, productsRes, servicesRes, coursesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/products?limit=1"),
        fetch("/api/admin/services"),
        fetch("/api/admin/courses"),
      ]);

      const statsData = await statsRes.json();
      const servicesData = await servicesRes.json();
      const coursesData = await coursesRes.json();

      setStats({
        ...statsData,
        totalServices: servicesData.length,
        totalCourses: coursesData.length,
        recentActivity: [
          ...(statsData.recentOrders || []).map((o: any) => ({
            id: o.id.toString(),
            type: "order",
            title: `Order from ${o.user?.name || "Customer"}`,
            status: o.status,
            createdAt: o.createdAt,
            amount: o.totalAmount
          })),
          ...servicesData.slice(0, 3).map((s: any) => ({
            id: s.id.toString(),
            type: "service",
            title: `New Service: ${s.heading}`,
            status: s.isActive ? "active" : "inactive",
            createdAt: s.createdAt
          })),
          ...coursesData.slice(0, 3).map((c: any) => ({
            id: c.id.toString(),
            type: "course",
            title: `New Course: ${c.heading}`,
            status: c.isActive ? "active" : "inactive",
            createdAt: c.createdAt
          }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-emerald-500",
      active: "bg-emerald-500",
      shipped: "bg-blue-500",
      delivered: "bg-purple-500",
      inactive: "bg-slate-400",
      cancelled: "bg-destructive",
    };
    return colors[status.toLowerCase()] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 font-medium">Welcome to your command center. Here's a snapshot of DIRA.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">+12%</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Products</h3>
              <p className="text-4xl font-black text-slate-900">{stats?.totalProducts || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Services</h3>
              <p className="text-4xl font-black text-slate-900">{stats?.totalServices || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Courses</h3>
              <p className="text-4xl font-black text-slate-900">{stats?.totalCourses || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Revenue</h3>
              <p className="text-4xl font-black text-slate-900">{formatPrice(stats?.totalRevenue || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              <CardDescription>Commonly used management tools</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/admin/shop">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 rounded-2xl border-slate-100 hover:border-primary hover:bg-primary/5 group">
                  <ShoppingBag className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                  <span className="font-bold">Add Product</span>
                </Button>
              </Link>
              <Link href="/admin/services">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 rounded-2xl border-slate-100 hover:border-primary hover:bg-primary/5 group">
                  <Sparkles className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                  <span className="font-bold">Add Service</span>
                </Button>
              </Link>
              <Link href="/admin/courses">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 rounded-2xl border-slate-100 hover:border-primary hover:bg-primary/5 group">
                  <BookOpen className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                  <span className="font-bold">Add Course</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                <CardDescription>Latest updates across the platform</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {stats.recentActivity.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          item.type === "order" ? "bg-blue-50 text-blue-600" :
                          item.type === "service" ? "bg-amber-50 text-amber-600" :
                          item.type === "course" ? "bg-purple-50 text-purple-600" :
                          "bg-slate-50 text-slate-600"
                        }`}>
                          {item.type === "order" ? <ShoppingBag className="h-5 w-5" /> :
                           item.type === "service" ? <Sparkles className="h-5 w-5" /> :
                           <BookOpen className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-400 font-medium">
                            {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.amount ? (
                          <p className="font-black text-slate-900">{formatPrice(item.amount)}</p>
                        ) : null}
                        <Badge className={`${getStatusColor(item.status)} text-white h-5 text-[10px] uppercase font-black px-2 mt-1`} variant="secondary">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Inbox className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                  <p className="text-slate-400 italic">No recent activity found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Info */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Platform Growth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <p className="text-sm font-bold opacity-80">Active Customers</p>
                <p className="text-3xl font-black">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <p className="text-sm font-bold opacity-80">Completed Orders</p>
                <p className="text-3xl font-black">{stats?.totalOrders || 0}</p>
              </div>
              <Button variant="secondary" className="w-full font-bold rounded-xl bg-white text-primary hover:bg-slate-50 mt-4">
                View Reports <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <span className="text-sm font-bold">API Status</span>
                <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <span className="text-sm font-bold">Database</span>
                <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <span className="text-sm font-bold">Storage</span>
                <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
