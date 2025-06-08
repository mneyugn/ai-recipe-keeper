import { useState, useEffect, useCallback } from "react";
import type { RecipeListQueryParams, RecipeListItemDTO, PaginationDTO } from "../../types";

// Typy lokalne dla hook'a
interface RecipeListViewModel {
  recipes: RecipeListItemDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: PaginationDTO;
  hasNextPage: boolean;
  filters: FilterState;
}

interface FilterState {
  sort: string;
  selectedTagIds: string[]; // Tag IDs (UUID)
  searchQuery?: string;
}

interface UseRecipeListParams {
  initialParams: RecipeListQueryParams;
  userId: string;
}

interface UseRecipeListReturn {
  state: RecipeListViewModel;
  actions: {
    loadMore: () => Promise<void>;
    changeSort: (sort: string) => void;
    changeTagFilter: (tagIds: string[]) => void;
    refresh: () => Promise<void>;
    navigateToRecipe: (id: string) => void;
  };
}

// Stan początkowy
const initialState: RecipeListViewModel = {
  recipes: [],
  isLoading: true,
  isLoadingMore: false,
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

export const useRecipeList = ({ initialParams, userId }: UseRecipeListParams): UseRecipeListReturn => {
  const [state, setState] = useState<RecipeListViewModel>({
    ...initialState,
    filters: {
      sort: initialParams.sort || "created_at:desc",
      selectedTagIds: initialParams.tag ? initialParams.tag.split(",") : [],
    },
  });

  // Funkcja ładowania przepisów
  const loadRecipes = useCallback(async (params: RecipeListQueryParams, append = false) => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: !append,
        isLoadingMore: append,
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
      }));
    }
  }, []);

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

  // Ładowanie kolejnej strony (infinite scroll)
  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasNextPage || state.isLoading) {
      return;
    }

    const nextPageParams: RecipeListQueryParams = {
      ...initialParams,
      page: state.pagination.page + 1,
      sort: state.filters.sort,
      tag: state.filters.selectedTagIds.length > 0 ? state.filters.selectedTagIds.join(",") : undefined,
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
  ]);

  // Zmiana sortowania
  const changeSort = useCallback(
    (sort: string) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, sort },
      }));

      const newParams: RecipeListQueryParams = {
        ...initialParams,
        sort,
        page: 1,
        tag: state.filters.selectedTagIds.length > 0 ? state.filters.selectedTagIds.join(",") : undefined,
      };
      loadRecipes(newParams);
    },
    [initialParams, state.filters.selectedTagIds, loadRecipes]
  );

  // Zmiana filtrów tagów
  const changeTagFilter = useCallback(
    (tagIds: string[]) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, selectedTagIds: tagIds },
      }));

      const newParams: RecipeListQueryParams = {
        ...initialParams,
        tag: tagIds.length > 0 ? tagIds.join(",") : undefined,
        page: 1,
        sort: state.filters.sort,
      };
      loadRecipes(newParams);
    },
    [initialParams, state.filters.sort, loadRecipes]
  );

  // Odświeżenie listy
  const refresh = useCallback(async () => {
    const currentParams: RecipeListQueryParams = {
      ...initialParams,
      page: 1,
      sort: state.filters.sort,
      tag: state.filters.selectedTagIds.length > 0 ? state.filters.selectedTagIds.join(",") : undefined,
    };
    await loadRecipes(currentParams);
  }, [initialParams, state.filters, loadRecipes]);

  // Nawigacja do przepisu
  const navigateToRecipe = useCallback((id: string) => {
    // Walidacja ID
    if (!id || typeof id !== "string") {
      console.error("Invalid recipe ID:", id);
      return;
    }
    window.location.href = `/recipes/${id}`;
  }, []);

  // Ładowanie początkowe
  useEffect(() => {
    loadRecipes(initialParams);
  }, []); // Zależności puste - ładujemy tylko raz na początku

  return {
    state,
    actions: {
      loadMore,
      changeSort,
      changeTagFilter,
      refresh,
      navigateToRecipe,
    },
  };
};
