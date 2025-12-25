"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, BookOpen, Search, FileUp, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const courseSchema = z.object({
  heading: z.string().min(2, "Heading is required"),
  subheading: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  pdfUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface Course {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  pdfUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      heading: "",
      subheading: "",
      description: "",
      pdfUrl: "",
      isActive: true,
    },
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/courses", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    form.reset({
      heading: "",
      subheading: "",
      description: "",
      price: 0,
      pdfUrl: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      heading: course.heading,
      subheading: course.subheading || "",
      description: course.description || "",
      pdfUrl: course.pdfUrl || "",
      isActive: course.isActive,
    });
    setDialogOpen(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        form.setValue('pdfUrl', data.imageUrl);
        toast.success("PDF uploaded successfully");
      } else {
        toast.error(data.error || "Failed to upload PDF");
      }
    } catch (error) {
      toast.error("Failed to upload PDF");
    } finally {
      setUploadingPdf(false);
    }
  };

  const onSubmit = async (data: CourseFormValues) => {
    setSubmitting(true);
    try {
      const url = editingCourse
        ? `/api/admin/courses?id=${editingCourse.id}`
        : "/api/admin/courses";
      
      const method = editingCourse ? "PUT" : "POST";

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
        toast.success(editingCourse ? "Course updated!" : "Course created!");
        setDialogOpen(false);
        fetchCourses();
      } else {
        toast.error("Failed to save course");
      }
    } catch (error) {
      toast.error("Failed to save course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/courses?id=${courseToDelete}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success("Course deleted!");
        fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      toast.error("Failed to delete course");
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.heading.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Courses Management
          </h1>
          <p className="text-slate-500 font-medium">Manage your spiritual courses and workshops.</p>
        </div>
        <Button onClick={handleAddCourse} className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add Course
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search courses..." 
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
      ) : filteredCourses.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2">
          <BookOpen className="h-12 w-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold">No courses found</h3>
          <p className="text-slate-500">Add your first course to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="group hover:shadow-xl transition-all border-none shadow-sm bg-white overflow-hidden">
              <div className="h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-2">
                <div className="flex justify-end mb-2">
                  <Badge variant={course.isActive ? "default" : "outline"} className={course.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold">{course.heading}</CardTitle>
                <CardDescription className="font-medium italic">{course.subheading}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-500 text-sm line-clamp-3">{course.description}</p>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold" onClick={() => handleEditCourse(course)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white rounded-xl font-bold" onClick={() => {
                    setCourseToDelete(course.id);
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
              {editingCourse ? "Edit Course" : "Add New Course"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Heading</FormLabel>
                    <FormControl>
                      <Input placeholder="Course title" className="rounded-xl" {...field} />
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
                      <Input placeholder="Target audience or short value prop" className="rounded-xl" {...field} />
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
                        <Textarea placeholder="Course content and what students will learn..." className="rounded-xl min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel className="font-bold">Course PDF (Optional)</FormLabel>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        id="pdf-upload"
                        disabled={uploadingPdf}
                      />
                      <label
                        htmlFor="pdf-upload"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        {uploadingPdf ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <FileUp className="h-5 w-5 text-primary" />
                        )}
                        <span className="font-medium text-slate-600">
                          {form.getValues("pdfUrl") ? "Change PDF" : "Upload Course PDF"}
                        </span>
                      </label>
                    </div>
                    {form.getValues("pdfUrl") && (
                      <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-primary truncate max-w-[150px]">
                          PDF Attached
                        </span>
                        <button
                          type="button"
                          onClick={() => form.setValue("pdfUrl", "")}
                          className="p-1 hover:bg-primary/10 rounded-full"
                        >
                          <X className="h-3 w-3 text-primary" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0 p-4 bg-slate-50 border rounded-xl">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-primary" />
                    </FormControl>
                    <FormLabel className="font-bold cursor-pointer">Course is active and visible</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCourse ? "Update Course" : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Delete Course?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
