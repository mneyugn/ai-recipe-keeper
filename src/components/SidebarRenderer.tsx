import React, { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { ChefHat } from "lucide-react";

interface User {
  email: string;
  name?: string;
  recipeCount?: number;
}

export function SidebarRenderer() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Funkcja do pobrania danych użytkownika
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const response = await fetch("/api/users/profile");
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Błąd pobierania danych użytkownika:", error);
    }
    return null;
  };

  // Funkcja wylogowania
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    }
  };

  // Inicjalizacja danych
  useEffect(() => {
    const initializeSidebar = async () => {
      setCurrentPath(window.location.pathname);
      const userData = await getCurrentUser();
      setUser(userData);
      setIsLoading(false);
    };

    initializeSidebar();
  }, []);

  // Obsługa zmian ścieżki (dla SPA navigation)
  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePathChange);

    // Obsługa View Transitions API Astro
    document.addEventListener("astro:page-load", handlePathChange);

    return () => {
      window.removeEventListener("popstate", handlePathChange);
      document.removeEventListener("astro:page-load", handlePathChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed left-0 top-0 h-full w-80 z-40 backdrop-blur-xl bg-sidebar/95 border-r border-sidebar-border/20 shadow-xl hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Brand section skeleton */}
          <div className="p-6 border-b border-sidebar-border/10">
            <div className="flex items-center space-x-3">
              {/* Logo skeleton with glow */}
              <div className="relative">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center animate-shimmer">
                  <ChefHat className="w-6 h-6 text-sidebar-foreground/30" />
                </div>
                <div className="absolute inset-0 w-10 h-10 bg-primary/10 rounded-xl blur-md -z-10" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="h-5 w-32 bg-muted animate-shimmer rounded-md" />
                <div className="h-3 w-24 bg-muted animate-shimmer rounded-sm" />
              </div>
            </div>
          </div>

          {/* Navigation skeleton */}
          <div className="flex-1 p-4 space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between px-3 py-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-muted animate-shimmer rounded-md" />
                  <div className="h-4 w-24 bg-muted animate-shimmer rounded-md" />
                </div>
                {i === 1 && <div className="w-8 h-5 bg-muted animate-shimmer rounded-full" />}
              </div>
            ))}
          </div>

          {/* User section skeleton */}
          <div className="p-4 border-t border-sidebar-border/10">
            <div className="flex items-center space-x-3 p-3 rounded-xl">
              <div className="relative">
                <div className="w-10 h-10 bg-muted animate-shimmer rounded-full" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success/30 rounded-full border-2 border-sidebar" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-4 w-20 bg-muted animate-shimmer rounded-md" />
                <div className="h-3 w-32 bg-muted animate-shimmer rounded-sm" />
              </div>
              <div className="w-4 h-4 bg-muted animate-shimmer rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AppSidebar user={user ?? undefined} currentPath={currentPath} onLogout={handleLogout} />;
}
