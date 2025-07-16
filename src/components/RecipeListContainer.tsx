import React, { useMemo } from "react";
import type { RecipeListQueryParams } from "../types";
import RecipeCard from "./RecipeCard";
import RecipeCardSkeleton from "./RecipeCardSkeleton";
import SortSelector from "./SortSelector";
import TagFilter from "./TagFilter";
import { useRecipeList } from "./hooks/useRecipeList";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { useTags } from "./hooks/useTags";
import { Button } from "@/components/ui/button";

interface RecipeListContainerProps {
  initialParams: RecipeListQueryParams;
  userId: string;
}

const RecipeListContainer: React.FC<RecipeListContainerProps> = ({ initialParams, userId }) => {
  const { tags: availableTags, isLoading: isLoadingTags, error: tagsError } = useTags();

  const tagIdToSlug = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((tag) => map.set(tag.id, tag.slug));
    return map;
  }, [availableTags]);

  const modifiedInitialParams = useMemo(
    () => ({
      ...initialParams,
      // Keep original tag parameter (slugs) - useRecipeList will handle conversion
    }),
    [initialParams]
  );

  const { state, actions } = useRecipeList({
    initialParams: modifiedInitialParams,
    userId,
    tagIdToSlugMap: tagIdToSlug,
  });

  const sentryRef = useInfiniteScroll({
    loadMore: actions.loadMore,
    hasMore: state.hasNextPage,
    isLoading: state.isLoadingMore,
  });

  // Enhanced error state z animations
  if (state.error) {
    return (
      <div className="text-center py-12 animate-page-enter">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-gentle-bounce">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Wystąpił błąd</h3>
          <p className="text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={actions.refresh} className="animate-pulse-glow">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // Empty State Component - as a separate component to not override filters
  const EmptyStateContent = () => (
    <div className="text-center py-12 animate-page-enter">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-rotate-gently">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Brak przepisów</h3>
        <p className="text-muted-foreground mb-4">
          {state.filters.selectedTagIds.length > 0
            ? "Nie znaleziono przepisów z wybranymi tagami."
            : "Nie masz jeszcze żadnych przepisów. Dodaj swój pierwszy przepis!"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="animate-gentle-bounce">
            <a href="/recipes/new">
              {state.filters.selectedTagIds.length > 0 ? "Dodaj nowy przepis" : "Dodaj pierwszy przepis"}
            </a>
          </Button>
          {state.filters.selectedTagIds.length > 0 && (
            <Button variant="outline" onClick={() => actions.changeTagFilter([])} className="animate-gentle-bounce">
              Wyczyść filtry
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Enhanced Header */}
      <div className="space-y-4 animate-slide-in-right max-w-6xl">
        {/* Title and Counter */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Moje Przepisy</h1>
          {state.pagination.total > 0 && (
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full animate-scale-in">
              {state.pagination.total}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-start">
          <div className="flex-1 min-w-0">
            <TagFilter
              availableTags={availableTags}
              selectedTagIds={state.filters.selectedTagIds}
              onSelectionChange={actions.changeTagFilter}
              isLoading={isLoadingTags}
              disabled={state.isLoading || state.isFiltering}
            />
          </div>
          <div className="flex items-center gap-3 xl:shrink-0">
            <SortSelector
              currentSort={state.filters.sort}
              onSortChange={actions.changeSort}
              disabled={state.isLoading || state.isFiltering}
            />
          </div>
        </div>
      </div>

      {tagsError && (
        <div className="text-sm text-destructive animate-scale-in">Błąd przy ładowaniu tagów: {tagsError}</div>
      )}

      {/* Enhanced Recipe Grid with Staggered Animations or Empty State */}
      {!state.isLoading && !state.isFiltering && state.recipes.length === 0 ? (
        <EmptyStateContent />
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          style={{
            minHeight: state.isLoading ? "400px" : "auto",
            contain: "layout style",
            willChange: state.isLoading || state.isLoadingMore ? "contents" : "auto",
            opacity: state.isFiltering ? 0.6 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {state.recipes.map((recipe, index) => {
            // Stagger animation based on index
            const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

            return (
              <div key={recipe.id} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
                <RecipeCard recipe={recipe} />
              </div>
            );
          })}

          {/* Optimized Loading Skeletons - only for initial loading, not filtering */}
          {state.isLoading &&
            Array.from({ length: 4 }).map((_, index) => {
              const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

              return (
                <div key={`skeleton-${index}`} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
                  <RecipeCardSkeleton />
                </div>
              );
            })}

          {/* Load More Skeletons - only for pagination */}
          {state.isLoadingMore &&
            Array.from({ length: 3 }).map((_, index) => {
              const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

              return (
                <div key={`skeleton-more-${index}`} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
                  <RecipeCardSkeleton />
                </div>
              );
            })}
        </div>
      )}

      {/* Filtering indicator */}
      {state.isFiltering && (
        <div className="fixed top-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg z-50 animate-scale-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>Filtrowanie...</span>
          </div>
        </div>
      )}

      {/* Enhanced Load More Button */}
      {state.hasNextPage && !state.isLoadingMore && (
        <div className="text-center pt-8 animate-scale-in">
          <Button
            onClick={actions.loadMore}
            variant="outline"
            size="lg"
            className="hover:animate-gentle-bounce transition-all duration-200"
          >
            Załaduj więcej przepisów
          </Button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {state.isLoadingMore && (
        <div className="text-center py-8 animate-scale-in">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Ładowanie kolejnych przepisów...</span>
          </div>
        </div>
      )}

      {/* Invisible sentry element for infinite scroll */}
      <div ref={sentryRef} className="h-1" />
    </div>
  );
};

export default RecipeListContainer;
