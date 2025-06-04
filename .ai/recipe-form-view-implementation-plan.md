# Plan implementacji widoku Formularz Dodawania/Edycji Przepisu

## 1. Przegląd

Widok "Formularz Dodawania/Edycji Przepisu" umożliwia użytkownikom tworzenie nowych przepisów kulinarnych oraz modyfikowanie już istniejących. Obsługuje trzy tryby wprowadzania danych: manualny, poprzez wklejenie tekstu (z analizą AI) oraz przez import z obsługiwanego adresu URL (również z analizą AI). Widok ten jest kluczowy dla podstawowej funkcjonalności aplikacji, jaką jest zarządzanie przepisami.

## 2. Routing widoku

- `/recipes/new`: Dla dodawania nowego przepisu.
- `/recipes/:id/edit`: Dla edycji istniejącego przepisu, gdzie `:id` to identyfikator przepisu.

## 3. Struktura komponentów

```
RecipeFormView (Astro Page)
└── RecipeForm (React Component)
    ├── Tabs (Shadcn/ui - opcjonalnie, do wyboru trybu: Manualny, Wklej Tekst, Import URL)
    │   ├── ManualModeTab
    │   │   ├── Input (Nazwa potrawy)
    │   │   ├── DynamicFieldList (Składniki)
    │   │   │   └── Input (Składnik)
    │   │   ├── DynamicFieldList (Kroki przygotowania)
    │   │   │   └── Textarea (Krok)
    │   │   ├── Input (Czas przygotowania)
    │   │   ├── Input (Źródło - tylko do wyświetlania, `source_type` ukryte)
    │   │   ├── img (Obrazek - tylko do wyświetlania)
    │   │   ├── Textarea (Notatki)
    │   │   └── MultiSelectTags (Tagi)
    │   ├── PasteTextModeTab
    │   │   ├── Textarea (Wklejony tekst przepisu)
    │   │   ├── Button ("Przetwórz tekst")
    │   │   ├── Button ("Pokaż/Ukryj oryginalny tekst")
    │   │   ├── Button ("Przetwórz ponownie ten tekst")
    │   │   ├── AiFeedbackButtons (Kciuk w górę/dół)
    │   │   └── (Pola formularza jak w ManualModeTab, wypełniane po przetworzeniu)
    │   └── ImportUrlModeTab
    │       ├── Input (URL przepisu)
    │       ├── Button ("Importuj z URL")
    │       ├── AiFeedbackButtons (Kciuk w górę/dół)
    │       └── (Pola formularza jak w ManualModeTab, wypełniane po przetworzeniu)
    ├── Button ("Zapisz przepis")
    ├── LoadingSpinner (Globalny wskaźnik ładowania)
    └── ToastNotifications (Powiadomienia)
```

_Alternatywnie, zamiast `Tabs`, można stworzyć trzy oddzielne komponenty React dla każdego trybu, zarządzane przez logikę routingu lub stanu w `RecipeFormView`._ Dla uproszczenia MVP, plan zakłada jeden główny komponent `RecipeForm` dynamicznie dostosowujący UI lub wykorzystujący wewnętrzne zakładki.

## 4. Szczegóły komponentów

### `RecipeFormView` (Strona Astro)

- **Opis komponentu:** Główny kontener strony dla formularza. Odpowiada za pobranie danych przepisu w trybie edycji (jeśli `:id` jest obecne w URL) i przekazanie ich do komponentu `RecipeForm`. Obsługuje również logikę nawigacji po zapisie lub anulowaniu.
- **Główne elementy:** Layout aplikacji (np. `MainLayout.astro`), komponent React `RecipeForm`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji użytkownika, deleguje do `RecipeForm`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeDetailDTO` (dla trybu edycji).
- **Propsy (dla `RecipeForm`):**
  - `recipeData?: RecipeDetailDTO` (dane przepisu do edycji)
  - `mode: 'new' | 'edit'`

### `RecipeForm` (Komponent React)

- **Opis komponentu:** Sercem widoku, ten komponent React zarządza całym stanem formularza, logiką trybów (manualny, tekst, URL), walidacją pól, interakcją z API (ekstrakcja, zapis) oraz wyświetlaniem dynamicznych list (składniki, kroki).
- **Główne elementy:**
  - Opcjonalne `Tabs` (Shadcn/ui) lub inna logika do przełączania trybów.
  - Pola formularza: `Input`, `Textarea`, `Label` (Shadcn/ui) dla nazwy, czasu przygotowania, źródła (URL), notatek.
  - `DynamicFieldList` dla składników i kroków.
  - `MultiSelectTags` dla tagów.
  - Specyficzne elementy dla trybu "Wklej tekst": `Textarea` dla surowego tekstu, przyciski "Przetwórz", "Pokaż/Ukryj oryginał", "Przetwórz ponownie".
  - Specyficzne elementy dla trybu "Import z URL": `Input` dla URL, przycisk "Importuj".
  - `AiFeedbackButtons` dla oceny ekstrakcji.
  - `Button` ("Zapisz przepis").
  - `LoadingSpinner`.
- **Obsługiwane interakcje:**
  - Wprowadzanie danych we wszystkie pola formularza.
  - Przełączanie trybów (jeśli zaimplementowano `Tabs`).
  - Dodawanie/usuwanie składników i kroków.
  - Wybór tagów.
  - Inicjowanie ekstrakcji z tekstu/URL.
  - Przełączanie widoczności oryginalnego tekstu.
  - Ponowne przetwarzanie oryginalnego tekstu (z potwierdzeniem).
  - Przesyłanie feedbacku AI.
  - Zapisywanie formularza.
- **Obsługiwana walidacja (po stronie klienta, przed wysłaniem do API):**
  - **Nazwa potrawy:** Wymagane (min. 1 znak, maks. np. 255 znaków - do ustalenia).
  - **Składniki:** Wymagany co najmniej 1 składnik. Każdy składnik: maks. 200 znaków. Maks. 50 składników.
  - **Kroki przygotowania:** Wymagany co najmniej 1 krok. Każdy krok: maks. 2000 znaków. Maks. 50 kroków.
  - **Czas przygotowania:** Opcjonalne, tekst (maks. np. 100 znaków).
  - **Źródło URL (dla trybu URL import):** Wymagane, musi być poprawnym URL z dozwolonych domen (`aniagotuje.pl`, `kwestiasmaku.com`).
  - **Notatki:** Opcjonalne, maks. 5000 znaków.
  - **Wklejony tekst (dla trybu ekstrakcji z tekstu):** Wymagane, maks. 10000 znaków.
  - **Tagi:** Opcjonalne, wybór z predefiniowanej listy.
- **Typy:**
  - `RecipeFormData` (ViewModel dla całego formularza).
  - `RecipeDetailDTO` (do inicjalizacji w trybie edycji).
  - `ExtractedRecipeDataDTO`, `ExtractFromTextResponseDTO`, `ExtractFromUrlResponseDTO` (do obsługi odpowiedzi z API ekstrakcji).
  - `CreateRecipeCommand`, `UpdateRecipeCommand` (do wysyłania danych do API zapisu).
  - `TagDTO[]` (lista dostępnych tagów).
- **Propsy:**
  - `recipeData?: RecipeDetailDTO`
  - `recipeId?: string` (ID przepisu, jeśli w trybie edycji)
  - `mode: 'new' | 'edit'`

### `DynamicFieldList` (Komponent React)

- **Opis komponentu:** Generyczny komponent do zarządzania dynamiczną listą pól tekstowych (np. składniki, kroki). Umożliwia dodawanie nowych pól i usuwanie istniejących.
- **Główne elementy:** Lista `Input` lub `Textarea`, `Button` ("Dodaj"), `Button` ("Usuń" przy każdym elemencie).
- **Obsługiwane interakcje:** Dodawanie nowego pola, usuwanie istniejącego pola, edycja wartości w polu.
- **Obsługiwana walidacja:** Przekazuje walidację pojedynczego pola do rodzica lub waliduje na podstawie propsów (np. min/max ilość elementów, max długość tekstu w elemencie).
- **Typy:** `string[]` (lista wartości pól).
- **Propsy:**
  - `items: string[]`
  - `setItems: (items: string[]) => void`
  - `label: string` (np. "Składnik", "Krok")
  - `fieldPlaceholder?: string`
  - `addButtonLabel: string`
  - `minItems?: number`
  - `maxItems?: number`
  - `maxCharsPerItem?: number`
  - `fieldType: 'input' | 'textarea'`
  - `textareaRows?: number` (jeśli `fieldType` to `textarea`)

### `MultiSelectTags` (Komponent React)

- **Opis komponentu:** Komponent do wyboru wielu tagów z predefiniowanej listy. Zbudowany przy użyciu komponentów Shadcn/ui (`Popover`, `Command`, `Checkbox`, `Badge`). Wyświetla wybrane tagi jako kolorowe `Badge`.
- **Główne elementy:** `Button` otwierający `Popover`, `Command` z listą `Checkbox` dla każdego tagu, `Badge` do wyświetlania wybranych tagów.
- **Obsługiwane interakcje:** Otwieranie/zamykanie popovera, zaznaczanie/odznaczanie tagów.
- **Obsługiwana walidacja:** Brak bezpośredniej, ale może być ograniczona liczba możliwych do wyboru tagów.
- **Typy:** `TagDTO[]` (dostępne tagi), `string[]` (ID wybranych tagów).
- **Propsy:**
  - `availableTags: TagDTO[]`
  - `selectedTagIds: string[]`
  - `setSelectedTagIds: (ids: string[]) => void`

### `AiFeedbackButtons` (Komponent React)

- **Opis komponentu:** Prosty komponent z dwoma przyciskami (np. ikony kciuka w górę/dół z `lucide-react`) do przesyłania feedbacku na temat jakości ekstrakcji AI.
- **Główne elementy:** Dwa `Button` z ikonami.
- **Obsługiwane interakcje:** Kliknięcie przycisku "kciuk w górę" lub "kciuk w dół".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `FeedbackType` (`'positive' | 'negative'`).
- **Propsy:**
  - `extractionLogId: string | null`
  - `currentFeedback: FeedbackType | null`
  - `onFeedbackSubmit: (feedback: FeedbackType) => void` (funkcja wywołująca API)

## 5. Typy

### ViewModels (Niestandardowe typy dla formularza)

**`RecipeFormData` (ViewModel dla `RecipeForm`)**

```typescript
interface RecipeFormData {
  id?: string; // Obecne w trybie edycji
  name: string;
  ingredients: string[];
  steps: string[];
  preparation_time: string; // W PRD jest opcjonalne, ale w formularzu może być stringiem, obsługa pustego stringa
  source_type: RecipeSourceType; // 'manual' | 'url' | 'text'
  source_url: string; // Edytowalne tylko gdy source_type to 'url'
  image_url: string; // Tylko do wyświetlania, nieedytowalne w MVP
  notes: string;
  tag_ids: string[]; // UUIDs wybranych tagów

  // Pola specyficzne dla trybów AI, używane do zarządzania stanem przed wypełnieniem głównych pól
  rawTextToProcess: string; // Dla trybu "Wklej tekst"
  originalRawText: string; // Przechowuje oryginalnie wklejony tekst
  isOriginalTextVisible: boolean;
  urlToImport: string; // Dla trybu "Import z URL"
  extractionLogId: string | null; // ID logu ekstrakcji dla feedbacku
  aiFeedback: FeedbackType | null; // Aktualny feedback użytkownika
}
```

### Inne wykorzystywane typy (z `src/types.ts` i API)

- `RecipeDetailDTO`: Do inicjalizacji formularza w trybie edycji.
- `CreateRecipeCommand`: Do wysyłania danych przy tworzeniu przepisu.
- `UpdateRecipeCommand`: Do wysyłania danych przy aktualizacji przepisu.
- `ExtractFromTextCommand`: Do żądania ekstrakcji z tekstu.
- `ExtractFromTextResponseDTO`: Odpowiedź z API ekstrakcji z tekstu.
- `ExtractedRecipeDataDTO`: Struktura danych po ekstrakcji AI.
- `ExtractFromUrlCommand`: Do żądania ekstrakcji z URL.
- `ExtractFromUrlResponseDTO`: Odpowiedź z API ekstrakcji z URL.
- `ExtractionFeedbackCommand`: Do wysyłania feedbacku AI.
- `TagDTO`: Do wyświetlania i wyboru tagów.
- `ErrorResponseDTO`: Do obsługi błędów API.
- `RecipeSourceType`: `'manual' | 'url' | 'text'`
- `FeedbackType`: `'positive' | 'negative'`

## 6. Zarządzanie stanem

Stan będzie zarządzany głównie w komponencie React `RecipeForm` przy użyciu hooka `useState` dla poszczególnych pól formularza (`RecipeFormData`) oraz dla stanu ładowania, błędów, trybu formularza.

**Potencjalne stany w `RecipeForm`:**

- `formData: RecipeFormData`
- `currentMode: 'manual' | 'text' | 'url'` (lub `activeTabKey` jeśli używane są `Tabs`)
- `isLoading: boolean` (globalny wskaźnik dla operacji API)
- `formErrors: Record<keyof RecipeFormData | 'rawTextToProcess' | 'urlToImport' | 'api', string | undefined>` (dla błędów walidacji i API)
- `availableTags: TagDTO[]` (pobrane z API)
- `initialRecipeData: RecipeDetailDTO | null` (dla trybu edycji, do porównań lub resetu)

**Niestandardowy hook:** Można rozważyć stworzenie niestandardowego hooka `useRecipeForm` który hermetyzowałby logikę stanu formularza, walidacji, oraz interakcji z API, jeśli komponent `RecipeForm` stałby się zbyt rozbudowany. Dla MVP prawdopodobnie wystarczy zarządzanie stanem bezpośrednio w komponencie.

```typescript
// Przykład struktury hooka (opcjonalnie)
// function useRecipeForm(initialData?: RecipeDetailDTO, mode: 'new' | 'edit') {
//   const [formData, setFormData] = useState<RecipeFormData>(...);
//   const [isLoading, setIsLoading] = useState(false);
//   // ... inne stany i funkcje obsługi
//   return { formData, setFormData, isLoading, handleSubmit, handleExtractText, ... };
// }
```

## 7. Integracja API

Komponent `RecipeForm` będzie komunikował się z następującymi endpointami:

1.  **`GET /api/tags`**

    - Cel: Pobranie listy dostępnych tagów do wyświetlenia w `MultiSelectTags`.
    - Wywołanie: Przy montowaniu komponentu `RecipeForm`.
    - Typ odpowiedzi: `TagListResponseDTO`.

2.  **`GET /api/recipes/:id`** (tylko w trybie edycji)

    - Cel: Pobranie danych istniejącego przepisu.
    - Wywołanie: W `RecipeFormView` (Astro), jeśli `params.id` jest obecne, dane przekazywane jako prop do `RecipeForm`.
    - Typ odpowiedzi: `RecipeDetailDTO`.

3.  **`POST /api/recipe/extract-from-text`**

    - Cel: Przetworzenie wklejonego tekstu przepisu przez AI.
    - Wywołanie: Po kliknięciu przycisku "Przetwórz tekst".
    - Typ żądania: `ExtractFromTextCommand` (`{ text: string }`).
    - Typ odpowiedzi: `ExtractFromTextResponseDTO`.
    - Obsługa: Wypełnienie pól formularza danymi z `extracted_data`, zapisanie `extraction_log_id` i `original_text`.

4.  **`POST /api/recipe/extract-from-url`**

    - Cel: Przetworzenie przepisu z podanego URL przez scraper i AI.
    - Wywołanie: Po kliknięciu przycisku "Importuj z URL".
    - Typ żądania: `ExtractFromUrlCommand` (`{ url: string }`).
    - Typ odpowiedzi: `ExtractFromUrlResponseDTO`.
    - Obsługa: Wypełnienie pól formularza danymi z `extracted_data`, zapisanie `extraction_log_id`. `source_url` i `image_url` (jeśli są) również powinny być ustawione.

5.  **`POST /api/recipe/extraction/:logId/feedback`**

    - Cel: Przesłanie oceny jakości ekstrakcji AI.
    - Wywołanie: Po kliknięciu przycisku "kciuk w górę" lub "kciuk w dół".
    - Typ żądania: `ExtractionFeedbackCommand` (`{ feedback: FeedbackType }`).
    - `:logId` pochodzi z odpowiedzi na ekstrakcję.
    - Typ odpowiedzi: `204 No Content`.

6.  **`POST /api/recipes`** (dla trybu `new`)

    - Cel: Zapisanie nowego przepisu.
    - Wywołanie: Po kliknięciu przycisku "Zapisz przepis" i pomyślnej walidacji.
    - Typ żądania: `CreateRecipeCommand` (mapowany z `RecipeFormData`).
    - Typ odpowiedzi: `RecipeDetailDTO` (szczegóły nowo utworzonego przepisu).
    - Obsługa: Przekierowanie na stronę szczegółów przepisu (`/recipes/:id`) po sukcesie.

7.  **`PUT /api/recipes/:id`** (dla trybu `edit`)
    - Cel: Aktualizacja istniejącego przepisu.
    - Wywołanie: Po kliknięciu przycisku "Zapisz przepis" i pomyślnej walidacji.
    - Typ żądania: `UpdateRecipeCommand` (mapowany z `RecipeFormData`).
    - Typ odpowiedzi: `RecipeDetailDTO` (szczegóły zaktualizowanego przepisu).
    - Obsługa: Przekierowanie na stronę szczegółów przepisu (`/recipes/:id`) po sukcesie.

Do wszystkich żądań modyfikujących dane (POST, PUT) oraz żądań ekstrakcji wymagany będzie nagłówek `Authorization: Bearer {token}`. Token będzie pobierany z Supabase Auth po stronie klienta.

## 8. Interakcje użytkownika

- **Wybór trybu (jeśli `Tabs`):** Kliknięcie na zakładkę zmienia widoczną sekcję formularza.
- **Wprowadzanie tekstu:** Standardowe wprowadzanie danych w pola `Input` i `Textarea`. Liczniki znaków dla pól z limitami (`notes`, `rawTextToProcess`, kroki).
- **Dodawanie/Usuwanie (Składniki/Kroki):** Kliknięcie "Dodaj" dodaje nowe puste pole. Kliknięcie "Usuń" obok pola usuwa je (z ewentualnym potwierdzeniem, jeśli pole nie jest puste - opcjonalnie).
- **Wybór tagów:** Kliknięcie na `MultiSelectTags` otwiera `Popover` z listą tagów. Zaznaczanie/odznaczanie `Checkbox` aktualizuje listę wybranych tagów.
- **Przycisk "Przetwórz tekst":**
  - Wywołuje API `POST /api/recipe/extract-from-text`.
  - Wyświetla `LoadingSpinner`.
  - Po odpowiedzi, wypełnia pola formularza (nazwa, składniki, kroki, czas, sugerowane tagi). Zapisuje `extraction_log_id`.
  - Wyświetla `Toast` z sukcesem lub błędem.
- **Przycisk "Importuj z URL":**
  - Wywołuje API `POST /api/recipe/extract-from-url`.
  - Wyświetla `LoadingSpinner`.
  - Po odpowiedzi, wypełnia pola formularza (jak wyżej + `image_url`, `source_url`). Zapisuje `extraction_log_id`.
  - Wyświetla `Toast` z sukcesem lub błędem.
- **Przyciski Feedback AI:**
  - Wywołują API `POST /api/recipe/extraction/:logId/feedback`.
  - Zmieniają stan `aiFeedback` w `RecipeFormData`.
  - Mogą wizualnie zaznaczyć wybraną opcję.
  - Wyświetlają `Toast` z potwierdzeniem.
- **Przycisk "Pokaż/Ukryj oryginalny tekst" (tryb "Wklej tekst"):**
  - Przełącza widoczność `Textarea` z `originalRawText`.
  - Umożliwia edycję `originalRawText`.
- **Przycisk "Przetwórz ponownie ten tekst" (tryb "Wklej tekst"):**
  - Wyświetla `Dialog` ostrzegawczy o nadpisaniu zmian w formularzu.
  - Po potwierdzeniu, wywołuje API `POST /api/recipe/extract-from-text` z zawartością `originalRawText`.
- **Przycisk "Zapisz przepis":**
  - Przeprowadza walidację po stronie klienta.
  - Jeśli są błędy, wyświetla je inline przy polach.
  - Jeśli walidacja pomyślna, wywołuje API `POST /api/recipes` lub `PUT /api/recipes/:id`.
  - Wyświetla `LoadingSpinner`.
  - Po sukcesie, przekierowuje na stronę szczegółów przepisu i wyświetla `Toast` o sukcesie.
  - W przypadku błędu API, wyświetla `Toast` z błędem.

## 9. Warunki i walidacja

- **Pola wymagane:**
  - `RecipeForm.name`: Nie może być puste. (US-009, US-010)
  - `RecipeForm.ingredients`: Musi zawierać co najmniej 1 element. (US-009, US-010)
  - `RecipeForm.steps`: Musi zawierać co najmniej 1 element. (US-009, US-010)
  - `RecipeForm.rawTextToProcess` (tryb "Wklej tekst"): Nie może być puste przed przetworzeniem.
  - `RecipeForm.urlToImport` (tryb "Import z URL"): Nie może być puste i musi być poprawnym URL z dozwolonej domeny.
- **Limity znaków:**
  - `rawTextToProcess`: Maks. 10000 znaków (PRD 3.1, US-005, US-011). Komunikat o przekroczeniu.
  - `ingredients[]`: Każdy element maks. 200 znaków.
  - `steps[]`: Każdy element maks. 2000 znaków.
  - `notes`: Maks. 5000 znaków.
- **Limity ilościowe:**
  - `ingredients`: Min. 1, maks. 50.
  - `steps`: Min. 1, maks. 50.
- **Walidacja URL (dla `urlToImport`):**
  - Musi pasować do wzorca URL.
  - Musi pochodzić z domeny `aniagotuje.pl` lub `kwestiasmaku.com` (PRD 3.2, US-007).
- **Walidacja przed zapisem (`POST/PUT /api/recipes`):** Komponent `RecipeForm` przed wysłaniem danych do API powinien sprawdzić wszystkie powyższe warunki. Jeśli walidacja nie przejdzie, błędy powinny być wyświetlane przy odpowiednich polach, a wysyłka zablokowana.
- **Komunikaty o błędach walidacji:** Powinny być jasne i wyświetlane inline przy polach, których dotyczą. (UX)
- **Blokowanie przycisku "Zapisz przepis":** Przycisk może być nieaktywny, dopóki podstawowe warunki walidacyjne (np. wypełniona nazwa) nie są spełnione, lub walidacja jest uruchamiana dopiero po kliknięciu.

## 10. Obsługa błędów

- **Błędy walidacji klienta:** Wyświetlane inline przy polach formularza.
- **Błędy API (ogólne):**
  - `400 Bad Request`: Zazwyczaj błędy walidacji po stronie serwera. Komunikat z API powinien być wyświetlony w `Toast`. `ErrorResponseDTO.error.details` może zawierać szczegóły.
  - `401 Unauthorized`: Problem z tokenem. Użytkownik powinien zostać np. przekierowany na stronę logowania.
  - `404 Not Found` (dla `PUT /api/recipes/:id` lub `GET /api/recipes/:id`): Przepis nie istnieje. Komunikat w `Toast`, ewentualnie przekierowanie na listę.
  - `429 Too Many Requests` (dla endpointów ekstrakcji): Przekroczono dzienny limit. Komunikat w `Toast` (np. "Przekroczono dzienny limit ekstrakcji (100/dzień)"). (Endpoint Description, US-011 implicitly related to limits)
  - `422 Unprocessable Entity` (dla endpointów ekstrakcji): Nie można sparsować/scrapować. Komunikat w `Toast` (np. "Nie udało się przetworzyć przepisu z podanego tekstu/URL. Spróbuj ponownie lub wprowadź dane manualnie."). (US-006, US-008)
  - `500 Internal Server Error` i inne błędy serwera: Ogólny komunikat błędu w `Toast` (np. "Wystąpił błąd serwera. Spróbuj ponownie później.").
- **Brak możliwości ekstrakcji AI (logiczny błąd, niekoniecznie HTTP error):**
  - Jeśli `POST /api/recipe/extract-from-text` lub `extract-from-url` zwrócą sukces (200 OK), ale `extracted_data` jest puste lub niekompletne (np. brak składników). Należy poinformować użytkownika (np. `Toast` lub komunikat w formularzu) i umożliwić manualne wypełnienie. (US-006)
- **Stan ładowania:** Podczas wywołań API (ekstrakcja, zapis) powinien być widoczny globalny `LoadingSpinner`, a przyciski inicjujące akcję powinny być zablokowane, aby zapobiec wielokrotnym kliknięciom.
- **Powiadomienia (`Toast`):** Używane do informowania o sukcesie (zapis, ekstrakcja, wysłanie feedbacku) oraz o błędach.

## 11. Kroki implementacji

1.  **Utworzenie plików strony Astro:**

    - `src/pages/recipes/new.astro`
    - `src/pages/recipes/[id]/edit.astro`
    - Oba pliki będą renderować komponent React `RecipeForm`. Plik `edit.astro` będzie odpowiedzialny za pobranie `recipeId` z `Astro.params` i przekazanie go do `RecipeForm`. W `edit.astro` należy również zaimplementować logikę pobierania danych przepisu (`GET /api/recipes/:id`) i przekazania ich jako prop `recipeData` do `RecipeForm`.

2.  **Stworzenie głównego komponentu `RecipeForm.tsx`:**

    - Zainicjowanie stanu formularza (`RecipeFormData`) i podstawowych pól (nazwa, czas przygotowania, notatki).
    - Implementacja logiki przełączania trybów (np. za pomocą `Tabs` z Shadcn/ui lub prostego stanu i warunkowego renderowania). Domyślny tryb dla `/recipes/new` to np. manualny lub wybór.

3.  **Implementacja komponentu `DynamicFieldList.tsx`:**

    - Logika dodawania, usuwania i edycji elementów listy.
    - Przyjmowanie propsów `minItems`, `maxItems`, `maxCharsPerItem` do podstawowej walidacji.

4.  **Integracja `DynamicFieldList` w `RecipeForm`:**

    - Dla składników i kroków przygotowania.

5.  **Implementacja komponentu `MultiSelectTags.tsx`:**

    - Pobieranie dostępnych tagów (`GET /api/tags`) w `RecipeForm` i przekazywanie ich jako prop.
    - Zarządzanie stanem wybranych tagów (`selectedTagIds`).

6.  **Implementacja trybu "Manualne dodawanie":**

    - Umożliwienie wypełnienia wszystkich pól, w tym wyboru tagów.
    - Logika przycisku "Zapisz przepis" wywołująca `POST /api/recipes` lub `PUT /api/recipes/:id` (w zależności od `mode`).
    - Walidacja po stronie klienta przed wysłaniem.

7.  **Implementacja trybu "Wklej tekst":**

    - Dodanie `Textarea` dla `rawTextToProcess` z licznikiem i walidacją limitu 10000 znaków.
    - Przycisk "Przetwórz tekst" wywołujący `POST /api/recipe/extract-from-text`.
    - Logika wypełniania formularza danymi z odpowiedzi (`extracted_data`).
    - Przechowywanie `originalRawText` i `extraction_log_id`.
    - Implementacja przycisków "Pokaż/Ukryj oryginalny tekst" i "Przetwórz ponownie ten tekst" (z `Dialog` ostrzegawczym).

8.  **Implementacja trybu "Import z URL":**

    - Dodanie `Input` dla `urlToImport` z walidacją URL i dozwolonych domen.
    - Przycisk "Importuj z URL" wywołujący `POST /api/recipe/extract-from-url`.
    - Logika wypełniania formularza, w tym `image_url` i `source_url` (ustawiane na `formData.source_url`).
    - Przechowywanie `extraction_log_id`.

9.  **Implementacja komponentu `AiFeedbackButtons.tsx`:**

    - Przyciski kciuk w górę/dół.
    - Wywołanie `POST /api/recipe/extraction/:logId/feedback`.
    - Integracja w `RecipeForm` (widoczne po ekstrakcji AI).

10. **Implementacja wyświetlania obrazka:**

    - Pole `img` (lub komponent `Image` z Astro) do wyświetlania `formData.image_url`. Tylko do wyświetlania, brak możliwości zmiany w MVP.

11. **Zarządzanie stanem ładowania i błędów:**

    - Dodanie `LoadingSpinner` (np. globalnie na formularzu).
    - System powiadomień `Toast` dla sukcesów i błędów.
    - Wyświetlanie błędów walidacji inline.

12. **Walidacja końcowa i obsługa krawędzi:**

    - Dokładne przetestowanie wszystkich ścieżek walidacji (limity, wymagane pola, formaty).
    - Obsługa przypadków, gdy API ekstrakcji zwraca niekompletne dane.
    - Zapewnienie poprawnej nawigacji po zapisie/anulowaniu.

13. **Dostępność (A11y):**

    - Zapewnienie odpowiednich etykiet (`Label`) dla wszystkich pól formularza.
    - Obsługa nawigacji klawiaturą, zwłaszcza w dynamicznych listach i `MultiSelectTags`.
    - Poprawne zarządzanie focusem, szczególnie przy dodawaniu/usuwaniu dynamicznych pól.

14. **Stylizacja i UX:**

    - Dopasowanie wyglądu do reszty aplikacji (Tailwind, Shadcn/ui).
    - Zapewnienie jasnych komunikatów i płynnego przepływu użytkownika.
    - Liczniki znaków dla pól z ograniczeniami.

15. **Testowanie:**
    - Manualne testowanie wszystkich user stories (US-005 do US-011).
    - Testowanie różnych scenariuszy błędów.
    - Testowanie responsywności.
