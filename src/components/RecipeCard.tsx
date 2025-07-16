import React from "react";
import type { RecipeListItemDTO } from "../types";
import { Badge } from "@/components/ui/badge";

interface RecipeCardProps {
  recipe: RecipeListItemDTO;
  onClick: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const handleClick = () => {
    // Walidacja ID przepisu
    if (!recipe.id || typeof recipe.id !== "string") {
      console.error("Invalid recipe ID:", recipe.id);
      return;
    }
    onClick(recipe.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Otwórz przepis: ${recipe.name}`}
      className="group bg-card/95 backdrop-blur-sm text-card-foreground rounded-xl shadow-md hover:shadow-2xl 
                 border-0 overflow-hidden cursor-pointer transform-gpu transition-all duration-300 
                 hover:-translate-y-1 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-ring 
                 focus-visible:outline-none active:scale-[0.98]"
    >
      {/* Hero Image z gradient overlay */}
      <div className="relative h-52 bg-muted overflow-hidden">
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
                      <div class="text-center p-6">
                        <svg class="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span class="text-muted-foreground text-sm font-medium">Brak zdjęcia</span>
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
            <div className="text-center p-6">
              <svg
                className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-60"
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
              <span className="text-muted-foreground text-sm font-medium">Brak zdjęcia</span>
            </div>
          </div>
        )}

        {/* Floating badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          {recipe.preparation_time && (
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/20 dark:bg-black/20 border-white/30 
                         text-white dark:text-white shadow-lg text-xs font-medium px-2 py-1"
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
        <div className="absolute bottom-4 left-4">
          <Badge
            variant="outline"
            className="backdrop-blur-md bg-white/10 dark:bg-black/10 border-white/20 
                       text-white dark:text-white text-xs font-normal px-2 py-1"
          >
            {new Date(recipe.created_at).toLocaleDateString("pl-PL", {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        </div>
      </div>

      {/* Content section z lepszym spacing */}
      <div className="p-6 space-y-4">
        {/* Nazwa przepisu */}
        <div className="space-y-2 h-16">
          <h3
            className="font-semibold text-xl leading-tight line-clamp-2 
                         group-hover:text-primary transition-colors duration-200"
          >
            {recipe.name}
          </h3>

          {/* Separator line */}
          <div
            className="w-12 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        {/* Tags section */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs font-normal px-2 py-0.5 border-border/50 
                           hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200"
              >
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs font-normal px-2 py-0.5 bg-muted/50 hover:bg-muted transition-colors duration-200"
              >
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Hover action indicator */}
        <div
          className="flex items-center text-primary opacity-0 group-hover:opacity-100 
                        transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
        >
          <span className="text-sm font-medium mr-2">Zobacz przepis</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="h-1 bg-gradient-to-r from-primary via-accent to-primary 
                      transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
      />
    </div>
  );
};

export default RecipeCard;
