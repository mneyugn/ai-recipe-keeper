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

  const tagSlugToId = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((tag) => map.set(tag.slug, tag.id));
    return map;
  }, [availableTags]);

  const initialSelectedTagIds = useMemo(() => {
    if (!initialParams.tag) return [];
    return initialParams.tag
      .split(",")
      .map((slug) => tagSlugToId.get(slug))
      .filter(Boolean) as string[];
  }, [initialParams.tag, tagSlugToId]);

  const modifiedInitialParams = useMemo(
    () => ({
      ...initialParams,
      tag: initialSelectedTagIds.length > 0 ? initialSelectedTagIds.join(",") : undefined,
    }),
    [initialParams, initialSelectedTagIds]
  );

  const { state, actions } = useRecipeList({
    initialParams: modifiedInitialParams,
    userId,
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

  // Enhanced empty state z animations
  if (!state.isLoading && state.recipes.length === 0) {
    return (
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
          <Button asChild className="animate-gentle-bounce">
            <a href="/recipes/new">Dodaj pierwszy przepis</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Enhanced Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-slide-in-right">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Moje Przepisy</h1>
          {state.pagination.total > 0 && (
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full animate-scale-in">
              {state.pagination.total}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <TagFilter
            availableTags={availableTags}
            selectedTagIds={state.filters.selectedTagIds}
            onSelectionChange={actions.changeTagFilter}
            isLoading={isLoadingTags}
            disabled={state.isLoading}
          />
          <SortSelector currentSort={state.filters.sort} onSortChange={actions.changeSort} disabled={state.isLoading} />
        </div>
      </div>

      {tagsError && (
        <div className="text-sm text-destructive animate-scale-in">Błąd przy ładowaniu tagów: {tagsError}</div>
      )}

      {/* Enhanced Recipe Grid with Staggered Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {state.recipes.map((recipe, index) => {
          // Stagger animation based on index
          const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

          return (
            <div key={recipe.id} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
              <RecipeCard recipe={recipe} />
            </div>
          );
        })}

        {/* Enhanced Loading Skeletons */}
        {(state.isLoading || state.isLoadingMore) &&
          Array.from({ length: state.isLoadingMore ? 4 : 8 }).map((_, index) => {
            const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

            return (
              <div key={`skeleton-${index}`} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
                <RecipeCardSkeleton />
              </div>
            );
          })}
      </div>

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
