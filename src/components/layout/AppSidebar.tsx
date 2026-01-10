"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBasket,
  Stethoscope,
  CloudSun,
  Wallet,
  User,
  LogOut,
  Leaf,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app/dashboard" },
  { icon: ShoppingBasket, label: "Marketplace", path: "/app/marketplace" },
  { icon: Stethoscope, label: "Crop Doctor", path: "/app/crop-doctor" },
  { icon: CloudSun, label: "Climate Advisory", path: "/app/climate-advisory" },
  { icon: Wallet, label: "Finances", path: "/app/finances" },
  { icon: MessageCircle, label: "Messages", path: "/app/chat" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const AppSidebar = ({ collapsed, onToggle, isMobile = false }: AppSidebarProps) => {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col",
        isMobile ? "w-64" : "fixed left-0 top-0 z-40",
        !isMobile && (collapsed ? "w-20" : "w-64")
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border overflow-hidden">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-emerald flex items-center justify-center shadow-lg flex-shrink-0">
            <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className={cn(
            "text-xl font-bold text-sidebar-foreground whitespace-nowrap transition-all duration-300 overflow-hidden",
            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            Ani<span className="text-sidebar-primary">-Digital</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => {
                if (isMobile) {
                  onToggle();
                }
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              <span className={cn(
                "whitespace-nowrap transition-all duration-300 overflow-hidden",
                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button - Desktop only */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border overflow-hidden">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => signOut()}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={cn(
            "whitespace-nowrap transition-all duration-300 overflow-hidden",
            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            Logout
          </span>
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
