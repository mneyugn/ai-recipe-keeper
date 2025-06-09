import { useState } from "react";

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for handling user logout
 * Manages logout state and provides logout functionality
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Call logout endpoint if it exists, or handle client-side logout
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        // If logout endpoint doesn't exist or fails, we still try to redirect
        console.warn("Logout endpoint failed, proceeding with client-side logout");
      }

      // Clear any client-side storage if needed
      // localStorage.removeItem("auth-token"); // If using localStorage
      // sessionStorage.clear(); // If using sessionStorage

      // Redirect to login page
      window.location.href = "/login";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas wylogowania";
      setError(errorMessage);
      console.error("Error during logout:", err);

      // Even if logout fails, redirect to login as fallback
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
    error,
  };
}
