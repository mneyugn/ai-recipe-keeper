import React from "react";
import type { RecipeListItemDTO } from "../types";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RecipeListItemProps {
  recipe: RecipeListItemDTO;
}

const RecipeListItem: React.FC<RecipeListItemProps> = ({ recipe }) => {
  const recipeUrl = `/recipes/${recipe.id}`;

  return (
    <a
      href={recipeUrl}
      aria-label={`Otwórz przepis: ${recipe.name}`}
      className="group bg-card/95 backdrop-blur-sm text-card-foreground rounded-lg shadow-sm hover:shadow-md 
                 border border-border/50 overflow-hidden cursor-pointer transform-gpu transition-all duration-200 
                 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none 
                 active:scale-[0.99] block h-24 flex items-center"
    >
      {/* Miniaturka z lewej strony */}
      <div className="relative w-28 h-full bg-muted overflow-hidden flex-shrink-0">
        {recipe.image_url ? (
          <>
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Fallback
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                      <svg class="w-6 h-6 text-muted-foreground opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  `;
                }
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <svg
              className="w-6 h-6 text-muted-foreground opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Główna zawartość */}
      <div className="flex-1 p-4 min-w-0 flex items-center justify-between">
        {/* Lewa sekcja - Nazwa i tagi */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Nazwa przepisu - więcej miejsca */}
          <h3
            className="font-semibold text-base leading-5 line-clamp-2 
                       group-hover:text-primary transition-colors duration-200"
          >
            {recipe.name}
          </h3>

          {/* Tagi - jedna linia z overflow */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex items-center gap-1 overflow-hidden">
              {recipe.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs font-normal px-1.5 py-0.5 border-border/50 
                             hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200 
                             whitespace-nowrap"
                >
                  {tag}
                </Badge>
              ))}
              {recipe.tags.length > 4 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal px-1.5 py-0.5 bg-muted/50 hover:bg-muted 
                                 transition-colors duration-200 whitespace-nowrap"
                    >
                      +{recipe.tags.length - 4}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(4).map((tag) => (
                        <span key={tag} className="text-xs">
                          {tag}
                          {recipe.tags.indexOf(tag) < recipe.tags.length - 1 ? "," : ""}
                        </span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* Prawa sekcja - Tylko strzałka */}
        <div className="flex items-center ml-4">
          <svg
            className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
};

export default RecipeListItem;
