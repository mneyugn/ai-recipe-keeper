import React, { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";

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
      <div className="fixed left-0 top-0 h-full w-80 z-40 bg-background border-r border-border">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return <AppSidebar user={user ?? undefined} currentPath={currentPath} onLogout={handleLogout} />;
}
