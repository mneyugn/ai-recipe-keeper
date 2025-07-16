import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const RecipeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-md border-0 overflow-hidden h-[380px] flex flex-col">
      {/* Hero Image Skeleton - fixed height */}
      <div className="h-48 bg-muted animate-pulse" />

      {/* Content section - flex grow to fill remaining space */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* Title section */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
          {/* Separator line skeleton */}
          <Skeleton className="h-0.5 w-12 rounded-full mt-2" />
        </div>

        {/* Tags section */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Spacer to push action to bottom */}
        <div className="flex-1" />

        {/* Action indicator skeleton */}
        <div className="flex items-center space-x-2 mt-auto">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>

      {/* Bottom accent line skeleton */}
      <Skeleton className="h-1 w-full" />
    </div>
  );
};

export default RecipeCardSkeleton;
