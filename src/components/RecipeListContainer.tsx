import React, { useMemo } from "react";
import type { RecipeListQueryParams } from "../types";
import RecipeCard from "./RecipeCard";
import RecipeCardSkeleton from "./RecipeCardSkeleton";
import RecipeListItem from "./RecipeListItem";
import RecipeListItemSkeleton from "./RecipeListItemSkeleton";
import SortSelector from "./SortSelector";
import TagFilter from "./TagFilter";
import { useRecipeList } from "./hooks/useRecipeList";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { useTags } from "./hooks/useTags";
import { useMobileDetection } from "./hooks/useMobileDetection";
import { useRecipeViewType } from "../lib/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RecipeListContainerProps {
  initialParams: RecipeListQueryParams;
  userId: string;
}

const RecipeListContainer: React.FC<RecipeListContainerProps> = ({ initialParams, userId }) => {
  const [viewType, setViewType] = useRecipeViewType();

  const { tags: availableTags, isLoading: isLoadingTags, error: tagsError } = useTags();
  const isMobile = useMobileDetection();

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
          {/* Counter with fixed space to prevent layout shift */}
          <div className="min-w-[2rem]">
            {state.pagination.total > 0 && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full animate-scale-in">
                {state.pagination.total}
              </span>
            )}
          </div>
        </div>

        {/* Controls - Different layout for mobile vs desktop */}
        {isMobile ? (
          // Mobile: Compact icon-only controls to save space
          <div className="flex items-center gap-2">
            {/* Przełącznik widoku - mobilny */}
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
              <Button
                variant={viewType === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("grid")}
                disabled={state.isLoading || state.isFiltering}
                className="h-8 w-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </Button>
              <Button
                variant={viewType === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("list")}
                disabled={state.isLoading || state.isFiltering}
                className="h-8 w-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>

            <SortSelector
              currentSort={state.filters.sort}
              onSortChange={actions.changeSort}
              disabled={state.isLoading || state.isFiltering}
              hideLabel={true}
            />

            {isLoadingTags ? (
              // Simple placeholder icon during loading
              <div className="h-9 w-9 bg-muted rounded-md animate-pulse flex items-center justify-center">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            ) : (
              <TagFilter
                availableTags={availableTags}
                selectedTagIds={state.filters.selectedTagIds}
                onSelectionChange={actions.changeTagFilter}
                isLoading={false}
                disabled={state.isLoading || state.isFiltering}
                hideLabel={true}
              />
            )}
          </div>
        ) : (
          // Desktop: Original layout with labels
          <div className="flex flex-col xl:flex-row gap-4 xl:items-start">
            <div className="flex-1 min-w-0">
              <TagFilter
                availableTags={availableTags}
                selectedTagIds={state.filters.selectedTagIds}
                onSelectionChange={actions.changeTagFilter}
                isLoading={isLoadingTags}
                disabled={state.isLoading || state.isFiltering}
                hideLabel={false}
              />
            </div>
            <div className="flex items-center gap-3 xl:shrink-0">
              {/* Przełącznik widoku */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Button
                  variant={viewType === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("grid")}
                  disabled={state.isLoading || state.isFiltering}
                  className="h-8 px-3"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Kafelki
                </Button>
                <Button
                  variant={viewType === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("list")}
                  disabled={state.isLoading || state.isFiltering}
                  className="h-8 px-3"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Lista
                </Button>
              </div>

              <SortSelector
                currentSort={state.filters.sort}
                onSortChange={actions.changeSort}
                disabled={state.isLoading || state.isFiltering}
                hideLabel={false}
              />
            </div>
          </div>
        )}
      </div>

      {tagsError && (
        <div className="text-sm text-destructive animate-scale-in">Błąd przy ładowaniu tagów: {tagsError}</div>
      )}

      {/* Enhanced Recipe Display with Grid/List Views */}
      {!state.isLoading && !state.isFiltering && state.recipes.length === 0 ? (
        <EmptyStateContent />
      ) : state.isLoading && isMobile ? (
        // Mobile: simple loading state to prevent layout jumps
        <LoadingSpinner text="Ładowanie przepisów..." className="py-16" />
      ) : (
        <div
          className={
            viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"
          }
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
                {viewType === "grid" ? <RecipeCard recipe={recipe} /> : <RecipeListItem recipe={recipe} />}
              </div>
            );
          })}

          {/* Optimized Loading Skeletons - only for initial loading on desktop, not filtering */}
          {state.isLoading &&
            !isMobile &&
            Array.from({ length: 4 }).map((_, index) => {
              const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

              return (
                <div key={`skeleton-${index}`} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
                  {viewType === "grid" ? <RecipeCardSkeleton /> : <RecipeListItemSkeleton />}
                </div>
              );
            })}

          {/* Load More Skeletons - only for pagination and only on desktop */}
          {state.isLoadingMore &&
            !isMobile &&
            Array.from({ length: 3 }).map((_, index) => {
              const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

              return (
                <div key={`skeleton-more-${index}`} className={`opacity-0 animate-fade-in-up ${staggerClass}`}>
                  {viewType === "grid" ? <RecipeCardSkeleton /> : <RecipeListItemSkeleton />}
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

      {/* Loading indicator for infinite scroll - also simplified for mobile */}
      {state.isLoadingMore && (
        <div className="text-center py-8 animate-scale-in">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">
              {isMobile ? "Ładowanie..." : "Ładowanie kolejnych przepisów..."}
            </span>
          </div>
        </div>
      )}

      {/* Invisible sentry element for infinite scroll */}
      <div ref={sentryRef} className="h-1" />
    </div>
  );
};

export default RecipeListContainer;
