"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Loader2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EnrollmentDialog from "@/components/EnrollmentDialog";

interface Course {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
  price: number;
  pdfUrl: string | null;
  isActive: boolean;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data.filter((c: Course) => c.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnrollNow = (course: Course) => {
    setSelectedCourse(course);
    setIsEnrollmentOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5DC]">
      <Navbar />
      <main className="flex-1 py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black mb-4 flex items-center justify-center gap-3 text-slate-900">
              <BookOpen className="h-10 w-10 text-primary" />
              Spiritual Courses
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto italic font-medium">
              Deepen your mystical knowledge through our curated sacred workshops and teachings.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Card key={course.id} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white overflow-hidden group">
                  <div className="h-3 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader>
                    <CardTitle className="text-3xl font-black text-slate-900">{course.heading}</CardTitle>
                    <CardDescription className="text-lg font-serif italic text-primary/70">{course.subheading}</CardDescription>
                  </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-slate-600 leading-relaxed font-medium line-clamp-4">
                        {course.description}
                      </p>
                      <div className="flex flex-col gap-3">
                        {course.pdfUrl && (
                          <Button variant="outline" className="w-full font-bold border-primary/20 hover:bg-primary/5 text-primary" asChild>
                            <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                              <FileText className="h-4 w-4" /> View Curriculum
                            </a>
                          </Button>
                        )}
                        <div className="flex items-center justify-between border-t border-primary/10 pt-4 mt-2">
                          <span className="text-2xl font-black text-primary">₹{course.price}</span>
                          <Button 
                            className="font-bold group bg-primary hover:bg-primary/90"
                            onClick={() => handleEnrollNow(course)}
                          >
                            Enroll Now <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedCourse && (
              <EnrollmentDialog 
                isOpen={isEnrollmentOpen} 
                onOpenChange={setIsEnrollmentOpen} 
                course={selectedCourse} 
              />
            )}
          </div>
        </main>
        <Footer />
      </div>

  );
}
