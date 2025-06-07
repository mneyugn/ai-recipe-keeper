# API Endpoint Implementation Plan: GET /api/tags

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania listy wszystkich aktywnych tagów dostępnych w systemie. Jest to publiczny endpoint, który nie wymaga autoryzacji i może być używany do wyświetlania dostępnych tagów w interfejsie użytkownika, na przykład w filtrach lub przy tworzeniu/edycji przepisów.

**Charakterystyka:**

- Metoda: GET
- Publiczny dostęp (bez autoryzacji)
- Tylko do odczytu
- Zwraca wyłącznie aktywne tagi (`is_active = TRUE`)

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/tags`
- **Parametry:**
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body:** Nie dotyczy (GET request)
- **Headers:** Brak wymaganych headerów autoryzacji

## 3. Wykorzystywane typy

**Wymagane aktualizacje typów:**

```typescript
// Aktualizacja TagDTO w src/types.ts - dodanie color_hex
export interface TagDTO extends Pick<Tables<"tags">, "id" | "name" | "slug"> {
  color_hex?: string; // Opcjonalne, jeśli nie będzie w bazie danych
}

// Istniejący TagListResponseDTO pozostaje bez zmian
export interface TagListResponseDTO {
  tags: TagDTO[];
}
```

## 4. Szczegóły odpowiedzi

**Struktura odpowiedzi (200 OK):**

```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "Śniadanie",
      "slug": "sniadanie",
      "color_hex": "#FFD700"
    },
    {
      "id": "uuid",
      "name": "Obiad",
      "slug": "obiad",
      "color_hex": "#FF8C00"
    }
  ]
}
```

**Kody statusu:**

- **200 OK:** Pomyślne pobranie listy tagów (nawet jeśli lista jest pusta)
- **500 Internal Server Error:** Błąd po stronie serwera (problemy z bazą danych)

## 5. Przepływ danych

1. **Żądanie HTTP:** Klient wysyła GET /api/tags
2. **Routing Astro:** Żądanie trafia do `src/pages/api/tags.ts`
3. **Service Layer:** Wywołanie TagService.getActiveTags()
4. **Zapytanie SQL:** `SELECT id, name, slug FROM tags WHERE is_active = TRUE ORDER BY name ASC`
5. **Transformacja:** Mapowanie wyników na TagDTO[]
6. **Odpowiedź:** Zwrócenie TagListResponseDTO

**Baza danych:**

- Tabela: `tags`
- Filtr: `is_active = TRUE`
- Sortowanie: `ORDER BY name ASC` (alfabetycznie)
- Indeks: wykorzystanie `idx_tags_is_active`

## 6. Względy bezpieczeństwa

**Autoryzacja:**

- Endpoint publiczny - brak wymaganej autoryzacji
- Dane nie są wrażliwe (nazwy tagów są publiczne)

**Row Level Security (RLS):**

- Można rozważyć zastosowanie RLS na poziomie Supabase dla dodatkowej warstwy bezpieczeństwa
- Policy dla `tags` table: `SELECT` dla wszystkich użytkowników gdzie `is_active = TRUE`

**Ochrona przed atakami:**

- Brak parametrów wejściowych = brak ryzyka SQL injection
- Rate limiting na poziomie middleware (opcjonalnie)

## 7. Obsługa błędów

**Potencjalne błędy:**

1. **Database Connection Error (500)**

   - Przyczyna: Błąd połączenia z Supabase
   - Obsługa: Logowanie błędu, zwrócenie ogólnego komunikatu

2. **Database Query Error (500)**
   - Przyczyna: Błąd w zapytaniu SQL
   - Obsługa: Logowanie szczegółów, zwrócenie standardowego błędu

**Format odpowiedzi błędu:**

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Nie udało się pobrać tagów. Spróbuj ponownie później."
  }
}
```

## 8. Rozważania dotyczące wydajności

**Optymalizacje:**

- **Caching:** Implementacja cache'u na poziomie aplikacji (tagi rzadko się zmieniają)
- **Indeksowanie:** Wykorzystanie indeksu `idx_tags_is_active`
- **Kompresja:** Gzip dla odpowiedzi JSON

**Monitoring:**

- Logowanie czasu wykonania zapytania
- Śledzenie częstotliwości wywołań endpointu

**Potencjalne wąskie gardła:**

- Minimalne - endpoint tylko do odczytu z małą ilością danych
- Brak paginacji (akceptowalne dla tagów - mała liczba rekordów)

## 9. Etapy wdrożenia

### Krok 1: Aktualizacja typów

- [ ] Zmodyfikować `TagDTO` w `src/types.ts` (dodać `color_hex?`)
- [ ] Sprawdzić czy `TagListResponseDTO` jest poprawny

### Krok 2: Utworzenie TagService

- [ ] Utworzyć `src/lib/services/TagService.ts`
- [ ] Implementować metodę `getActiveTags()`
- [ ] Dodać obsługę błędów i logowanie

### Krok 3: Implementacja API endpoint

- [ ] Utworzyć `src/pages/api/tags.ts`
- [ ] Implementować handler GET
- [ ] Dodać `export const prerender = false`
- [ ] Zintegrować z TagService

### Krok 4: Obsługa błędów

- [ ] Implementować try-catch dla błędów bazy danych
- [ ] Dodać logowanie błędów
- [ ] Zdefiniować standardowe komunikaty błędów

### Krok 5: Testowanie

- [ ] Test podstawowej funkcjonalności
- [ ] Test z pustej bazy danych
- [ ] Test błędów połączenia z bazą
- [ ] Weryfikacja formatów odpowiedzi

### Krok 6: Dokumentacja i finalizacja

- [ ] Aktualizować dokumentację API
- [ ] Sprawdzić zgodność z TypeScript
- [ ] Code review i testy integracyjne

### Krok 7: Deploy i monitoring

- [ ] Deploy na środowisko testowe
- [ ] Monitoring wydajności
- [ ] Deploy na produkcję
