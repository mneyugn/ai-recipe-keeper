# Plan implementacji widoku Lista Przepisów

## 1. Przegląd

Widok "Lista Przepisów" (/recipes) stanowi główny hub aplikacji AI RecipeKeeper po zalogowaniu użytkownika. Jego celem jest wyświetlenie wszystkich przepisów użytkownika w formie siatki z opcjami sortowania i filtrowania po tagach. Widok oferuje intuicyjną nawigację do szczegółów przepisu, dodawania nowych przepisów oraz zapewnia szybki przegląd kolekcji użytkownika z licznikiem przepisów.

## 2. Routing widoku

- **Ścieżka główna:** `/recipes` (domyślny widok po zalogowaniu)
- **Obsługiwane parametry URL:**
  - `page` - numer strony (domyślnie 1)
  - `limit` - liczba przepisów na stronę (domyślnie 20, max 100)
  - `sort` - sortowanie (domyślnie "created_at:desc")
  - `tags` - filtrowanie po tagach (slugi oddzielone przecinkami)

## 3. Struktura komponentów

```
RecipesPage (Astro)
├── RecipeListContainer (React)
    ├── RecipeListHeader
    │   ├── PageTitle
    │   ├── RecipeCounter
    │   └── AddRecipeButton (Button)
    ├── RecipeFilters
    │   ├── SortSelector (DropdownMenu)
    │   └── TagFilter (Popover + Command + Checkbox)
    │       └── SelectedTagsBadges (Badge[])
    ├── RecipeGrid
    │   └── RecipeCard[]
    │       ├── RecipeImage (img z placeholder)
    │       ├── RecipeTitle
    │       └── RecipeTagBadges (Badge[])
    ├── EmptyState
    ├── LoadingSpinner
    ├── LoadMoreTrigger (dla infinite scroll)
    └── ToastProvider
```

## 4. Szczegóły komponentów

### `RecipesPage` (Strona Astro)

- **Opis komponentu:** Główna strona zawierająca layout aplikacji i kontener React dla listy przepisów. Obsługuje autoryzację użytkownika i przekierowanie na /login jeśli nie zalogowany.
- **Główne elementy:** Layout aplikacji (`MainLayout.astro`), komponent React `RecipeListContainer`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji.
- **Obsługiwana walidacja:** Sprawdzenie autoryzacji użytkownika.
- **Typy:** Brak specyficznych typów.
- **Propsy (dla `RecipeListContainer`):**
  - `initialParams: RecipeListQueryParams` (parametry z URL)
  - `userId: string`

### `RecipeListContainer` (Komponent React)

- **Opis komponentu:** Główny kontener zarządzający stanem listy przepisów, filtrowaniem, sortowaniem i paginacją. Orkiestruje wszystkie podkomponenty i komunikację z API.
- **Główne elementy:** Wszystkie podkomponenty listy przepisów w logicznej hierarchii.
- **Obsługiwane interakcje:**
  - Pobieranie listy przepisów z API
  - Zarządzanie parametrami sortowania i filtrowania
  - Obsługa infinite scroll
  - Nawigacja do szczegółów przepisu
- **Obsługiwana walidacja:**
  - Walidacja parametrów API przed wysłaniem zapytania
  - Sprawdzenie czy użytkownik ma dostęp do przepisów
- **Typy:** `RecipeListResponseDTO`, `TagDTO[]`, `RecipeListQueryParams`, `RecipeListViewModel`
- **Propsy:**
  - `initialParams: RecipeListQueryParams`
  - `userId: string`

### `RecipeListHeader` (Komponent React)

- **Opis komponentu:** Nagłówek strony zawierający tytuł, licznik przepisów i przycisk dodawania nowego przepisu.
- **Główne elementy:** Element `h1`, komponent `RecipeCounter`, `Button` z linkiem do `/recipes/new`.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Dodaj nowy przepis" → nawigacja do `/recipes/new`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `number` (liczba przepisów).
- **Propsy:**
  - `recipeCount: number`
  - `isLoading: boolean`

### `RecipeCounter` (Komponent React)

- **Opis komponentu:** Wyświetla liczbę wszystkich przepisów użytkownika z odpowiednim formatowaniem (np. "42 przepisy" vs "1 przepis").
- **Główne elementy:** Element tekstowy z odpowiednią odmianą słowa "przepis".
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `number`.
- **Propsy:**
  - `count: number`
  - `isLoading?: boolean`

### `RecipeFilters` (Komponent React)

- **Opis komponentu:** Sekcja z kontrolkami sortowania i filtrowania. Zawiera dropdown do wyboru sortowania i tag filter do wyboru tagów.
- **Główne elementy:** `SortSelector`, `TagFilter`, kontener flexbox.
- **Obsługiwane interakcje:**
  - Zmiana opcji sortowania
  - Wybór/odznaczenie tagów do filtrowania
- **Obsługiwana walidacja:**
  - Walidacja poprawności wartości sortowania
  - Sprawdzenie czy wybrane tagi istnieją w systemie
- **Typy:** `SortOption`, `TagDTO[]`, `string[]` (selected tag IDs).
- **Propsy:**
  - `currentSort: string`
  - `onSortChange: (sort: string) => void`
  - `availableTags: TagDTO[]`
  - `selectedTagIds: string[]`
  - `onTagSelectionChange: (tagIds: string[]) => void`
  - `isLoading: boolean`

### `SortSelector` (Komponent React)

- **Opis komponentu:** Dropdown menu do wyboru opcji sortowania listy przepisów.
- **Główne elementy:** `DropdownMenu` (Shadcn/ui) z predefiniowanymi opcjami sortowania.
- **Obsługiwane interakcje:** Wybór opcji sortowania z listy.
- **Obsługiwana walidacja:** Sprawdzenie czy wybrana opcja jest dostępna.
- **Typy:** `SortOption` enum.
- **Propsy:**
  - `currentSort: string`
  - `onSortChange: (sort: string) => void`
  - `disabled?: boolean`

### `TagFilter` (Komponent React)

- **Opis komponentu:** Multi-select komponent do filtrowania przepisów po tagach. Używa `Popover` + `Command` + `Checkbox` do implementacji.
- **Główne elementy:** `Popover` (trigger button + content), `Command` (wyszukiwarka), lista `Checkbox` dla każdego tagu, `Badge` dla wybranych tagów.
- **Obsługiwane interakcje:**
  - Otwieranie/zamykanie popover
  - Wyszukiwanie tagów
  - Zaznaczanie/odznaczanie tagów
  - Usuwanie wybranych tagów przez kliknięcie badge
- **Obsługiwana walidacja:** Sprawdzenie czy tagi istnieją w dostępnej liście.
- **Typy:** `TagDTO[]`, `string[]`.
- **Propsy:**
  - `availableTags: TagDTO[]`
  - `selectedTagIds: string[]`
  - `onSelectionChange: (tagIds: string[]) => void`
  - `disabled?: boolean`

### `RecipeGrid` (Komponent React)

- **Opis komponentu:** Responsywna siatka wyświetlająca przepisy użytkownika. Implementuje Masonry lub CSS Grid layout.
- **Główne elementy:** Grid container z kartami `RecipeCard`.
- **Obsługiwane interakcje:** Renderowanie kart przepisów.
- **Obsługiwana walidacja:** Sprawdzenie czy dane przepisu są kompletne.
- **Typy:** `RecipeListItemDTO[]`.
- **Propsy:**
  - `recipes: RecipeListItemDTO[]`
  - `onRecipeClick: (recipeId: string) => void`
  - `isLoading: boolean`

### `RecipeCard` (Komponent React)

- **Opis komponentu:** Karta pojedynczego przepisu na liście. Wyświetla miniaturę, nazwę i tagi.
- **Główne elementy:** `Card` (Shadcn/ui), `img` z fallback placeholder, tytuł, lista `Badge` dla tagów.
- **Obsługiwane interakcje:**
  - Kliknięcie karty → nawigacja do `/recipes/{id}`
  - Hover efekty
- **Obsługiwana walidacja:** Sprawdzenie czy ID przepisu jest prawidłowe.
- **Typy:** `RecipeListItemDTO`.
- **Propsy:**
  - `recipe: RecipeListItemDTO`
  - `onClick: (recipeId: string) => void`

### `EmptyState` (Komponent React)

- **Opis komponentu:** Komunikat wyświetlany gdy użytkownik nie ma żadnych przepisów lub po zastosowaniu filtrów nie ma wyników.
- **Główne elementy:** Ikona, tytuł, opis, opcjonalny przycisk akcji.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Dodaj pierwszy przepis" → nawigacja do `/recipes/new`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `EmptyStateType` enum ("no-recipes" | "no-results").
- **Propsy:**
  - `type: EmptyStateType`
  - `onAddRecipe?: () => void`
  - `onClearFilters?: () => void`

### `LoadingSpinner` (Komponent React)

- **Opis komponentu:** Wskaźnik ładowania wyświetlany podczas pobierania danych.
- **Główne elementy:** Spinner animacja, opcjonalny tekst.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `size?: "sm" | "md" | "lg"`
  - `text?: string`

## 5. Typy

### ViewModels i interfejsy lokalne

```typescript
// Stan głównego komponentu RecipeListContainer
interface RecipeListViewModel {
  recipes: RecipeListItemDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: PaginationDTO;
  hasNextPage: boolean;
  filters: FilterState;
}

// Stan filtrów i sortowania
interface FilterState {
  sort: string;
  selectedTagIds: string[];
  searchQuery?: string; // przyszłe rozszerzenie
}

// Opcje sortowania
type SortOption = "created_at:desc" | "created_at:asc" | "name:desc" | "name:asc";

// Typy stanów pustej listy
type EmptyStateType = "no-recipes" | "no-results";

// Parametry dla hook'a useRecipeList
interface UseRecipeListParams {
  initialParams: RecipeListQueryParams;
  userId: string;
}

// Zwracane przez hook useRecipeList
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
```

### Istniejące typy z types.ts (wykorzystywane)

- `RecipeListItemDTO` - pojedynczy przepis na liście
- `RecipeListResponseDTO` - odpowiedź API z listą przepisów
- `TagDTO` - dane pojedynczego tagu
- `PaginationDTO` - informacje o paginacji
- `RecipeListQueryParams` - parametry zapytania dla API
- `ErrorResponseDTO` - format błędów API

## 6. Zarządzanie stanem

### Custom Hook: `useRecipeList`

Główny hook zarządzający stanem listy przepisów:

```typescript
const useRecipeList = ({ initialParams, userId }: UseRecipeListParams): UseRecipeListReturn => {
  // Stan lokalny
  const [state, setState] = useState<RecipeListViewModel>(initialState);

  // Efekty
  useEffect(() => {
    // Pobieranie początkowej listy przepisów
    loadRecipes(initialParams);
  }, []);

  useEffect(() => {
    // Reagowanie na zmiany filtrów
    handleFiltersChange();
  }, [state.filters]);

  // Akcje
  const loadRecipes = async (params: RecipeListQueryParams) => {
    /* ... */
  };
  const loadMore = async () => {
    /* ... */
  };
  const changeSort = (sort: string) => {
    /* ... */
  };
  const changeTagFilter = (tagIds: string[]) => {
    /* ... */
  };
  const refresh = async () => {
    /* ... */
  };
  const navigateToRecipe = (id: string) => {
    /* ... */
  };

  return { state, actions: { loadMore, changeSort, changeTagFilter, refresh, navigateToRecipe } };
};
```

### Hook pomocniczy: `useTags`

Hook do pobierania listy dostępnych tagów:

```typescript
const useTags = () => {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Implementacja pobierania tagów z API

  return { tags, isLoading, error, refetch };
};
```

### Hook pomocniczy: `useInfiniteScroll`

Hook obsługujący nieskończone przewijanie:

```typescript
const useInfiniteScroll = (loadMore: () => void, hasMore: boolean, isLoading: boolean) => {
  const sentryRef = useRef<HTMLDivElement>(null);

  // Implementacja Intersection Observer

  return sentryRef;
};
```

## 7. Integracja API

### Endpointy wykorzystywane

**GET /api/recipes**

- **Typ żądania:** `RecipeListQueryParams`
- **Typ odpowiedzi:** `RecipeListResponseDTO`
- **Użycie:** Pobieranie listy przepisów z paginacją, sortowaniem i filtrowaniem
- **Autoryzacja:** Bearer token z Supabase Auth

**GET /api/tags**

- **Typ żądania:** Brak parametrów
- **Typ odpowiedzi:** `TagListResponseDTO`
- **Użycie:** Pobieranie listy wszystkich aktywnych tagów dla filtrowania
- **Autoryzacja:** Bearer token z Supabase Auth

### Implementacja wywołań API

```typescript
// Serwis do komunikacji z API
class RecipeListApiService {
  async getRecipes(params: RecipeListQueryParams): Promise<RecipeListResponseDTO> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.tag) searchParams.set("tags", params.tag);

    const response = await fetch(`/api/recipes?${searchParams}`);

    if (!response.ok) {
      throw new Error("Failed to fetch recipes");
    }

    return response.json();
  }

  async getTags(): Promise<TagListResponseDTO> {
    const response = await fetch("/api/tags");

    if (!response.ok) {
      throw new Error("Failed to fetch tags");
    }

    return response.json();
  }
}
```

## 8. Interakcje użytkownika

### Podstawowe interakcje

1. **Przeglądanie listy przepisów**

   - Ładowanie strony → automatyczne pobranie pierwszej strony przepisów
   - Scroll w dół → ładowanie kolejnych stron (infinite scroll)

2. **Sortowanie**

   - Kliknięcie dropdown sortowania → wyświetlenie opcji
   - Wybór opcji → przeładowanie listy z nowym sortowaniem
   - Opcje: "Najnowsze", "Najstarsze", "Nazwa A-Z", "Nazwa Z-A"

3. **Filtrowanie po tagach**

   - Kliknięcie "Filtruj po tagach" → otwarcie popover z listą tagów
   - Wyszukiwanie tagu → filtrowanie listy tagów
   - Zaznaczenie/odznaczenie tagu → aktualizacja filtrów
   - Kliknięcie X na badge → usunięcie tagu z filtrów

4. **Nawigacja do przepisu**

   - Kliknięcie karty przepisu → przekierowanie na `/recipes/{id}`

5. **Dodawanie nowego przepisu**
   - Kliknięcie "Dodaj nowy przepis" → przekierowanie na `/recipes/new`

### Oczekiwane zachowania

- **Responsywne przewijanie:** Smooth loading następnych stron bez migotania
- **Natychmiastowy feedback:** Szybka reakcja na zmiany filtrów i sortowania
- **Zachowanie stanu:** Parametry filtrów i sortowania zapisane w URL
- **Graceful degradation:** Aplikacja działa bez JavaScript (podstawowe funkcje)

## 9. Warunki i walidacja

### Warunki dostępu

1. **Autoryzacja użytkownika**

   - Komponent: `RecipesPage` (Astro)
   - Warunek: Użytkownik musi być zalogowany
   - Akcja w przypadku błędu: Przekierowanie na `/login`

2. **Poprawność parametrów URL**
   - Komponent: `RecipeListContainer`
   - Warunki:
     - `page` ≥ 1
     - `limit` między 1 a 100
     - `sort` w dozwolonych wartościach
     - `tags` to istniejące slug-i tagów
   - Akcja w przypadku błędu: Użycie wartości domyślnych i aktualizacja URL

### Walidacja danych

1. **Walidacja odpowiedzi API**

   - Komponent: `useRecipeList` hook
   - Warunki: Sprawdzenie czy odpowiedź zawiera wymagane pola
   - Akcja w przypadku błędu: Wyświetlenie komunikatu błędu

2. **Walidacja ID przepisu**
   - Komponent: `RecipeCard`
   - Warunek: ID przepisu musi być prawidłowym UUID
   - Akcja w przypadku błędu: Nie wyświetlanie karty lub wyświetlenie placeholder

### Wpływ na stan interfejsu

- **Podczas ładowania:** Wyświetlenie skeleton loader lub spinner
- **Brak autoryzacji:** Przekierowanie na stronę logowania
- **Błąd API:** Wyświetlenie komunikatu błędu z opcją ponowienia
- **Brak przepisów:** Wyświetlenie `EmptyState` z zachętą do dodania pierwszego przepisu
- **Brak wyników filtrowania:** Wyświetlenie `EmptyState` z opcją wyczyszczenia filtrów

## 10. Obsługa błędów

### Scenariusze błędów

1. **401 Unauthorized**

   - Przyczyna: Wygasła sesja użytkownika
   - Obsługa: Automatyczne przekierowanie na `/login`
   - Komponent: `useRecipeList` hook

2. **403 Forbidden**

   - Przyczyna: Użytkownik próbuje dostać się do cudzych przepisów
   - Obsługa: Wyświetlenie komunikatu błędu i przekierowanie na własne przepisy
   - Komponent: `RecipeListContainer`

3. **500 Internal Server Error**

   - Przyczyna: Błąd serwera lub bazy danych
   - Obsługa: Toast z komunikatem błędu i przycisk "Spróbuj ponownie"
   - Komponent: `useRecipeList` hook

4. **Network Error**

   - Przyczyna: Brak połączenia internetowego
   - Obsługa: Banner z informacją o problemach z połączeniem
   - Komponent: `RecipeListContainer`

5. **Błąd ładowania tagów**
   - Przyczyna: Problem z endpointem `/api/tags`
   - Obsługa: Filtrowanie tagów nie działa, wyświetlenie komunikatu
   - Komponent: `TagFilter`

### Implementacja obsługi błędów

```typescript
// Error boundary dla React komponentów
class RecipeListErrorBoundary extends React.Component {
  // Implementacja error boundary
}

// Toast notifications dla błędów
const showErrorToast = (message: string, action?: () => void) => {
  toast.error(message, {
    action: action
      ? {
          label: "Spróbuj ponownie",
          onClick: action,
        }
      : undefined,
  });
};

// Retry logic dla failed requests
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  // Implementacja retry logic
};
```

## 11. Kroki implementacji

### Faza 1: Podstawowa struktura (1-2 dni)

1. **Utworzenie strony `/recipes/index.astro`**

   - Skonfigurowanie layoutu
   - Dodanie podstawowej autoryzacji
   - Utworzenie kontenera dla React komponentu

2. **Implementacja `RecipeListContainer`**

   - Podstawowa struktura komponentu
   - Stan początkowy
   - Szkielet UI bez funkcjonalności

3. **Implementacja `RecipeCard`**
   - Podstawowy layout karty
   - Placeholder dla zdjęć
   - Wyświetlanie nazwy i tagów

### Faza 2: Integracja API (2-3 dni)

4. **Implementacja `useRecipeList` hook**

   - Pobieranie danych z API
   - Zarządzanie stanem ładowania
   - Obsługa błędów

5. **Implementacja `RecipeGrid`**

   - Responsywny layout siatki
   - Infinite scroll
   - Loading states

6. **Testowanie podstawowej funkcjonalności**
   - Weryfikacja pobierania danych
   - Sprawdzenie responsywności

### Faza 3: Filtrowanie i sortowanie (2-3 dni)

7. **Implementacja `SortSelector`**

   - Dropdown z opcjami sortowania
   - Integracja z API
   - Aktualizacja URL

8. **Implementacja `TagFilter`**

   - Multi-select komponent
   - Integracja z `/api/tags`
   - Badge wybranych tagów

9. **Hook `useTags`**
   - Pobieranie listy tagów
   - Cachowanie rezultatów

### Faza 4: UX i wykończenia (1-2 dni)

10. **Implementacja `EmptyState`**

    - Różne warianty (brak przepisów vs brak wyników)
    - Call-to-action przyciski

11. **Implementacja `RecipeListHeader`**

    - Licznik przepisów
    - Przycisk dodawania przepisu

12. **Dodanie animacji i transitions**
    - Smooth loading
    - Hover effects
    - Loading skeletons

### Faza 5: Testowanie i optymalizacja (1-2 dni)

13. **Testy jednostkowe**

    - Hook testowanie
    - Komponenty testowanie

14. **Testy E2E**

    - User journey testing
    - Performance testing

15. **Optymalizacja wydajności**
    - Lazy loading
    - Memo optimization
    - Bundle size optimization

### Faza 6: Dostępność i finalizacja (1 dzień)

16. **Implementacja accessibility**

    - ARIA labels
    - Keyboard navigation
    - Screen reader support

17. **Finalne testy i dokumentacja**
    - Code review
    - Dokumentacja komponentów
    - Deployment ready

**Całkowity czas implementacji: 7-11 dni roboczych**
