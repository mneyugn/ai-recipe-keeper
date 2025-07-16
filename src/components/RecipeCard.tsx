import React from "react";
import type { RecipeListItemDTO } from "../types";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RecipeCardProps {
  recipe: RecipeListItemDTO;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const recipeUrl = `/recipes/${recipe.id}`;

  return (
    <a
      href={recipeUrl}
      aria-label={`Otwórz przepis: ${recipe.name}`}
      className="group bg-card/95 backdrop-blur-sm text-card-foreground rounded-xl shadow-md hover:shadow-xl 
                 border-0 overflow-hidden cursor-pointer transform-gpu transition-all duration-300 
                 hover:-translate-y-0.5 hover:scale-[1.00] focus-visible:ring-2 focus-visible:ring-ring 
                 focus-visible:outline-none active:scale-[0.98] block h-[320px] flex flex-col"
    >
      {/* Hero Image z gradient overlay */}
      <div className="relative h-40 bg-muted overflow-hidden flex-shrink-0">
        {recipe.image_url ? (
          <>
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                // Fallback gdy zdjęcie się nie ładuje
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                      <div class="text-center p-3">
                        <svg class="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span class="text-muted-foreground text-xs font-medium">Brak zdjęcia</span>
                      </div>
                    </div>
                  `;
                }
              }}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <div className="text-center p-3">
              <svg
                className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60"
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
              <span className="text-muted-foreground text-xs font-medium">Brak zdjęcia</span>
            </div>
          </div>
        )}

        {/* Floating badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {recipe.preparation_time && (
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/20 dark:bg-black/20 border-white/30 
                         text-white dark:text-white shadow-lg text-xs font-medium px-2 py-0.5"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {recipe.preparation_time}
            </Badge>
          )}
        </div>

        {/* Date badge - bottom left */}
        <div className="absolute bottom-2 left-2">
          <Badge
            variant="outline"
            className="backdrop-blur-md bg-white/10 dark:bg-black/10 border-white/20 
                       text-white dark:text-white text-xs font-normal px-2 py-0.5"
          >
            {new Date(recipe.created_at).toLocaleDateString("pl-PL", {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        </div>
      </div>

      {/* Content section z lepszym spacing */}
      <div className="p-3 flex flex-col flex-1 justify-between space-y-1">
        {/* Top section - Tytuł i tagi */}
        <div className="space-y-1">
          {/* Nazwa przepisu */}
          <div className="h-10">
            <h3
              className="font-semibold text-base leading-tight line-clamp-2 
                         group-hover:text-primary transition-colors duration-200"
            >
              {recipe.name}
            </h3>
          </div>

          {/* Tags section - jedna linia z tooltipem */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="h-5 flex items-center">
              <div className="flex items-center gap-1 overflow-hidden">
                {recipe.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs font-normal px-1.5 py-0.5 border-border/50 
                               hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200 whitespace-nowrap"
                  >
                    {tag}
                  </Badge>
                ))}
                {recipe.tags.length > 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal px-1.5 py-0.5 bg-muted/50 hover:bg-muted transition-colors duration-200 whitespace-nowrap"
                      >
                        +{recipe.tags.length - 2}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(2).map((tag) => (
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
            </div>
          )}
        </div>

        {/* Bottom section - Hover action indicator */}
        <div className="mt-auto">
          {/* Separator line */}
          <div
            className="w-6 h-0 bg-gradient-to-r from-primary to-accent rounded-full 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />

          <div
            className="flex items-center text-primary opacity-0 group-hover:opacity-100 
                          transition-all duration-200 transform translate-y-1 group-hover:translate-y-0"
          >
            <span className="text-xs font-medium mr-1">Zobacz przepis</span>
            <svg
              className="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary 
                      transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
      />
    </a>
  );
};

export default RecipeCard;
