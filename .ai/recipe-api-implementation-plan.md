# Plan Wdrożenia API dla Przepisów

## 1. Przegląd endpointów

Implementacja kompletu endpointów REST API do zarządzania przepisami kulinarnymi. System umożliwia użytkownikom tworzenie, przeglądanie, aktualizowanie i usuwanie swoich przepisów z pełną obsługą tagów, paginacji i filtrowania.

**Endpointy do implementacji:**

- `GET /api/recipes` - Lista przepisów użytkownika z opcjami filtrowania i paginacji
- `GET /api/recipes/{id}` - Szczegóły konkretnego przepisu
- `POST /api/recipes` - Tworzenie nowego przepisu
- `PUT /api/recipes/{id}` - Aktualizacja istniejącego przepisu
- `DELETE /api/recipes/{id}` - Usuwanie przepisu

## 2. Szczegóły żądań

### GET /api/recipes

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/recipes`
- **Parametry:**
  - Opcjonalne query params:
    - `page` (integer, default: 1, min: 1)
    - `limit` (integer, default: 20, min: 1, max: 100)
    - `sort` (string, default: "created_at:desc", opcje: "created_at:asc", "created_at:desc", "name:asc", "name:desc")
    - `tags` (string, opcjonalne) - slug tagów oddzielone przecinkami
- **Request Body:** Brak
- **Headers:** Authorization: Bearer {token}

### GET /api/recipes/{id}

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/recipes/[id]`
- **Parametry:**
  - Wymagane path params: `id` (UUID przepisu)
- **Request Body:** Brak
- **Headers:** Authorization: Bearer {token}

### POST /api/recipes

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/recipes`
- **Parametry:** Brak
- **Request Body:** JSON zgodny z CreateRecipeCommand
- **Headers:** Authorization: Bearer {token}, Content-Type: application/json

### PUT /api/recipes/{id}

- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/recipes/[id]`
- **Parametry:**
  - Wymagane path params: `id` (UUID przepisu)
- **Request Body:** JSON zgodny z UpdateRecipeCommand
- **Headers:** Authorization: Bearer {token}, Content-Type: application/json

### DELETE /api/recipes/{id}

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/recipes/[id]`
- **Parametry:**
  - Wymagane path params: `id` (UUID przepisu)
- **Request Body:** Brak
- **Headers:** Authorization: Bearer {token}

## 3. Wykorzystywane typy

### DTOs (src/types.ts):

- `RecipeListResponseDTO` - odpowiedź dla listy przepisów
- `RecipeDetailDTO` - szczegóły pojedynczego przepisu
- `RecipeListItemDTO` - element listy przepisów
- `PaginationDTO` - informacje o paginacji
- `TagDTO` - reprezentacja tagu
- `ErrorResponseDTO` - format błędów API

### Command Modele:

- `CreateRecipeCommand` - dane do tworzenia przepisu
- `UpdateRecipeCommand` - dane do aktualizacji przepisu
- `RecipeListQueryParams` - parametry zapytania dla listy

### Dodatkowe typy do implementacji:

```typescript
// W src/lib/validations/recipe.ts
export interface ValidatedRecipeListParams {
  page: number;
  limit: number;
  sort: string;
  tags?: string[];
}

export interface RecipeOwnershipCheck {
  recipeId: string;
  userId: string;
  exists: boolean;
  isOwner: boolean;
}
```

## 4. Szczegóły odpowiedzi

### Kody statusu:

- **200 OK** - Pomyślne odczytanie danych (GET)
- **201 Created** - Pomyślne utworzenie przepisu (POST)
- **204 No Content** - Pomyślne usunięcie przepisu (DELETE)
- **400 Bad Request** - Nieprawidłowe dane wejściowe, błędy walidacji
- **401 Unauthorized** - Brak autoryzacji lub nieprawidłowy token
- **404 Not Found** - Przepis nie istnieje lub brak dostępu
- **500 Internal Server Error** - Błędy serwera/bazy danych

### Struktury odpowiedzi:

- **GET /api/recipes**: RecipeListResponseDTO z paginacją
- **GET /api/recipes/{id}**: RecipeDetailDTO
- **POST /api/recipes**: RecipeDetailDTO (201)
- **PUT /api/recipes/{id}**: RecipeDetailDTO (200)
- **DELETE /api/recipes/{id}**: Pusta odpowiedź (204)
- **Błędy**: ErrorResponseDTO z odpowiednim kodem

## 5. Przepływ danych

### Architektura:

```
Client → Astro Middleware (auth) → API Route → RecipeService → Supabase → Response
```

### GET /api/recipes - przepływ:

1. Middleware sprawdza uwierzytelnienie
2. Walidacja query parameters (Zod)
3. RecipeService.getRecipeList()
4. Query do recipes z JOINem recipe_tags/tags
5. Implementacja paginacji i sortowania
6. Filtrowanie po tagach (jeśli podane)
7. Mapowanie na RecipeListResponseDTO
8. Zwrócenie odpowiedzi

### GET /api/recipes/{id} - przepływ:

1. Middleware sprawdza uwierzytelnienie
2. Walidacja ID przepisu (UUID)
3. RecipeService.checkOwnership()
4. RecipeService.getRecipeDetails()
5. Query z JOINem dla tagów
6. Mapowanie na RecipeDetailDTO
7. Zwrócenie odpowiedzi

### POST /api/recipes - przepływ:

1. Middleware sprawdza uwierzytelnienie
2. Walidacja request body (Zod)
3. Walidacja tag_ids (sprawdzenie istnienia)
4. RecipeService.createRecipe()
5. Transakcja: INSERT do recipes + recipe_tags
6. Pobieranie utworzonego przepisu z tagami
7. Mapowanie na RecipeDetailDTO
8. Zwrócenie odpowiedzi (201)

### PUT /api/recipes/{id} - przepływ:

1. Middleware sprawdza uwierzytelnienie
2. Walidacja ID i request body
3. RecipeService.checkOwnership()
4. Walidacja tag_ids
5. RecipeService.updateRecipe()
6. Transakcja: UPDATE recipes + DELETE/INSERT recipe_tags
7. Pobieranie zaktualizowanego przepisu
8. Mapowanie na RecipeDetailDTO
9. Zwrócenie odpowiedzi (200)

### DELETE /api/recipes/{id} - przepływ:

1. Middleware sprawdza uwierzytelnienie
2. Walidacja ID przepisu
3. RecipeService.checkOwnership()
4. RecipeService.deleteRecipe()
5. DELETE z recipes (kaskada usuwa recipe_tags)
6. Zwrócenie pustej odpowiedzi (204)

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:

- Bearer token w header Authorization
- Middleware Astro sprawdza ważność tokenu
- Ekstraktowanie user_id z tokenu

### Autoryzacja:

- Sprawdzanie własności przepisu przed operacjami CUD
- User może operować tylko na swoich przepisach
- Admin może mieć rozszerzone uprawnienia (future)

### Walidacja danych:

- Zod schema dla wszystkich input
- Walidacja UUID dla ID przepisów
- Sanityzacja danych wejściowych
- Sprawdzanie limitów długości pól zgodnie z DB constraints

### Ochrona przed atakami:

- SQL Injection - używanie Supabase prepared statements
- XSS - sanityzacja przed zapisem
- Rate limiting dla operacji tworzenia
- Walidacja MIME types dla image_url

### Bezpieczeństwo bazy danych:

- Row Level Security (RLS) w Supabase
- Encrypted connections
- Proper indexing na user_id

## 7. Obsługa błędów

### Typy błędów i obsługa:

#### 401 Unauthorized:

- **Przyczyny:** Brak tokenu, nieprawidłowy token, wygasły token
- **Obsługa:** Middleware zwraca błąd przed dotarciem do endpointu
- **Response:** `{error: {code: "unauthorized", message: "Authentication required"}}`

#### 400 Bad Request:

- **Przyczyny:**
  - Nieprawidłowy format UUID
  - Błędy walidacji Zod (brakujące pola, nieprawidłowe typy)
  - Nieprawidłowe query parameters
  - Nieistniejące tag_ids
- **Obsługa:** Walidacja na początku każdego endpointu
- **Response:** `{error: {code: "validation_error", message: "Invalid input", details: {...}}}`

#### 404 Not Found:

- **Przyczyny:**
  - Przepis nie istnieje
  - Użytkownik nie jest właścicielem przepisu
- **Obsługa:** Sprawdzenie istnienia i własności
- **Response:** `{error: {code: "not_found", message: "Recipe not found"}}`

#### 500 Internal Server Error:

- **Przyczyny:**
  - Błędy bazy danych
  - Błędy sieci
  - Nieoczekiwane wyjątki
- **Obsługa:** Try-catch z logowaniem błędów
- **Response:** `{error: {code: "internal_error", message: "Internal server error"}}`

### Strategia logowania:

- Logi błędów w konsoli serwera
- Nie logowanie danych wrażliwych
- Structured logging z kontekstem (user_id, recipe_id)

## 8. Rozważania dotyczące wydajności

### Optimalizacje bazy danych:

- Indeksy na user_id w tabeli recipes
- Indeks kompozytowy na (user_id, created_at) dla sortowania
- Indeks na slug w tabeli tags
- Proper LIMIT/OFFSET dla paginacji

### Caching:

- Brak cachingu na początku (dane często się zmieniają)
- Future: Edge caching dla public recipes

### N+1 Problem:

- Single query z JOINami dla recipes + tags
- Bulk loading tagów dla listy przepisów
- Minimalizowanie round-tripów do DB

### Memory optimization:

- Stream processing dla dużych list
- Lazy loading dla images
- Proper garbage collection

## 9. Etapy wdrożenia

### 1. Przygotowanie infrastruktury

- [ ] Utworzenie `src/lib/validations/recipe.ts` z schematami Zod
- [ ] Utworzenie `src/lib/services/recipe.service.ts` z logiką biznesową
- [ ] Sprawdzenie middleware uwierzytelniania w `src/middleware/index.ts`

### 2. Implementacja serwisu RecipeService

- [ ] Metoda `getRecipeList()` z paginacją i filtrowaniem
- [ ] Metoda `getRecipeDetails()` z pełnymi informacjami
- [ ] Metoda `createRecipe()` z obsługą tagów
- [ ] Metoda `updateRecipe()` z transakcją
- [ ] Metoda `deleteRecipe()` z sprawdzaniem własności
- [ ] Metoda `checkOwnership()` dla autoryzacji

### 3. Implementacja walidacji

- [ ] Schema dla query parameters listy przepisów
- [ ] Schema dla CreateRecipeCommand
- [ ] Schema dla UpdateRecipeCommand
- [ ] Schema dla UUID validation
- [ ] Utility functions dla walidacji

### 4. Implementacja endpointów

- [ ] `src/pages/api/recipes/index.ts` - GET i POST
- [ ] `src/pages/api/recipes/[id].ts` - GET, PUT, DELETE
- [ ] Proper error handling w każdym endpoincie
- [ ] Request/response mapping

### 5. Testing i optimalizacja

- [ ] Testy jednostkowe dla RecipeService
- [ ] Testy integracyjne dla endpointów
- [ ] Performance testing z większą ilością danych
- [ ] Security testing (autoryzacja, walidacja)

### 6. Dokumentacja i monitoring

- [ ] API documentation updates
- [ ] Error monitoring setup
- [ ] Performance monitoring
- [ ] Usage analytics

### 7. Deployment

- [ ] Database migrations (jeśli potrzebne)
- [ ] Environment configuration
- [ ] Production deployment
- [ ] Smoke tests na production

## 10. Uwagi implementacyjne

### Konwencje nazewnictwa:

- Pliki: kebab-case (`recipe.service.ts`)
- Functions: camelCase (`getRecipeList`)
- Stałe: UPPER_SNAKE_CASE (`MAX_RECIPES_PER_PAGE`)

### Error handling pattern:

```typescript
try {
  // business logic
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Recipe API error:", error);
  return new Response(
    JSON.stringify({
      error: {
        code: "internal_error",
        message: "Internal server error",
      },
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Database query patterns:

- Używanie Supabase client z context.locals
- Prepared statements dla bezpieczeństwa
- Single query z JOINami zamiast multiple queries
- Proper error handling dla DB operations

## 11. Przyszłe rozszerzenia

### Phase 2 features:

- Full-text search w przepisach
- Recipe recommendations
- Public recipes sharing
- Recipe collections API
- Advanced filtering (by ingredients, prep time ranges)

### Performance improvements:

- Database query optimization
- Caching layer implementation
- CDN dla images
- API rate limiting
- Request batching

### Security enhancements:

- API versioning
- Enhanced authentication (OAuth)
- Audit logging
- Data encryption at rest
