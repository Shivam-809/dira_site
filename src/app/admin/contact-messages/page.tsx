"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Loader2, ArrowLeft, Eye, Trash2, Inbox, Calendar, User, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ContactMessage {
  id: number;
  userName: string;
  userEmail: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContactMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          localStorage.removeItem("admin_token");
          toast.error("Session expired. Please login again.");
          router.push("/admin/login");
          return;
        }

        setSessionLoading(false);
        fetchMessages();
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("admin_token");
        toast.error("Session verification failed. Please login again.");
        router.push("/admin/login");
      }
    };

    verifyAdminSession();
  }, [router]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/contact-messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        toast.error("Failed to load messages");
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setDialogOpen(true);

    if (message.status === "unread") {
      markAsRead(message.id);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/contact-messages?id=${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "read" }),
      });

      if (response.ok) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, status: "read" } : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/contact-messages?id=${messageToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Message deleted");
        setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
      } else {
        toast.error("Failed to delete message");
      }
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "unread") {
      return <Badge className="bg-primary hover:bg-primary border-none font-bold text-[10px] uppercase">Unread</Badge>;
    }
    return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] uppercase">Read</Badge>;
  };

  const filteredMessages = messages.filter(msg => 
    msg.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    msg.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8 space-y-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2 text-slate-500 hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">Inquiries</h1>
                  <p className="text-slate-500 font-medium">
                    Customer support and general contact messages.
                  </p>
               </div>
               <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search messages..." 
                    className="pl-10 bg-white border-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <Card className="border-none shadow-sm py-20 text-center bg-white">
              <CardContent>
                <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                  <Inbox className="h-10 w-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Clear Inbox</h2>
                <p className="text-slate-500">
                  {searchQuery ? "No messages match your search" : "No customer inquiries found at the moment"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMessages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`border-none shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden ${message.status === 'unread' ? 'ring-1 ring-primary/20 bg-white' : 'bg-white opacity-80'}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                       <div className={`w-1.5 ${message.status === 'unread' ? 'bg-primary' : 'bg-transparent'}`}></div>
                       <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 uppercase">
                                 {message.userName.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-900 leading-none mb-1">{message.userName}</p>
                                  <p className="text-xs text-slate-400 font-medium">{message.userEmail}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="text-right hidden md:block">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Received</p>
                                  <p className="text-xs font-bold text-slate-600">
                                    {new Date(message.createdAt).toLocaleDateString()}
                                  </p>
                               </div>
                               {getStatusBadge(message.status)}
                            </div>
                          </div>
                          
                          <p className="text-slate-600 text-sm line-clamp-2 italic border-l-2 border-slate-100 pl-4">
                            "{message.message}"
                          </p>
                          
                          <div className="mt-4 flex items-center justify-end gap-2">
                             <Button variant="ghost" size="sm" className="h-8 text-xs font-bold">
                               <Eye className="h-3.5 w-3.5 mr-1.5" /> View Full
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 text-xs font-bold text-destructive hover:bg-destructive hover:text-white"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setMessageToDelete(message.id);
                                 setDeleteDialogOpen(true);
                               }}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-3xl">
          {selectedMessage && (
            <div className="flex flex-col">
               <div className="bg-primary p-8 text-white">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                        <Mail className="h-6 w-6" />
                     </div>
                     {getStatusBadge(selectedMessage.status)}
                  </div>
                  <h2 className="text-3xl font-black mb-1">Customer Inquiry</h2>
                  <p className="text-white/70 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Received on {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
               </div>
               
               <div className="p-8 bg-white space-y-8">
                  <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <User className="h-3 w-3" /> Sender Name
                      </p>
                      <p className="font-bold text-slate-900">{selectedMessage.userName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email Address
                      </p>
                      <p className="font-bold text-slate-900">{selectedMessage.userEmail}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <Inbox className="h-3 w-3" /> Message Content
                    </p>
                    <div className="p-6 bg-slate-50 rounded-3xl text-slate-700 leading-relaxed italic relative">
                       {selectedMessage.message}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 rounded-2xl font-bold h-12 shadow-lg shadow-primary/20" asChild>
                      <a href={`mailto:${selectedMessage.userEmail}?subject=Direct response from Dira Sakalya Wellbeing`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Compose Reply
                      </a>
                    </Button>
                    <Button variant="outline" className="rounded-2xl font-bold h-12 border-slate-200" onClick={() => setDialogOpen(false)}>
                      Dismiss
                    </Button>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Delete Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently remove this customer inquiry. You won't be able to recover it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-2xl font-bold border-slate-200" onClick={() => setMessageToDelete(null)}>
              Keep Message
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl font-bold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
