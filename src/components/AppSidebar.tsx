import React, { useState, useEffect } from "react";
import { BookOpen, Plus, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface User {
  email: string;
  name?: string;
  recipeCount?: number;
}

interface SidebarProps {
  user?: User;
  currentPath: string;
  onLogout: () => void;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function AppSidebar({ user, currentPath, onLogout, className = "" }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Sprawdzanie rozmiaru ekranu
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Zamykanie mobile sidebara przy zmianie ścieżki
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentPath]);

  // Blokowanie przewijania gdy mobile sidebar jest otwarty
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isMobileOpen]);

  const navigationItems: NavigationItem[] = [
    {
      id: "recipes",
      label: "Moje Przepisy",
      href: "/recipes",
      icon: <BookOpen className="w-5 h-5" />,
      badge: user?.recipeCount,
    },
    {
      id: "add-recipe",
      label: "Dodaj Przepis",
      href: "/recipes/new",
      icon: <Plus className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/recipes") {
      return currentPath === "/recipes" || currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  const getUserInitials = (user?: User) => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI RecipeKeeper</h1>
            <p className="text-xs text-muted-foreground">Twoje przepisy</p>
          </div>
        </div>

        {isMobile && (
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`
              flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
            `}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && item.badge > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </a>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-accent">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-sm font-medium">{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{user?.name || "Użytkownik"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <a href="/profile" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Mój Profil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setIsMobileOpen(false)}
              aria-label="Close sidebar"
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-80 max-w-[calc(100vw-2rem)] animate-in slide-in-from-left duration-300">
              <SidebarContent />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className={`fixed left-0 top-0 h-full w-80 z-40 ${className}`}>
      <SidebarContent />
    </div>
  );
}

// Hook do zarządzania stanem sidebara
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return {
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed: () => setIsCollapsed(!isCollapsed),
  };
}
