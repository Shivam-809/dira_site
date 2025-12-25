"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Sparkles, 
  BookOpen, 
  Users, 
  MessageSquare, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { 
    title: "Dashboard", 
    href: "/admin", 
    icon: LayoutDashboard 
  },
  { 
    title: "Shop Management", 
    href: "/admin/shop", 
    icon: ShoppingBag 
  },
  { 
    title: "Services Management", 
    href: "/admin/services", 
    icon: Sparkles 
  },
  { 
    title: "Courses Management", 
    href: "/admin/courses", 
    icon: BookOpen 
  },
  { 
    title: "User Management", 
    href: "/admin/users", 
    icon: Users 
  },
  { 
    title: "Orders", 
    href: "/admin/orders", 
    icon: ShoppingBag 
  },
  { 
    title: "Messages", 
    href: "/admin/contact-messages", 
    icon: MessageSquare 
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-black">
            D
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">DIRA Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}>
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:bg-destructive/5 hover:text-destructive font-bold rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
