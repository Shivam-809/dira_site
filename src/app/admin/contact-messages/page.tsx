"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Loader2, ArrowLeft, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
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

    // Mark as read if it's new
    if (message.status === "new") {
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
    if (status === "new") {
      return <Badge className="bg-blue-500">New</Badge>;
    }
    return <Badge variant="secondary">Read</Badge>;
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
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Contact Messages</h1>
            <p className="text-muted-foreground mt-2">
              View and manage messages from your customers
            </p>
          </div>

          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No messages yet</h2>
                <p className="text-muted-foreground">
                  Messages from your contact form will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{message.subject}</CardTitle>
                          {getStatusBadge(message.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium">{message.name}</span>
                          <span>•</span>
                          <span>{message.email}</span>
                          <span>•</span>
                          <span>
                            {new Date(message.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMessage(message)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setMessageToDelete(message.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">From</p>
                  <p className="text-muted-foreground">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Email</p>
                  <p className="text-muted-foreground">{selectedMessage.email}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Date</p>
                  <p className="text-muted-foreground">
                    {new Date(selectedMessage.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Status</p>
                  {getStatusBadge(selectedMessage.status)}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Message</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMessageToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
