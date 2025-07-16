import { useState, useEffect, useCallback, useMemo } from "react";
import type { RecipeListQueryParams, RecipeListItemDTO, PaginationDTO, RecipeSortOption } from "../../types";

// Typy lokalne dla hook'a
interface RecipeListViewModel {
  recipes: RecipeListItemDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isFiltering: boolean; // New state for filtering
  error: string | null;
  pagination: PaginationDTO;
  hasNextPage: boolean;
  filters: FilterState;
}

interface FilterState {
  sort: RecipeSortOption;
  selectedTagIds: string[]; // Tag IDs (UUID)
  searchQuery?: string;
}

interface UseRecipeListParams {
  initialParams: RecipeListQueryParams;
  userId: string;
  tagIdToSlugMap?: Map<string, string>; // Mapa UUID -> slug dla konwersji
}

interface UseRecipeListReturn {
  state: RecipeListViewModel;
  actions: {
    loadMore: () => Promise<void>;
    changeSort: (sort: RecipeSortOption) => void;
    changeTagFilter: (tagIds: string[]) => void;
    refresh: () => Promise<void>;
  };
}

// Stan początkowy
const initialState: RecipeListViewModel = {
  recipes: [],
  isLoading: true,
  isLoadingMore: false,
  isFiltering: false, // Initial state for filtering
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  },
  hasNextPage: false,
  filters: {
    sort: "created_at:desc",
    selectedTagIds: [],
  },
};

export const useRecipeList = ({
  initialParams,
  userId: _userId,
  tagIdToSlugMap,
}: UseRecipeListParams): UseRecipeListReturn => {
  // Convert slugs to tagIds from URL parameters
  const convertSlugsToTagIds = useCallback(
    (slugs: string[]): string[] => {
      if (!tagIdToSlugMap || slugs.length === 0) return [];

      const tagIds: string[] = [];
      for (const [tagId, slug] of tagIdToSlugMap.entries()) {
        if (slugs.includes(slug)) {
          tagIds.push(tagId);
        }
      }
      return tagIds;
    },
    [tagIdToSlugMap]
  );

  // Inicjalizacja stanu z konwersją slug -> tagIds
  const initialSelectedTagIds = useMemo(() => {
    if (!initialParams.tag) return [];
    const slugs = initialParams.tag.split(",");
    return convertSlugsToTagIds(slugs);
  }, [initialParams.tag, convertSlugsToTagIds]);

  const [state, setState] = useState<RecipeListViewModel>({
    ...initialState,
    filters: {
      sort: initialParams.sort || "created_at:desc",
      selectedTagIds: initialSelectedTagIds,
    },
  });

  // Convert tagIds to slugs for API
  const convertTagIdsToSlugs = useCallback(
    (tagIds: string[]): string[] => {
      if (!tagIdToSlugMap || tagIds.length === 0) return [];

      const slugs: string[] = [];
      for (const tagId of tagIds) {
        const slug = tagIdToSlugMap.get(tagId);
        if (slug) {
          slugs.push(slug);
        }
      }
      return slugs;
    },
    [tagIdToSlugMap]
  );

  // Aktualizacja URL
  const updateURL = useCallback((params: RecipeListQueryParams) => {
    const url = new URL(window.location.href);

    // Oczyszczenie parametrów
    url.searchParams.delete("page");
    url.searchParams.delete("limit");
    url.searchParams.delete("sort");
    url.searchParams.delete("tags");

    // Dodanie nowych parametrów
    if (params.page && params.page > 1) {
      url.searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 20) {
      url.searchParams.set("limit", params.limit.toString());
    }
    if (params.sort && params.sort !== "created_at:desc") {
      url.searchParams.set("sort", params.sort);
    }
    if (params.tag) {
      url.searchParams.set("tags", params.tag);
    }

    // Aktualizacja URL bez przeładowania strony
    window.history.pushState({}, "", url.toString());
  }, []);

  // Funkcja ładowania przepisów
  const loadRecipes = useCallback(
    async (params: RecipeListQueryParams, append = false, isFilteringAction = false) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: !append && !isFilteringAction,
          isLoadingMore: append,
          isFiltering: isFilteringAction && !append,
          error: null,
        }));

        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set("page", params.page.toString());
        if (params.limit) searchParams.set("limit", params.limit.toString());
        if (params.sort) searchParams.set("sort", params.sort);
        if (params.tag) searchParams.set("tags", params.tag);

        const response = await fetch(`/api/recipes?${searchParams}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sesja wygasła. Zaloguj się ponownie.");
          }
          if (response.status === 403) {
            throw new Error("Brak uprawnień do przeglądania przepisów.");
          }
          if (response.status >= 500) {
            throw new Error("Błąd serwera. Spróbuj ponownie później.");
          }
          throw new Error("Nie udało się pobrać przepisów");
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          recipes: append ? [...prev.recipes, ...data.recipes] : data.recipes,
          pagination: data.pagination,
          hasNextPage: data.pagination.page < data.pagination.total_pages,
          isLoading: false,
          isLoadingMore: false,
          isFiltering: false,
        }));

        // Aktualizacja URL dla SEO i nawigacji
        if (!append) {
          updateURL(params);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Wystąpił błąd",
          isLoading: false,
          isLoadingMore: false,
          isFiltering: false,
        }));
      }
    },
    [updateURL]
  );

  // Ładowanie kolejnej strony (infinite scroll)
  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasNextPage || state.isLoading) {
      return;
    }

    // Convert tagIds to slugs for API
    const tagSlugs = convertTagIdsToSlugs(state.filters.selectedTagIds);

    const nextPageParams: RecipeListQueryParams = {
      ...initialParams,
      page: state.pagination.page + 1,
      sort: state.filters.sort,
      tag: tagSlugs.length > 0 ? tagSlugs.join(",") : undefined,
    };

    await loadRecipes(nextPageParams, true);
  }, [
    state.isLoadingMore,
    state.hasNextPage,
    state.isLoading,
    state.pagination.page,
    state.filters,
    initialParams,
    loadRecipes,
    convertTagIdsToSlugs,
  ]);

  // Zmiana sortowania
  const changeSort = useCallback(
    (sort: RecipeSortOption) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, sort },
      }));

      // Konwersja tagIds na slugs dla API
      const tagSlugs = convertTagIdsToSlugs(state.filters.selectedTagIds);

      const newParams: RecipeListQueryParams = {
        ...initialParams,
        sort,
        page: 1,
        tag: tagSlugs.length > 0 ? tagSlugs.join(",") : undefined,
      };
      loadRecipes(newParams);
    },
    [initialParams, state.filters.selectedTagIds, loadRecipes, convertTagIdsToSlugs]
  );

  // Change tag filters
  const changeTagFilter = useCallback(
    (tagIds: string[]) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, selectedTagIds: tagIds },
      }));

      // Convert tagIds to slugs for API
      const tagSlugs = convertTagIdsToSlugs(tagIds);

      const newParams: RecipeListQueryParams = {
        ...initialParams,
        tag: tagSlugs.length > 0 ? tagSlugs.join(",") : undefined,
        page: 1,
        sort: state.filters.sort,
      };
      loadRecipes(newParams, false, true); // Pass true for isFilteringAction
    },
    [initialParams, state.filters.sort, loadRecipes, convertTagIdsToSlugs]
  );

  // Refresh list
  const refresh = useCallback(async () => {
    // Convert tagIds to slugs for API
    const tagSlugs = convertTagIdsToSlugs(state.filters.selectedTagIds);

    const currentParams: RecipeListQueryParams = {
      ...initialParams,
      page: 1,
      sort: state.filters.sort,
      tag: tagSlugs.length > 0 ? tagSlugs.join(",") : undefined,
    };
    await loadRecipes(currentParams, false, true); // Pass true for isFilteringAction
  }, [initialParams, state.filters, loadRecipes, convertTagIdsToSlugs]);

  // Ładowanie początkowe
  useEffect(() => {
    loadRecipes(initialParams);
  }, [loadRecipes, initialParams]);

  return {
    state,
    actions: {
      loadMore,
      changeSort,
      changeTagFilter,
      refresh,
    },
  };
};
