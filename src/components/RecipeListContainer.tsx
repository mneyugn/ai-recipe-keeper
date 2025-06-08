import React, { useMemo } from "react";
import type { RecipeListQueryParams } from "../types";
import RecipeCard from "./RecipeCard";
import SortSelector from "./SortSelector";
import TagFilter from "./TagFilter";
import { useRecipeList } from "./hooks/useRecipeList";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { useTags } from "./hooks/useTags";

interface RecipeListContainerProps {
  initialParams: RecipeListQueryParams;
  userId: string;
}

const RecipeListContainer: React.FC<RecipeListContainerProps> = ({ initialParams, userId }) => {
  // Hook do pobierania tagów
  const { tags: availableTags, isLoading: isLoadingTags, error: tagsError } = useTags();

  // Utility funkcje do konwersji między tag slug a ID
  const tagSlugToId = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((tag) => map.set(tag.slug, tag.id));
    return map;
  }, [availableTags]);

  // const tagIdToSlug = useMemo(() => {
  //   const map = new Map<string, string>();
  //   availableTags.forEach((tag) => map.set(tag.id, tag.slug));
  //   return map;
  // }, [availableTags]);

  // Konwersja inicjalnych parametrów ze slug na ID
  const initialSelectedTagIds = useMemo(() => {
    if (!initialParams.tag) return [];
    return initialParams.tag
      .split(",")
      .map((slug) => tagSlugToId.get(slug))
      .filter(Boolean) as string[];
  }, [initialParams.tag, tagSlugToId]);

  // Użycie custom hook'a do zarządzania stanem z konwertowanymi ID
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

  // Infinite scroll hook
  const sentryRef = useInfiniteScroll({
    loadMore: actions.loadMore,
    hasMore: state.hasNextPage,
    isLoading: state.isLoadingMore,
  });

  // Renderowanie
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header sekcja */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Moje Przepisy</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {state.isLoading
                ? "Ładowanie..."
                : `${state.pagination.total} ${
                    state.pagination.total === 1 ? "przepis" : state.pagination.total <= 4 ? "przepisy" : "przepisów"
                  }`}
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/recipes/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Dodaj nowy przepis
          </button>
        </div>

        {/* Filtry */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <SortSelector currentSort={state.filters.sort} onSortChange={actions.changeSort} disabled={state.isLoading} />
          <TagFilter
            availableTags={availableTags}
            selectedTagIds={state.filters.selectedTagIds}
            onSelectionChange={actions.changeTagFilter}
            disabled={state.isLoading}
            isLoading={isLoadingTags}
          />
        </div>

        {/* Błąd pobierania tagów */}
        {tagsError && (
          <div className="text-sm text-red-600 dark:text-red-400">Błąd przy ładowaniu tagów: {tagsError}</div>
        )}
      </div>

      {/* Główna zawartość */}
      {state.error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{state.error}</div>
          <button onClick={actions.refresh} className="text-blue-600 hover:text-blue-700 font-medium">
            Spróbuj ponownie
          </button>
        </div>
      ) : state.isLoading && state.recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ładowanie przepisów...</p>
        </div>
      ) : state.recipes.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {state.filters.selectedTagIds.length > 0 ? "Brak wyników" : "Brak przepisów"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {state.filters.selectedTagIds.length > 0
              ? "Spróbuj zmienić filtry lub dodać nowy przepis."
              : "Dodaj swój pierwszy przepis, aby rozpocząć kolekcję."}
          </p>
          {state.filters.selectedTagIds.length > 0 ? (
            <div className="space-x-4">
              <button
                onClick={() => actions.changeTagFilter([])}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Wyczyść filtry
              </button>
              <button
                onClick={() => (window.location.href = "/recipes/new")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Dodaj przepis
              </button>
            </div>
          ) : (
            <button
              onClick={() => (window.location.href = "/recipes/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Dodaj pierwszy przepis
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Siatka przepisów */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={actions.navigateToRecipe} />
            ))}
          </div>

          {/* Infinite scroll sentry element */}
          {state.hasNextPage && (
            <div ref={sentryRef} className="mt-8 text-center">
              {state.isLoadingMore ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Ładowanie kolejnych przepisów...</span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Przewiń w dół, aby załadować więcej</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeListContainer;
