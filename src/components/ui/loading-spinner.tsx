import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   */
  size?: "sm" | "md" | "lg";
  /**
   * Text to display below the spinner
   */
  text?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Minimum height for the container
   */
  minHeight?: string;
}

/**
 * Reusable loading spinner component
 * Designed to prevent layout shifts on mobile devices
 */
export function LoadingSpinner({ size = "md", text, className, minHeight = "50vh" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  const spinnerClass = cn("border-primary/20 border-t-primary rounded-full animate-spin", sizeClasses[size]);

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)} style={{ minHeight }}>
      <div className={spinnerClass} />
      {text && <p className="text-sm text-muted-foreground text-center">{text}</p>}
    </div>
  );
}
