import { Button } from "@/components/ui/button";
import type { LogoutButtonProps } from "../../types";

/**
 * LogoutButton component for user logout functionality
 * Shows loading state during logout process
 */
export function LogoutButton({ onLogout, isLoading = false }: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Error handling is done in the hook, but we can add fallback here
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full sm:w-auto min-w-[120px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 focus-visible:ring-red-500"
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
          <span>Wylogowywanie...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Wyloguj się</span>
        </div>
      )}
    </Button>
  );
}
