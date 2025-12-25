"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Sparkles, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SlotManagementDialog from "@/components/admin/SlotManagementDialog";

const serviceSchema = z.object({
  heading: z.string().min(2, "Heading is required"),
  subheading: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  isActive: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface Service {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      heading: "",
      subheading: "",
      description: "",
      category: "Book Consultation",
      isActive: true,
    },
  });

  useEffect(() => {
    fetchServices();
  }, []);

    const fetchServices = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const response = await fetch("/api/admin/services", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };

  const handleAddService = () => {
    setEditingService(null);
    form.reset({
      heading: "",
      subheading: "",
      description: "",
      category: "Book Consultation",
      price: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    form.reset({
      heading: service.heading,
      subheading: service.subheading || "",
      description: service.description || "",
      category: service.category || "Book Consultation",
      price: service.price || 0,
      isActive: service.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ServiceFormValues) => {
    setSubmitting(true);
    try {
      const url = editingService
        ? `/api/admin/services?id=${editingService.id}`
        : "/api/admin/services";
      
      const method = editingService ? "PUT" : "POST";

      const token = localStorage.getItem("admin_token");
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingService ? "Service updated!" : "Service created!");
        setDialogOpen(false);
        fetchServices();
      } else {
        toast.error("Failed to save service");
      }
    } catch (error) {
      toast.error("Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/services?id=${serviceToDelete}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success("Service deleted!");
        fetchServices();
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const filteredServices = services.filter(s => 
    s.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Services Management
          </h1>
          <p className="text-slate-500 font-medium">Manage your consultation and healing offerings.</p>
        </div>
        <Button onClick={handleAddService} className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search services..." 
            className="pl-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2">
          <Sparkles className="h-12 w-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold">No services found</h3>
          <p className="text-slate-500">Add your first service to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="group hover:shadow-xl transition-all border-none shadow-sm bg-white overflow-hidden">
              <div className="h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none mb-2">
                    {service.category}
                  </Badge>
                  <Badge variant={service.isActive ? "default" : "outline"} className={service.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {service.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold">{service.heading}</CardTitle>
                <CardDescription className="font-medium italic">{service.subheading}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-500 text-sm line-clamp-3">{service.description}</p>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold" onClick={() => handleEditService(service)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white rounded-xl font-bold" onClick={() => {
                    setServiceToDelete(service.id);
                    setDeleteDialogOpen(true);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectItem value="Book Consultation">Book Consultation</SelectItem>
                        <SelectItem value="Book Healing">Book Healing</SelectItem>
                        <SelectItem value="Advance Services">Advance Services</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Heading</FormLabel>
                    <FormControl>
                      <Input placeholder="Service name" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subheading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Subheading</FormLabel>
                    <FormControl>
                      <Input placeholder="Short catchphrase" className="rounded-xl" {...field} />
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
                    <FormLabel className="font-bold">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full service description..." className="rounded-xl min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0 p-4 bg-slate-50 border rounded-xl">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-primary" />
                    </FormControl>
                    <FormLabel className="font-bold cursor-pointer">Service is active and visible</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingService ? "Update Service" : "Create Service"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Delete Service?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
