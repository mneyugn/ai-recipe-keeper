import React, { useState, useEffect } from "react";
import { BookOpen, Plus, User, LogOut, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "./MobileHeader";

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

// Enhanced Mobile Bottom Navigation Component
const MobileBottomNav: React.FC<{
  navigationItems: NavigationItem[];
  currentPath: string;
}> = ({ navigationItems, currentPath }) => {
  const isActive = (href: string) => {
    if (href === "/recipes") {
      return currentPath === "/recipes" || currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  // Enhanced navigation items for mobile with better spacing
  const mobileNavItems = [
    ...navigationItems,
    {
      id: "profile",
      label: "Profil",
      href: "/profile",
      icon: <User className="w-5 h-5" />,
      badge: undefined,
    },
  ];

  const handleItemClick = () => {
    // Add haptic feedback if supported
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 mx-3 
                 rounded-3xl backdrop-blur-2xl bg-gradient-to-r from-background/95 via-background/98 to-background/95
                 border-2 border-border/40 shadow-2xl shadow-black/25
                 before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-r 
                 before:from-primary/8 before:via-accent/8 before:to-primary/8 before:blur-xl before:-z-10
                 ring-1 ring-white/10"
      style={{
        marginBottom: `calc(0.75rem + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
      }}
    >
      {/* Top glow effect */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative grid grid-cols-3 px-2 py-3">
        {mobileNavItems.map((item, _index) => {
          const active = isActive(item.href);

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={() => handleItemClick()}
              className={`
                relative flex flex-col items-center justify-center py-2 px-3 rounded-xl
                transform-gpu transition-all duration-300 ease-out group
                hover:scale-105 active:scale-95
                ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
              style={{
                transformOrigin: "center bottom",
              }}
            >
              {/* Icon container with enhanced effects */}
              <div
                className={`
                  relative mb-2 p-2.5 rounded-xl transition-all duration-300 ease-out shadow-xs bg-primary/10
                  ${
                    active
                      ? "bg-primary/15 text-primary scale-110 shadow-lg shadow-primary/20"
                      : "group-hover:bg-secondary/50 group-hover:scale-105"
                  }

                `}
              >
                {/* Icon glow effect for active state */}
                {active && <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md" />}

                <div className="relative z-10">{item.icon}</div>

                {/* Badge with enhanced styling */}
                {item?.badge && item?.badge > 0 && (
                  <div
                    className={`
                      absolute -top-1 -right-1 min-w-[20px] h-5 px-1
                      bg-gradient-to-r from-red-500 to-red-600 text-white
                      rounded-full flex items-center justify-center text-xs font-bold
                      shadow-lg shadow-red-500/30 border border-white/20
                      transform transition-all duration-200
                      ${active ? "scale-110" : "group-hover:scale-105"}
                    `}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </div>
                )}

                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div
                    className={`
                    absolute inset-0 bg-primary/10 rounded-xl transform scale-0 
                    group-active:scale-100 transition-transform duration-200 ease-out
                  `}
                  />
                </div>
              </div>

              {/* Label with better typography */}
              <span
                className={`
                  text-xs font-medium text-center leading-tight transition-all duration-300
                  ${
                    active
                      ? "font-semibold text-primary scale-105"
                      : "group-hover:text-foreground group-hover:scale-105"
                  }
                `}
              >
                {item.label}
              </span>

              {/* Active state bottom indicator */}
              {active && (
                <div className="absolute bottom-1 inset-x-4 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full shadow-sm" />
              )}

              {/* Hover effect overlay */}
              <div
                className={`
                absolute inset-0 rounded-xl transition-opacity duration-200
                ${
                  active
                    ? "bg-gradient-to-t from-primary/5 to-transparent opacity-100"
                    : "bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100"
                }
              `}
              />
            </a>
          );
        })}
      </div>

      {/* Bottom reflection effect */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </nav>
  );
};

export function AppSidebar({ user, currentPath, onLogout, className = "" }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop");

  // Enhanced screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize("mobile");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsTabletMenuOpen(false);
  }, [currentPath]);

  // Handle body overflow for mobile menu
  useEffect(() => {
    if (screenSize === "mobile" && isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [screenSize, isMobileOpen]);

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
    <div className="flex flex-col h-full backdrop-blur-xl bg-sidebar/95 border-r border-sidebar-border/20 shadow-xl">
      {/* Enhanced Brand Section */}
      <div className="p-6 border-b border-sidebar-border/10">
        <a href="/recipes" className="flex items-center space-x-3 group hover:opacity-80 transition-opacity">
          {/* Premium logo with gradient */}
          <div className="relative">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 w-10 h-10 bg-primary/20 rounded-xl blur-md -z-10" />
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RecipeKeeper
            </h1>
            <p className="text-xs text-sidebar-foreground/70 font-medium mt-0.5">Twoja kulinarna baza wiedzy</p>
          </div>
        </a>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              key={item.id}
              href={item.href}
              className={`
                group relative flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium 
                transform-gpu transition-all duration-200
                ${
                  active
                    ? "bg-gradient-to-r from-sidebar-primary/15 via-sidebar-primary/10 to-transparent text-sidebar-primary border border-sidebar-primary/20 shadow-md"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:shadow-sm active:scale-95"
                }
              `}
            >
              {/* Active indicator line */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-r-full" />
              )}

              <div className="flex items-center space-x-3 relative z-10">
                <div className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-105"}`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </div>

              {/* Badge with enhanced styling */}
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="secondary"
                  className={`
                    ml-auto text-xs font-semibold transition-all duration-200
                    ${
                      active
                        ? "bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30"
                        : "bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-sidebar-primary/10 group-hover:text-sidebar-primary"
                    }
                  `}
                >
                  {item.badge}
                </Badge>
              )}

              {/* Hover glow effect */}
              {!active && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </a>
          );
        })}
      </nav>

      {/* Enhanced User Section */}
      <div className="p-4 border-t border-sidebar-border/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto hover:bg-sidebar-accent/50 rounded-xl group transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center space-x-3 w-full">
                {/* Enhanced Avatar */}
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-sidebar-border/20 shadow-md">
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary/20 to-accent/20 text-sidebar-foreground">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar shadow-sm" />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name || "Użytkownik"}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                </div>

                {/* Chevron indicator */}
                <svg
                  className="w-4 h-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-popover/95 border-border/20 shadow-xl">
            <DropdownMenuItem asChild>
              <a href="/profile" className="flex items-center group cursor-pointer">
                <User className="w-4 h-4 mr-3 group-hover:text-primary transition-colors" />
                <span className="group-hover:text-primary transition-colors">Mój Profil</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/20" />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer group"
            >
              <LogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
              <span>Wyloguj</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // Mobile (< 768px): Bottom navigation + Mobile header
  if (screenSize === "mobile") {
    return (
      <>
        <MobileHeader />
        <MobileBottomNav navigationItems={navigationItems} currentPath={currentPath} />
      </>
    );
  }

  // Tablet (768px - 1023px): Hamburger menu + Mobile header
  if (screenSize === "tablet") {
    return (
      <>
        <MobileHeader showHamburger={true} onHamburgerClick={() => setIsTabletMenuOpen(true)} />
        <Sheet open={isTabletMenuOpen} onOpenChange={setIsTabletMenuOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop (>= 1024px): Fixed sidebar (current behavior)
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
