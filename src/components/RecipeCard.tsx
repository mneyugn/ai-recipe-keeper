import React from "react";
import type { RecipeListItemDTO } from "../types";

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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden focus:ring-2 focus:ring-blue-500 focus:outline-none group"
    >
      {/* Zdjęcie przepisu */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              // Fallback gdy zdjęcie się nie ładuje
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML =
                  '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">Brak zdjęcia</span></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
              <span className="text-gray-400 text-sm">Brak zdjęcia</span>
            </div>
          </div>
        )}
      </div>

      {/* Zawartość karty */}
      <div className="p-4">
        {/* Nazwa przepisu */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {recipe.name}
        </h3>

        {/* Czas przygotowania */}
        {recipe.preparation_time && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {recipe.preparation_time}
          </div>
        )}

        {/* Data utworzenia */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mb-3">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {new Date(recipe.created_at).toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>

        {/* Tagi */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full transition-colors"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
