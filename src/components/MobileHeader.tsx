import React from "react";
import { ChefHat, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  showHamburger?: boolean;
  onHamburgerClick?: () => void;
}

/**
 * Mobile Header Component
 * Displays logo and site name on small screens (when bottom bar is active)
 * Also handles hamburger menu for tablet sizes
 */
export function MobileHeader({ showHamburger = false, onHamburgerClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-50 backdrop-blur-xl bg-background/95 border-b border-border/20 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Brand */}
        <a href="/recipes" className="flex items-center space-x-3 group hover:opacity-80 transition-opacity">
          {/* Premium logo with gradient */}
          <div className="relative">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 w-8 h-8 bg-primary/20 rounded-lg blur-sm -z-10" />
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RecipeKeeper
            </h1>
            <p className="text-xs text-muted-foreground font-medium -mt-0.5 hidden sm:block">
              Twoja kulinarna baza wiedzy
            </p>
          </div>
        </a>

        {/* Hamburger Menu Button (for tablet sizes) */}
        {showHamburger && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHamburgerClick}
            className="md:flex lg:hidden hidden p-2 hover:bg-accent/50 rounded-lg transition-colors"
            aria-label="Otwórz menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
