import { useState, useEffect } from "react";

/**
 * Custom hook for detecting mobile devices
 * Detects when bottom bar navigation is visible (screen width < 768px)
 *
 * @returns boolean indicating if current device is mobile
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Match the lg:hidden breakpoint from MobileBottomNav component
      setIsMobile(window.innerWidth < 768);
    };

    // Check immediately
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}
