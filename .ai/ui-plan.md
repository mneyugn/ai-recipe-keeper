# Architektura UI dla AI RecipeKeeper

## 1. Przegląd struktury UI

Architektura UI dla AI RecipeKeeper została zaprojektowana z myślą o nowoczesności, minimalizmie i efektywności, opierając się na tech stacku: Astro, React, TypeScript, Tailwind CSS oraz bibliotece komponentów Shadcn/ui. Głównym celem jest zapewnienie intuicyjnego interfejsu do digitalizacji, zarządzania i przeglądania przepisów kulinarnych, z silnym naciskiem na funkcje wspierane przez AI.

Interfejs użytkownika będzie składał się z publicznie dostępnych stron autoryzacyjnych (logowanie, rejestracja, reset hasła) oraz chronionych widoków dostępnych po zalogowaniu. Chronione widoki obejmują zarządzanie przepisami (galeria/lista, szczegóły, formularz dodawania/edycji z trybami importu AI) oraz profil użytkownika. Nawigacja będzie prosta i klarowna, umożliwiając łatwy dostęp do kluczowych funkcji przez sidebar po lewej stronie. Zarządzanie stanem będzie realizowane głównie lokalnie w komponentach React, z możliwym użyciem React Context API dla danych globalnych. Komunikacja z backendem odbywać się będzie poprzez REST API, zgodnie z dostarczonym planem API.

## 2. Lista widoków

Poniżej przedstawiono listę kluczowych widoków aplikacji:

---

### 1. Strona Logowania

- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie zarejestrowanym użytkownikom zalogowania się do aplikacji.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz logowania.
  - Komunikaty o błędach logowania.
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Card` (opakowanie formularza)
  - `Label` (dla pól formularza)
  - `Input` (dla adresu e-mail/nazwy użytkownika i hasła)
  - `Button` (do przesłania formularza)
  - Linki tekstowe do strony rejestracji i resetowania hasła.
  - `Toast` (dla ogólnych błędów/powiadomień)
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Prosty i szybki proces logowania. Jasne komunikaty o błędach.
  - **Dostępność:** Poprawne etykiety pól, obsługa nawigacji klawiaturą.
  - **Bezpieczeństwo:** Przesyłanie danych przez HTTPS, ochrona przed atakami brute-force (po stronie serwera), bezpieczne zarządzanie sesją przez Supabase Auth.

---

### 2. Strona Rejestracji

- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom utworzenia konta w aplikacji.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz rejestracji.
  - Wymagania dotyczące hasła (jeśli są specyficzne).
  - Komunikaty o błędach walidacji.
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Card`
  - `Label`
  - `Input` (dla adresu e-mail/nazwy użytkownika, hasła, potwierdzenia hasła)
  - `Button` (do przesłania formularza)
  - Link tekstowy do strony logowania.
  - `Toast`
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Czytelny formularz, jasne instrukcje i komunikaty o błędach.
  - **Dostępność:** Etykiety, nawigacja klawiaturą.
  - **Bezpieczeństwo:** HTTPS, walidacja danych po stronie klienta i serwera, sprawdzanie unikalności emaila/nazwy użytkownika.

---

### 3. Strona Resetowania Hasła (Inicjacja)

- **Nazwa widoku:** Zapomniałem Hasła
- **Ścieżka widoku:** `/forgot-password`
- **Główny cel:** Umożliwienie użytkownikowi zainicjowania procesu resetowania zapomnianego hasła.
- **Kluczowe informacje do wyświetlenia:**
  - Pole do wprowadzenia adresu e-mail.
  - Instrukcje dotyczące dalszych kroków.
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Card`
  - `Label`
  - `Input` (dla adresu e-mail)
  - `Button` (Wyślij link do resetu)
  - `Toast`
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Prosty proces, jasne instrukcje.
  - **Dostępność:** Etykiety, nawigacja klawiaturą.
  - **Bezpieczeństwo:** HTTPS, weryfikacja istnienia emaila w systemie.

---

### 4. Strona Resetowania Hasła (Ustawienie Nowego Hasła)

- **Nazwa widoku:** Ustaw Nowe Hasło
- **Ścieżka widoku:** `/reset-password` (ścieżka zazwyczaj zawiera unikalny token)
- **Główny cel:** Umożliwienie użytkownikowi ustawienia nowego hasła po przejściu przez link resetujący.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz do wprowadzenia nowego hasła i jego potwierdzenia.
  - Wymagania dotyczące nowego hasła.
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Card`
  - `Label`
  - `Input` (dla nowego hasła i jego potwierdzenia)
  - `Button` (Ustaw nowe hasło)
  - `Toast`
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Bezproblemowa zmiana hasła.
  - **Dostępność:** Etykiety, nawigacja klawiaturą.
  - **Bezpieczeństwo:** HTTPS, walidacja tokenu resetującego, wymogi dotyczące siły hasła.

---

### 5. Lista Przepisów

- **Nazwa widoku:** Moje Przepisy
- **Ścieżka widoku:** `/recipes` (domyślny widok po zalogowaniu)
- **Główny cel:** Wyświetlenie listy przepisów użytkownika z możliwością sortowania, filtrowania, dodawania nowych przepisów i nawigacji do szczegółów przepisu.
- **Kluczowe informacje do wyświetlenia:**
  - Lista/siatka przepisów (miniatura/placeholder, nazwa, tagi).
  - Licznik wszystkich przepisów użytkownika.
  - Kontrolki sortowania.
  - Interfejs filtrowania po tagach.
  - Komunikat o pustej liście (jeśli brak przepisów).
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Button` (\"Dodaj nowy przepis\")
  - `DropdownMenu` lub `Select` (dla opcji sortowania: data dodania rosnąco/malejąco, nazwa rosnąco/malejąco)
  - Pole `Input` z autouzupełnianiem lub kombinacja komponentów (`Popover`, `Command`, `Checkbox`) do wyboru wielu tagów do filtrowania.
  - `Badge` (do wyświetlania wybranych tagów filtrujących oraz tagów przy każdym przepisie - kolorowe).
  - Komponenty `Card` lub niestandardowe elementy listy/siatki dla każdego przepisu.
  - `img` z placeholderem (generyczny obrazek talerza) dla miniatur.
  - Logika nieskończonego przewijania (infinite scroll).
  - `Toast` (dla powiadomień).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Łatwe przeglądanie i zarządzanie przepisami. Szybkie filtrowanie i sortowanie. Wizualne wskazówki (kolorowe tagi, miniatury).
  - **Dostępność:** Nawigacja klawiaturą po liście i kontrolkach, odpowiednie atrybuty ARIA dla dynamicznych elementów.
  - **Bezpieczeństwo:** Dostęp tylko dla zalogowanych użytkowników, dane pobierane z API zabezpieczonego tokenem.

---

### 6. Szczegóły Przepisu

- **Nazwa widoku:** Szczegóły Przepisu
- **Ścieżka widoku:** `/recipes/:id`
- **Główny cel:** Wyświetlenie pełnych informacji o wybranym przepisie oraz umożliwienie jego edycji lub usunięcia.
- **Kluczowe informacje do wyświetlenia:**
  - Nazwa potrawy.
  - Zdjęcie potrawy (jeśli dostępne, w przeciwnym razie placeholder).
  - Lista składników.
  - Kroki przygotowania.
  - Czas przygotowania.
  - Źródło (URL lub \"Manual\").
  - Tagi (kolorowe).
  - Notatki użytkownika.
  - Data dodania/ostatniej modyfikacji (format: \"DD.MM.RRRR HH:MM\").
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `img` (dla zdjęcia przepisu, z placeholderem).
  - `Badge` (dla tagów, z kolorami pobranymi z API).
  - `Button` (\"Edytuj przepis\", \"Usuń przepis\").
  - `Dialog` (do potwierdzenia operacji usunięcia przepisu).
  - `Toast` (dla powiadomień np. o usunięciu).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Czytelna prezentacja wszystkich danych przepisu. Łatwy dostęp do akcji edycji i usuwania. Potwierdzenie przed usunięciem.
  - **Dostępność:** Semantyczna struktura treści, alternatywny tekst dla obrazka.
  - **Bezpieczeństwo:** Dostęp tylko dla właściciela przepisu (RLS w Supabase).

---

### 7. Formularz Dodawania/Edycji Przepisu

- **Nazwa widoku:** Dodaj Przepis / Edytuj Przepis
- **Ścieżka widoku:** `/recipes/new`, `/recipes/:id/edit`
- **Główny cel:** Umożliwienie użytkownikowi dodania nowego przepisu (manualnie, poprzez wklejenie tekstu, poprzez import z URL) lub edycji istniejącego przepisu.
- **Kluczowe informacje do wyświetlenia / Pola formularza:**
  - Nazwa potrawy (wymagane, tekst).
  - Składniki (dynamiczna lista, min. 1, maks. 50; każdy składnik jako `Input`, maks. 200 znaków).
  - Kroki przygotowania (dynamiczna lista, min. 1, maks. 50; każdy krok jako `Textarea` z obsługą nowych linii, maks. 2000 znaków).
  - Czas przygotowania (opcjonalnie, tekst).
  - Źródło (`source_url` - edytowalne tylko gdy `source_type` to \'url\', `source_type` - pole ukryte, ustawiane automatycznie).
  - Obrazek (wyświetlany jeśli jest; przy imporcie z URL obrazek jest pobierany automatycznie przez backend. Przy dodawaniu/edycji manualnej - MVP nie zakłada manualnego uploadu zdjęcia, ale API na to pozwala. Na razie pole tylko do wyświetlania).
  - Notatki (opcjonalnie, `Textarea`, maks. 5000 znaków, z licznikiem znaków).
  - Tagi (wybór wielu tagów z predefiniowanej listy, komponent `MultiSelect` z kolorowymi tagami).
  - **Dla trybu \"Wklej tekst\":**
    - Duże pole `Textarea` na wklejony tekst (limit 10000 znaków, z licznikiem).
    - Przycisk \"Przetwórz tekst\".
    - Opcja \"Pokaż/Ukryj oryginalny tekst\" (oryginalny tekst edytowalny).
    - Przycisk \"Przetwórz ponownie ten tekst\" (z modalem ostrzegawczym).
  - **Dla trybu \"Import z URL\":**
    - Pole `Input` na URL (tylko `aniagotuje.pl`, `kwestiasmaku.com`).
    - Przycisk \"Importuj z URL\".
  - **Feedback AI:** Ikony \"kciuk w górę\" / \"kciuk w dół\" (np. z `lucide-react`) dostępne bezpośrednio po ekstrakcji AI, przed zapisem przepisu.
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Tabs` (opcjonalnie, do przełączania trybów dodawania: Tekst, URL, Manualnie, jeśli to jedna strona/komponent).
  - `Input`, `Textarea`, `Label`.
  - `Button` (\"Zapisz przepis\", \"Dodaj składnik\", \"Dodaj krok\", \"Usuń składnik/krok\", oraz specyficzne dla trybów).
  - Komponent `MultiSelect` (zbudowany z `Popover`, `Command`, `Checkbox`, `Badge`).
  - `Dialog` (dla ostrzeżenia przed ponownym przetworzeniem oryginalnego tekstu, dla potwierdzenia usunięcia składnika/kroku).
  - `Toast` (dla błędów walidacji, sukcesu zapisu, błędów ekstrakcji).
  - Globalny wskaźnik ładowania (spinner) podczas operacji AI i zapisu.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Prowadzenie użytkownika przez proces dodawania/edycji. Dynamiczne dodawanie/usuwanie składników/kroków. Jasne komunikaty o błędach walidacji (inline). Możliwość korekty danych po ekstrakcji AI. Informacja o limitach (np. znaków, ilości składników).
  - **Dostępność:** Etykiety dla wszystkich pól, zarządzanie focusem przy dynamicznym dodawaniu elementów.
  - **Bezpieczeństwo:** Walidacja danych po stronie klienta i serwera. Ochrona przed wstrzykiwaniem skryptów w polach tekstowych.

---

### 8. Profil Użytkownika

- **Nazwa widoku:** Mój Profil
- **Ścieżka widoku:** `/profile`
- **Główny cel:** Wyświetlenie informacji o koncie użytkownika, w tym statystyk i limitów. Umożliwienie wylogowania.
- **Kluczowe informacje do wyświetlenia:**
  - Adres e-mail użytkownika.
  - Nazwa użytkownika.
  - Całkowita liczba przepisów użytkownika.
  - Wykorzystany limit ekstrakcji AI (np. \"Wykorzystano: 5/100\") wraz z paskiem postępu.
  - Informacja o dacie resetu limitu ekstrakcji (np. \"Limit odnawia się jutro\").
  - Komunikat o przekroczeniu limitu: \"Skończył Ci się limit - wróć do nas jutro\".
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - `Card` (do grupowania informacji profilowych).
  - `Progress` (dla wizualizacji limitu ekstrakcji).
  - `Button` (\"Wyloguj\").
  - `Toast` (dla powiadomień).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Przejrzyste informacje o koncie i limitach. Łatwy dostęp do funkcji wylogowania.
  - **Dostępność:** Odpowiednie nagłówki i etykiety.
  - **Bezpieczeństwo:** Dostęp tylko dla zalogowanego użytkownika.

---

### 9. Strona Błędu 404 (Nie znaleziono)

- **Nazwa widoku:** Nie Znaleziono Strony
- **Ścieżka widoku:** `*` (obsługa wszystkich niepasujących ścieżek)
- **Główny cel:** Poinformowanie użytkownika, że żądana strona nie istnieje.
- **Kluczowe informacje do wyświetlenia:**
  - Komunikat o błędzie 404.
  - Link do strony głównej (np. `/recipes` dla zalogowanych, `/login` dla niezalogowanych).
- **Kluczowe komponenty widoku (Shadcn/ui):**
  - Prosty layout z tekstem i linkiem (`Button` lub standardowy `<a>`).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Pomoc użytkownikowi w powrocie do działającej części aplikacji.
  - **Dostępność:** Czytelny komunikat.
  - **Bezpieczeństwo:** Brak bezpośrednich implikacji bezpieczeństwa.

---

## 3. Mapa podróży użytkownika

Poniżej opisano kluczowe przepływy użytkownika w aplikacji:

**A. Rejestracja i pierwsze logowanie:**

1.  Użytkownik trafia na `/login` lub `/register`.
2.  **Rejestracja:** Na `/register` wypełnia formularz -> Sukces -> Przekierowanie na `/login`
3.  **Logowanie:** Na `/login` podaje dane -> Sukces -> Przekierowanie na `/recipes`.

**B. Dodawanie nowego przepisu (np. z wklejonego tekstu):**

1.  Użytkownik jest na `/recipes`.
2.  Klika \"Dodaj nowy przepis\".
3.  Przechodzi na `/recipes/new`.
4.  Wybiera tryb \"Wklej tekst\" (jeśli są zakładki) lub od razu widzi pole do wklejenia.
5.  Wkleja tekst przepisu, klika \"Przetwórz tekst\".
6.  API `POST /api/recipe/extract-from-text` jest wywoływane.
7.  Formularz wypełnia się sparsowanymi danymi; pojawiają się ikony feedbacku AI.
8.  Użytkownik może dać feedback (kliknięcie ikony wysyła `POST /api/recipe/extraction/{logId}/feedback`).
9.  Użytkownik weryfikuje/edytuje dane, dodaje tagi, notatki.
10. Może użyć opcji \"Pokaż/Ukryj oryginalny tekst\", edytować go, a następnie \"Przetwórz ponownie ten tekst\" (pojawia się modal ostrzegawczy).
11. Klika \"Zapisz przepis\".
12. API `POST /api/recipes` jest wywoływane.
13. Sukces -> Przekierowanie na `/recipes/:id` nowo dodanego przepisu. Komunikat (toast) o sukcesie.
14. Błąd walidacji -> Błędy wyświetlane inline w formularzu.
15. Błąd serwera/limitu -> Komunikat (toast).

**C. Przeglądanie, edycja i usuwanie przepisu:**

1.  Użytkownik jest na `/recipes`.
2.  Widzi listę swoich przepisów. Może sortować (`DropdownMenu`) i filtrować (pole wyboru tagów).
3.  Klika na wybrany przepis.
4.  Przechodzi na `/recipes/:id`. Widzi szczegóły.
5.  **Edycja:** Klika \"Edytuj przepis\".
    1.  Przechodzi na `/recipes/:id/edit`. Formularz jest wypełniony danymi z `GET /api/recipes/:id`.
    2.  Modyfikuje dane, klika \"Zapisz zmiany\".
    3.  API `PUT /api/recipes/:id` jest wywoływane.
    4.  Sukces -> Przekierowanie na `/recipes/:id`. Toast o sukcesie.
6.  **Usuwanie:** Klika \"Usuń przepis\".
    1.  Pojawia się `Dialog` z prośbą o potwierdzenie.
    2.  Potwierdza -> API `DELETE /api/recipes/:id` jest wywoływane.
    3.  Sukces -> Przekierowanie na `/recipes`. Toast o sukcesie. Licznik przepisów zaktualizowany.

**D. Sprawdzanie profilu i limitów:**

1.  Użytkownik klika na link \"Profil\" w nawigacji.
2.  Przechodzi na `/profile`.
3.  Widzi swoje dane, liczbę przepisów i status limitu ekstrakcji (pobierane z `GET /api/users/profile`).
4.  Może kliknąć \"Wyloguj\".

**E. Resetowanie hasła:**

1.  Użytkownik na `/login` klika \"Zapomniałem hasła\".
2.  Przechodzi na `/forgot-password`. Wpisuje e-mail, klika \"Wyślij link\".
3.  Otrzymuje e-mail, klika w link.
4.  Przechodzi na `/reset-password` (z tokenem w URL).
5.  Wpisuje nowe hasło, potwierdza, klika \"Ustaw nowe hasło\".
6.  Sukces -> Może zostać przekierowany na `/login`. Toast o sukcesie.

## 4. Układ i struktura nawigacji

**A. Układ ogólny:**

- **Sidebar:** Widoczny na większości stron po zalogowaniu. Zawiera logo/nazwę aplikacji, główne linki nawigacyjne, oraz menu użytkownika/przycisk wylogowania.
- **Główna treść strony:** Dynamicznie renderowana zawartość w zależności od bieżącego widoku.

**B. Nawigacja dla niezalogowanych użytkowników:**

- Strony `/login`, `/register`, `/forgot-password`, `/reset-password` będą miały prostą nawigację, głównie linki między sobą (np. z \"Nie masz konta? Zarejestruj się\" na stronie logowania).

**C. Nawigacja dla zalogowanych użytkowników (w sidebarze):**

- **Logo/Nazwa aplikacji:** Link do `/recipes` (strona główna po zalogowaniu).
- **\"Moje Przepisy\":** Link do `/recipes`.
- **\"Dodaj Przepis\":** Link do `/recipes/new`.
- **Menu Użytkownika (np. ikona profilu):**
  - **\"Profil\":** Link do `/profile`.
  - **\"Wyloguj\":** Akcja wylogowania (Supabase Auth `signOut()`) i przekierowanie na `/login`.

**D. Nawigacja kontekstowa:**

- Przyciski \"Edytuj\", \"Usuń\" na stronie szczegółów przepisu.
- Linki \"Wróć\" - opcjonalne dla MVP.

## 5. Kluczowe komponenty (współdzielone/powtarzalne)

Wiele komponentów będzie pochodzić z biblioteki Shadcn/ui i będzie używanych w różnych widokach. Poniżej kilka kluczowych, które mogą być również niestandardowymi kompozycjami:

- **`RecipeCard` (React):** Komponent do wyświetlania pojedynczego przepisu na liście (`/recipes`). Zawiera miniaturę/placeholder, nazwę, tagi.
- **`RecipeForm` (React):** Główny komponent formularza używany na `/recipes/new` i `/recipes/:id/edit`. Zarządza stanem formularza, walidacją, dynamicznymi listami składników/kroków i interakcją z API. Obsługuje różne tryby inicjalizacji (pusty, z danych AI, z danych istniejącego przepisu).
- **`MultiSelectTags` (React):** Niestandardowy komponent (zbudowany z elementów Shadcn/ui jak `Popover`, `Command`, `Checkbox`, `Badge`) do wyboru wielu tagów z predefiniowanej listy pobieranej z `GET /api/tags`. Używany w `RecipeForm` i potencjalnie w filtrach na `/recipes`. Tagi wyświetlane jako kolorowe `Badge`.
- **`DynamicFieldList` (React):** Generyczny komponent do zarządzania listami pól formularza (np. dla składników i kroków w `RecipeForm`), umożliwiający dodawanie i usuwanie elementów.
- **`ConfirmationDialog` (Shadcn `Dialog`):** Używany do potwierdzania krytycznych akcji, np. usunięcia przepisu, nadpisania danych przy ponownym przetwarzaniu tekstu.
- **`LoadingSpinner` (React/Shadcn):** Globalny lub lokalny wskaźnik ładowania dla operacji asynchronicznych.
- **`ToastNotifications` (Shadcn `Toast`):** System powiadomień (toasty) do informowania o sukcesach, błędach, ostrzeżeniach. Konfiguracja dostawcy Toast na poziomie głównym aplikacji.
- **`AuthFormCard` (React/Astro):** Opakowanie dla formularzy na stronach `/login`, `/register`, `/forgot-password`, `/reset-password`, zawierające `Card` i wspólną logikę/stylizację.
- **`UserAvatar/Menu` (React/Astro):** Komponent w nagłówku wyświetlający informacje o użytkowniku (lub ikonę) i rozwijane menu z linkami do profilu i opcją wylogowania.
