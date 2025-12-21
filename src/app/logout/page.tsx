"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    handleLogout();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("bearer_token");

      const { error } = await authClient.signOut({
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      if (error?.code) {
        toast.error("Logout failed");
      } else {
        localStorage.removeItem("bearer_token");
        toast.success("Logged out successfully");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Logging out...</p>
      </div>
    </div>
  );
}
