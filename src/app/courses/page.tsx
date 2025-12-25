"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Sparkles, Moon, Star, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Course {
  id: number;
  heading: string;
  subheading: string | null;
  description: string | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-serif bg-background">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="w-12 h-px bg-primary/30" />
                <GraduationCap className="h-6 w-6 text-primary/60" />
                <div className="w-12 h-px bg-primary/30" />
              </div>
              <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-foreground">
                Spiritual Learning
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
                Unlock ancient wisdom and master your intuitive gifts through our sacred courses.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 border-t-2 border-primary rounded-full animate-spin" />
                <p className="italic text-primary animate-pulse">Unfolding sacred scrolls...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 space-y-6">
                <Moon className="h-16 w-16 text-primary/20 mx-auto" />
                <h2 className="text-2xl italic text-muted-foreground">New courses are currently being channeled.</h2>
                <Link href="/contact">
                  <Button variant="outline" className="rounded-full px-8">Join the Waitlist</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {courses.map((course) => (
                  <div 
                    key={course.id} 
                    className="group flex flex-col bg-white/40 backdrop-blur-sm border border-primary/10 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-700 hover:-translate-y-2"
                  >
                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <BookOpen className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors duration-500" />
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/20">Divine Knowledge</Badge>
                        </div>
                        <h2 className="text-3xl font-serif text-foreground group-hover:text-primary transition-colors">
                          {course.heading}
                        </h2>
                        {course.subheading && (
                          <p className="text-sm font-serif italic text-primary/70">
                            {course.subheading}
                          </p>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed italic flex-1">
                        {course.description}
                      </p>
                      
                      <div className="pt-6">
                        <Link href="/contact">
                          <Button className="w-full bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all font-serif italic py-6">
                            Enroll in Journey
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/[0.02]" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-md p-12 rounded-[3rem] border border-primary/10 shadow-xl text-center space-y-8">
              <Sparkles className="h-12 w-12 text-primary/40 mx-auto" />
              <h2 className="text-4xl font-serif italic">Ready to begin your evolution?</h2>
              <p className="text-xl text-muted-foreground italic leading-relaxed">
                Our courses are designed for those ready to commit to their spiritual growth. Limited seats are available for each cohort to ensure personalized guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="rounded-full px-12 py-8 text-xl font-serif italic shadow-lg shadow-primary/20">
                    Apply for Enrollment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
