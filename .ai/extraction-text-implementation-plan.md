# Plan Implementacji API Endpoint: POST /api/recipe/extract-from-text

## 1. Przegląd endpointu

Endpoint `POST /api/recipe/extract-from-text` służy do ekstraktowania przepisów kulinarnych z tekstu przy użyciu sztucznej inteligencji. System przyjmuje dowolny tekst zawierający przepis i zwraca ustrukturyzowane dane ze składnikami, krokami przygotowania, czasem przygotowania oraz sugerowanymi tagami.

**Kluczowe funkcjonalności:**

- Ekstrakcja tekstu przepisu przez AI (OpenRouter.ai)
- Walidacja dziennych limitów ekstrakcji (100/dzień per użytkownik)
- Logowanie wszystkich operacji ekstrakcji
- Zwracanie strukturalnych danych gotowych do utworzenia przepisu

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/recipe/extract-from-text`
- **Headers:**
  - `Authorization: Bearer {token}` (wymagany)
  - `Content-Type: application/json` (wymagany)
- **Parametry:**
  - **Wymagane:** `text` (string) - tekst przepisu do ekstraktowania
  - **Opcjonalne:** brak
- **Request Body:**

```json
{
  "text": "Recipe text content here..."
}
```

**Ograniczenia:**

- Maksymalna długość tekstu: 10,000 znaków
- Dzienny limit ekstrakcji: 100 requestów na użytkownika

## 3. Wykorzystywane typy

**Command Models:**

- `ExtractFromTextCommand` - model wejściowy

**Response DTOs:**

- `ExtractFromTextResponseDTO` - główna odpowiedź
- `ExtractedRecipeDataDTO` - zagnieżdżone dane wyekstraktowanego przepisu

**Database Models:**

- `Tables<"extraction_logs">` - logowanie operacji
- `Tables<"daily_extraction_limits">` - śledzenie limitów

## 4. Szczegóły odpowiedzi

**Success Response (200 OK):**

```json
{
  "extraction_log_id": "uuid",
  "extracted_data": {
    "name": "Detected Recipe Name",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "steps": ["step 1", "step 2"],
    "preparation_time": "30 minutes",
    "suggested_tags": ["obiad", "makaron"]
  },
  "original_text": "Recipe text content here..."
}
```

**Error Response Format:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 5. Przepływ danych

1. **Walidacja wejścia:**

   - Sprawdzenie autoryzacji (Supabase Auth)
   - Walidacja formatu JSON i obecności pola `text`
   - Sprawdzenie długości tekstu (≤ 10,000 znaków)

2. **Sprawdzenie limitów:**

   - Wywołanie funkcji `check_extraction_limit(user_id)`
   - Jeśli limit przekroczony → zwróć 429

3. **Ekstrakcja AI:**

   - Wysłanie requesta do OpenRouter.ai
   - Przetworzenie odpowiedzi AI na strukturę `ExtractedRecipeDataDTO`
   - Obsługa błędów ekstrakcji

4. **Logowanie:**

   - Zapis do tabeli `extraction_logs`
   - Inkrementacja licznika w `daily_extraction_limits`

5. **Odpowiedź:**
   - Zwrócenie `ExtractFromTextResponseDTO` z danymi

## 6. Względy bezpieczeństwa

**Autoryzacja:**

- Wymagany Bearer token z Supabase Auth
- Automatyczna walidacja przez `auth.uid()`
- RLS policies na poziomie bazy danych

**Rate Limiting:**

- Dzienny limit 100 requestów per użytkownik
- Implementacja na poziomie bazy danych z funkcjami PostgreSQL
- Automatyczne resetowanie na następny dzień

**Input Sanitization:**

- Walidacja długości tekstu wejściowego
- Sprawdzenie typów danych JSON
- Sanityzacja przed wysłaniem do AI

**Data Privacy:**

- Logi ekstrakcji dostępne tylko dla administratorów
- RLS policies ograniczają dostęp do własnych danych użytkownika

## 7. Obsługa błędów

| Kod | Scenario                       | Response                                                                                                         |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 400 | Tekst przekracza 10,000 znaków | `{"error": {"code": "TEXT_TOO_LONG", "message": "Tekst nie może przekraczać 10,000 znaków"}}`                    |
| 400 | Brakujące pole 'text'          | `{"error": {"code": "MISSING_TEXT", "message": "Pole 'text' jest wymagane"}}`                                    |
| 401 | Brak/nieprawidłowy token       | `{"error": {"code": "UNAUTHORIZED", "message": "Nieautoryzowany dostęp"}}`                                       |
| 429 | Przekroczony dzienny limit     | `{"error": {"code": "DAILY_LIMIT_EXCEEDED", "message": "Przekroczono dzienny limit ekstrakcji (100/dzień)"}}`    |
| 422 | Błąd ekstrakcji AI             | `{"error": {"code": "EXTRACTION_FAILED", "message": "Nie udało się wyekstraktować przepisu z podanego tekstu"}}` |
| 500 | Błąd AI service                | `{"error": {"code": "AI_SERVICE_ERROR", "message": "Tymczasowy błąd serwisu ekstrakcji"}}`                       |
| 500 | Błąd bazy danych               | `{"error": {"code": "DATABASE_ERROR", "message": "Błąd wewnętrzny serwera"}}`                                    |

## 8. Rozważania dotyczące wydajności

**Potencjalne wąskie gardła:**

- Opóźnienia AI API (OpenRouter.ai) - typowo 2-5 sekund
- Równoległe zapytania do daily_extraction_limits

**Strategie optymalizacji:**

- Timeout dla AI requests (30 sekund)
- Connection pooling dla Supabase
- Indeksy na `daily_extraction_limits(user_id, date)`
- Async processing dla logowania

**Monitoring:**

- Logowanie czasu response AI
- Śledzenie tokens_used dla kosztów
- Metryki błędów ekstrakcji

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie infrastruktury

- Konfiguracja OpenRouter.ai API key w zmiennych środowiskowych
- Weryfikacja funkcji PostgreSQL (`check_extraction_limit`, `increment_extraction_count`)
- Sprawdzenie RLS policies dla `extraction_logs`

### Krok 2: Implementacja walidacji

- Utworzenie middleware do sprawdzania autoryzacji
- Implementacja walidacji request body (Zod schema)
- Walidacja długości tekstu i daily limits

### Krok 3: Serwis ekstrakcji AI

- Utworzenie `RecipeExtractionService` klasy
- Implementacja komunikacji z OpenRouter.ai
- Obsługa error handling i timeouts
- Mapowanie odpowiedzi AI na `ExtractedRecipeDataDTO`

### Krok 4: Endpoint handler

- Utworzenie pliku `/src/pages/api/recipe/extract-from-text.ts`
- Implementacja głównej logiki endpointu
- Integracja z RecipeExtractionService
- Obsługa wszystkich error cases

### Krok 5: Logowanie operacji

- Implementacja zapisu do `extraction_logs`
- Inkrementacja `daily_extraction_limits`
- Error handling dla operacji bazodanowych

### Krok 6: Testy jednostkowe

- Testy walidacji input
- Mock testy RecipeExtractionService
- Testy error scenarios
- Testy limitów dziennych

### Krok 7: Testy integracyjne

- End-to-end test z prawdziwym AI
- Test wszystkich error codes
- Test równoczesnych requestów
- Test rate limiting

### Krok 8: Dokumentacja i deployment

- Aktualizacja API documentation
- Code review
- Deployment na środowisko testowe
- Monitoring po deployment

## 10. Pliki do utworzenia/modyfikacji

```
src/pages/api/recipe/extract-from-text.ts          # Main endpoint handler
src/lib/services/recipe-extraction.service.ts      # AI communication service
src/lib/validations/recipe-extraction.ts           # Zod schemas
src/middleware/auth.ts                              # Auth middleware
tests/api/extraction-text.test.ts                  # Unit tests
tests/integration/extraction.test.ts               # Integration tests
```

## 11. Zmienne środowiskowe

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_API_URL=https://openrouter.ai/api/v1
EXTRACTION_TIMEOUT_MS=30000
DAILY_EXTRACTION_LIMIT=100
```

## 12. Metryki do monitorowania

- Response time AI calls
- Success/failure rates ekstrakcji
- Daily usage per user
- Token consumption
- Error rate by type
- Database query performance
