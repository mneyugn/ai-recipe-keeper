import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const RecipeListItemSkeleton: React.FC = () => {
  return (
    <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-sm border border-border/50 overflow-hidden h-24 flex items-center">
      {/* Miniaturka z lewej strony - szkielet */}
      <div className="w-20 h-full bg-muted animate-pulse flex-shrink-0" />

      {/* Główna zawartość - szkielet */}
      <div className="flex-1 p-4 min-w-0 flex items-center justify-between">
        {/* Lewa sekcja - Nazwa i tagi */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Nazwa przepisu - szkielet (2 linie) */}
          <div className="space-y-1">
            <Skeleton className="h-5 w-full max-w-64" />
            <Skeleton className="h-5 w-2/3 max-w-48" />
          </div>

          {/* Tagi - szkielety */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-18 rounded-full" />
          </div>
        </div>

        {/* Prawa sekcja - Tylko strzałka */}
        <div className="flex items-center ml-4">
          <Skeleton className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default RecipeListItemSkeleton;
