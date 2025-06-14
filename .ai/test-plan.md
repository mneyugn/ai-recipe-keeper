<plan_testów>

# Plan Testów dla Projektu AI RecipeKeeper

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji internetowej AI RecipeKeeper. Aplikacja ta ma na celu ułatwienie użytkownikom digitalizacji, przechowywania i zarządzania przepisami kulinarnymi, z wykorzystaniem sztucznej inteligencji do automatyzacji importu przepisów z różnych źródeł. Projekt bazuje na nowoczesnym stosie technologicznym obejmującym Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui oraz Supabase jako backend i Openrouter.ai do obsługi modeli AI.

### 1.2. Cele testowania

Główne cele procesu testowania projektu AI RecipeKeeper to:

1.  **Weryfikacja funkcjonalności:** Zapewnienie, że wszystkie zaimplementowane funkcje, w tym kluczowe funkcje MVP (Minimum Viable Product) opisane w dokumentacji projektu (README.md, prd.md), działają zgodnie z wymaganiami i specyfikacją.
2.  **Zapewnienie jakości i niezawodności:** Identyfikacja i eliminacja błędów oraz defektów w oprogramowaniu w celu dostarczenia stabilnego i niezawodnego produktu.
3.  **Ocena wydajności:** Weryfikacja, czy aplikacja działa wydajnie pod względem szybkości ładowania, czasu odpowiedzi API oraz szybkości przetwarzania przez moduły AI.
4.  **Testowanie bezpieczeństwa:** Sprawdzenie podstawowych aspektów bezpieczeństwa, w szczególności autentykacji, autoryzacji (RLS w Supabase) oraz ochrony danych użytkownika.
5.  **Ocena użyteczności:** Zapewnienie, że interfejs użytkownika jest intuicyjny, łatwy w obsłudze i przyjazny dla użytkownika.
6.  **Potwierdzenie integracji:** Sprawdzenie poprawnej współpracy pomiędzy komponentami frontendowymi, backendowymi API, bazą danych Supabase oraz zewnętrzną usługą Openrouter.ai.
7.  **Weryfikacja metryk sukcesu:** Sprawdzenie, czy zaimplementowane funkcje spełniają zdefiniowane w PRD metryki sukcesu (np. dokładność parsowania AI).

## 2. Zakres testów

### 2.1. Funkcjonalności w zakresie testów

Testowaniu podlegać będą wszystkie kluczowe funkcjonalności aplikacji zdefiniowane jako MVP, w tym:

1.  **Moduł Autentykacji Użytkowników:**
    - Rejestracja nowych użytkowników.
    - Logowanie i wylogowywanie.
    - Mechanizm odzyskiwania hasła.
    - Ochrona dostępu do zasobów aplikacji (middleware, RLS).
2.  **Inteligentne Parsowanie Przepisów (AI):**
    - Ekstrakcja danych (nazwa, składniki, kroki, tagi, czas przygotowania) z wklejonego tekstu.
    - Obsługa limitu znaków dla wklejanego tekstu (10000 znaków).
    - Mechanizm feedbacku użytkownika dotyczący jakości parsowania.
3.  **Import Przepisu z URL:**
    - Import przepisów z obsługiwanych stron (aniagotuje.pl, kwestiasmaku.com).
    - Automatyczne pobieranie treści, zdjęcia głównego i przekazywanie do modułu AI.
    - Obsługa błędów scrapera i parsowania.
4.  **Zarządzanie Przepisami (CRUD):**
    - Manualne dodawanie nowych przepisów.
    - Przeglądanie listy własnych przepisów z opcjami sortowania i filtrowania po tagach.
    - Wyświetlanie szczegółów przepisu.
    - Edycja istniejących przepisów.
    - Usuwanie przepisów (z potwierdzeniem).
    - Automatyczne zapisywanie daty dodania/modyfikacji.
5.  **Interfejs Użytkownika (UI):**
    - Formularz dodawania/edycji przepisu (w tym `DynamicFieldList`, `MultiSelectTags`).
    - Lista przepisów (`RecipeCard`, `SortSelector`, `TagFilter`).
    - Profil użytkownika (`ProfileContainer`, `UserInfoCard`, `ExtractionLimitCard`).
    - Sidebar aplikacji (`AppSidebar`).
    - Responsywność interfejsu na różnych urządzeniach.
6.  **API Backendowe:**
    - Wszystkie endpointy zdefiniowane w `src/pages/api/` (autentykacja, przepisy, tagi, ekstrakcja, profil użytkownika).
    - Walidacja danych wejściowych i odpowiedzi.
    - Obsługa błędów i kodów statusu HTTP.
7.  **Baza Danych (Supabase):**
    - Poprawność działania migracji (`supabase/migrations/`).
    - Weryfikacja polityk RLS.
    - Poprawność działania funkcji i triggerów bazodanowych (np. limity ekstrakcji).
    - Integralność danych.
8.  **Integracja z Usługami Zewnętrznymi:**
    - Poprawna komunikacja z Openrouter.ai (`OpenRouterService`).
    - Obsługa błędów i limitów z Openrouter.ai.

### 2.2. Funkcjonalności poza zakresem testów (MVP)

Następujące funkcjonalności nie będą testowane w ramach MVP, zgodnie z dokumentem PRD:

- Zaawansowane generowanie planów dietetycznych.
- Dobieranie przepisów na podstawie "wirtualnej lodówki".
- Uniwersalny scraper/parser URL dla stron innych niż aniagotuje.pl i kwestiasmaku.com.
- Generowanie list zakupów.
- Zaawansowane funkcje społecznościowe (udostępnianie, komentowanie, ocenianie przepisów innych).
- Automatyczne skalowanie ilości składników.
- Analiza wartości odżywczych.
- Generowanie obrazów do przepisów przez AI.
- Dedykowane aplikacje mobilne (iOS, Android).
- Import przepisów ze zdjęć lub skanów.
- Aktywne, ciągłe utrzymanie scraperów poza podstawową implementacją.
- Zaawansowane wyszukiwanie przepisów (np. po składnikach).
- Normalizacja jednostek miar.
- Drag&drop w edycji składników/kroków.
- Dodawanie własnych, niestandardowych tagów.

Ponadto, nie będą testowane wewnętrzne mechanizmy działania frameworków i bibliotek (Astro, React, Supabase, Shadcn/ui, OpenRouter.ai), a jedynie ich poprawna integracja i wykorzystanie w projekcie.

## 3. Typy testów do przeprowadzenia

W ramach projektu AI RecipeKeeper zostaną przeprowadzone następujące typy testów:

1.  **Testy Jednostkowe (Unit Tests):**
    - **Cel:** Weryfikacja poprawności działania małych, izolowanych fragmentów kodu (funkcji, komponentów React, modułów, klas serwisów, schematów walidacji Zod).
    - **Zakres:**
      - Funkcje pomocnicze w `src/lib/utils.ts`.
      - Schematy walidacji Zod w `src/lib/validations/`.
      - Logika niestandardowych hooków React (np. `useRecipeList`, `useUserProfile`).
      - Wybrane metody klas serwisów (np. `OpenRouterService`, `RecipeExtractionService`) z mockowanymi zależnościami.
      - Proste komponenty React (np. `AiFeedbackButtons`, `SortSelector` z mockowanymi propsami).
2.  **Testy Integracyjne (Integration Tests):**
    - **Cel:** Sprawdzenie poprawnej współpracy pomiędzy różnymi modułami i komponentami systemu.
    - **Zakres:**
      - Frontend: Interakcja komponentów React (np. `RecipeForm` z `DynamicFieldList` i `MultiSelectTags`), współpraca komponentów z hookami i serwisami klienckimi (`auth.service.ts`).
      - Backend: Poprawność działania endpointów API w połączeniu z logiką serwisów i interakcją z (testową) bazą danych Supabase. Testowanie funkcji i triggerów Supabase.
      - Komunikacja frontend-backend: Poprawność wysyłania żądań i odbierania odpowiedzi między komponentami React a endpointami API Astro.
      - Integracja z `OpenRouterService` i mockowaną odpowiedzią AI.
3.  **Testy End-to-End (E2E Tests):**
    - **Cel:** Weryfikacja kompletnych przepływów użytkownika w aplikacji, symulując rzeczywiste scenariusze użycia od interfejsu użytkownika aż po bazę danych.
    - **Zakres:** Kluczowe historyjki użytkownika (US) zdefiniowane w PRD, np.:
      - Pełny proces rejestracji, logowania, resetu hasła.
      - Dodawanie przepisu (manualne, z tekstu AI, z URL AI), weryfikacja, zapis.
      - Przeglądanie listy przepisów, sortowanie, filtrowanie.
      - Wyświetlanie szczegółów, edycja i usuwanie przepisu.
      - Interakcja z profilem użytkownika i wylogowanie.
4.  **Testy API (API Tests):**
    - **Cel:** Bezpośrednie testowanie endpointów API (`src/pages/api/`) pod kątem poprawności kontraktu, logiki biznesowej, walidacji, obsługi błędów i bezpieczeństwa.
    - **Zakres:** Wszystkie endpointy CRUD dla przepisów, endpointy autentykacji, ekstrakcji AI, tagów, profilu użytkownika. Testowanie różnych typów żądań, parametrów, nagłówków i danych wejściowych.
5.  **Testy Wydajnościowe (Performance Tests):**
    - **Cel:** Ocena szybkości działania aplikacji pod obciążeniem i identyfikacja potencjalnych wąskich gardeł.
    - **Zakres:**
      - Czas odpowiedzi kluczowych endpointów API (zwłaszcza lista przepisów, ekstrakcja AI).
      - Czas ładowania głównych stron (lista przepisów, szczegóły przepisu).
      - Szybkość działania funkcji AI (ekstrakcja z tekstu, URL).
6.  **Testy Bezpieczeństwa (Security Tests):**
    - **Cel:** Identyfikacja podstawowych podatności i weryfikacja mechanizmów bezpieczeństwa.
    - **Zakres:**
      - Poprawność działania mechanizmów autentykacji i autoryzacji (w tym RLS w Supabase).
      - Ochrona przed podstawowymi atakami (np. XSS w polach formularzy, SQL Injection - minimalizowane przez Supabase).
      - Walidacja danych wejściowych po stronie serwera.
      - Poprawność działania middleware.
7.  **Testy Użyteczności (Usability Tests):**
    - **Cel:** Ocena łatwości obsługi, intuicyjności i ogólnego doświadczenia użytkownika (UX).
    - **Zakres:** Kluczowe przepływy użytkownika, nawigacja, zrozumiałość komunikatów, wygląd interfejsu.
8.  **Testy Kompatybilności (Compatibility Tests):**
    - **Cel:** Zapewnienie poprawnego działania aplikacji na różnych przeglądarkach.
    - **Zakres:** Testowanie na najnowszych wersjach popularnych przeglądarek (Chrome, Firefox, Safari, Edge).
9.  **Testy Regresji (Regression Tests):**
    - **Cel:** Zapewnienie, że nowe zmiany lub poprawki błędów nie wprowadziły nowych defektów w istniejących funkcjonalnościach.
    - **Zakres:** Uruchamianie zestawu kluczowych testów (jednostkowych, integracyjnych, E2E) po każdej istotnej modyfikacji kodu.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

Poniżej przedstawiono przykładowe scenariusze testowe, które zostaną rozwinięte w szczegółowe przypadki testowe. Scenariusze bazują na historyjkach użytkownika (US) z dokumentu PRD.

### 4.1. Autentykacja Użytkownika (US-001 - US-004)

- **SCN-AUTH-001:** Pomyślna rejestracja nowego użytkownika z poprawnymi danymi.
- **SCN-AUTH-002:** Próba rejestracji z zajętym adresem email/nazwą użytkownika.
- **SCN-AUTH-003:** Próba rejestracji z niepasującymi hasłami.
- **SCN-AUTH-004:** Pomyślne logowanie zarejestrowanego użytkownika.
- **SCN-AUTH-005:** Próba logowania z niepoprawnym hasłem.
- **SCN-AUTH-006:** Próba logowania z nieistniejącym adresem email/nazwą użytkownika.
- **SCN-AUTH-007:** Pomyślne zainicjowanie procesu resetowania hasła.
- **SCN-AUTH-008:** Pomyślne ustawienie nowego hasła przy użyciu poprawnego linku/tokenu.
- **SCN-AUTH-009:** Próba użycia wygasłego/niepoprawnego linku/tokenu do resetu hasła.
- **SCN-AUTH-010:** Pomyślne wylogowanie użytkownika.
- **SCN-AUTH-011:** Próba dostępu do chronionej strony (`/recipes`) bez zalogowania (oczekiwane przekierowanie do `/auth/login`).
- **SCN-AUTH-012:** Dostęp do chronionej strony (`/recipes`) po pomyślnym zalogowaniu.

### 4.2. Dodawanie Przepisu (US-005 - US-011)

- **SCN-REC-ADD-001 (Tekst AI):** Pomyślna ekstrakcja danych z poprawnie sformatowanego, krótkiego tekstu przepisu.
- **SCN-REC-ADD-002 (Tekst AI):** Pomyślna ekstrakcja danych z długiego (blisko limitu 10000 znaków), złożonego tekstu przepisu.
- **SCN-REC-ADD-003 (Tekst AI):** Próba ekstrakcji z tekstu przekraczającego limit 10000 znaków (oczekiwany błąd walidacji).
- **SCN-REC-ADD-004 (Tekst AI):** Próba ekstrakcji z tekstu nie zawierającego przepisu (oczekiwany komunikat o błędzie parsowania lub puste pola).
- **SCN-REC-ADD-005 (Tekst AI):** Weryfikacja i edycja danych wyekstrahowanych przez AI, następnie pomyślny zapis przepisu.
- **SCN-REC-ADD-006 (Tekst AI):** Użycie opcji "Pokaż oryginalny tekst", edycja oryginalnego tekstu, następnie użycie "Przetwórz ponownie" i zapis.
- **SCN-REC-ADD-007 (Tekst AI):** Przesłanie pozytywnego/negatywnego feedbacku dotyczącego jakości parsowania.
- **SCN-REC-ADD-008 (URL AI):** Pomyślny import i ekstrakcja przepisu z URL `aniagotuje.pl`.
- **SCN-REC-ADD-009 (URL AI):** Pomyślny import i ekstrakcja przepisu z URL `kwestiasmaku.com`.
- **SCN-REC-ADD-010 (URL AI):** Próba importu z nieobsługiwanego URL (oczekiwany błąd).
- **SCN-REC-ADD-011 (URL AI):** Próba importu z nieistniejącego URL (oczekiwany błąd 404 od scrapera).
- **SCN-REC-ADD-012 (URL AI):** Weryfikacja i edycja danych zaimportowanych z URL, następnie pomyślny zapis przepisu.
- **SCN-REC-ADD-013 (Manualnie):** Pomyślne dodanie przepisu poprzez manualne wypełnienie wszystkich wymaganych pól.
- **SCN-REC-ADD-014 (Walidacja):** Próba zapisu formularza z brakującą nazwą potrawy (oczekiwany błąd walidacji).
- **SCN-REC-ADD-015 (Walidacja):** Próba zapisu formularza bez składników lub kroków (oczekiwany błąd walidacji).
- **SCN-REC-ADD-016 (Limit Ekstrakcji):** Próba ekstrakcji AI po przekroczeniu dziennego limitu (oczekiwany błąd 429).

### 4.3. Zarządzanie Przepisami (US-012 - US-015)

- **SCN-REC-MAN-001:** Wyświetlenie listy przepisów użytkownika (pusta lista dla nowego użytkownika).
- **SCN-REC-MAN-002:** Poprawne wyświetlanie licznika przepisów.
- **SCN-REC-MAN-003:** Sortowanie listy przepisów po dacie dodania (rosnąco/malejąco).
- **SCN-REC-MAN-004:** Sortowanie listy przepisów po nazwie (A-Z, Z-A).
- **SCN-REC-MAN-005:** Filtrowanie listy przepisów po jednym wybranym tagu.
- **SCN-REC-MAN-006:** Filtrowanie listy przepisów po wielu wybranych tagach (AND).
- **SCN-REC-MAN-007:** Wyczyść filtry tagów.
- **SCN-REC-MAN-008:** Wyświetlenie komunikatu "Brak wyników" po zastosowaniu filtrów, które nie zwracają żadnych przepisów.
- **SCN-REC-MAN-009:** Pomyślne wyświetlenie szczegółów istniejącego przepisu.
- **SCN-REC-MAN-010:** Pomyślna edycja wszystkich pól istniejącego przepisu.
- **SCN-REC-MAN-011:** Pomyślne usunięcie istniejącego przepisu po potwierdzeniu.
- **SCN-REC-MAN-012:** Anulowanie usuwania przepisu w oknie potwierdzenia.

### 4.4. Profil Użytkownika i Inne (US-016 - US-017)

- **SCN-PROF-001:** Poprawne wyświetlenie danych użytkownika (email, nazwa użytkownika, data dołączenia) na stronie profilu.
- **SCN-PROF-002:** Poprawne wyświetlenie całkowitej liczby przepisów użytkownika.
- **SCN-PROF-003:** Poprawne wyświetlenie wykorzystanego limitu ekstrakcji AI (np. 5/100) i paska postępu.
- **SCN-PROF-004:** Poprawne wyświetlenie informacji o dacie resetu limitu.
- **SCN-PROF-005:** Wyświetlenie komunikatu o przekroczeniu limitu, gdy `used >= limit`.
- **SCN-PROF-006:** Weryfikacja prywatności przepisów - użytkownik A nie widzi przepisów użytkownika B.

## 5. Środowisko testowe

1.  **Środowisko deweloperskie (lokalne):**
    - System operacyjny: Windows, macOS, Linux (zgodnie ze środowiskiem deweloperów).
    - Przeglądarki: Najnowsze wersje Chrome, Firefox.
    - Node.js: Wersja zdefiniowana w `.nvmrc` (22.14.0).
    - Lokalna instancja Supabase (CLI) z zainicjalizowaną bazą danych (migracje, seed data).
    - Skonfigurowane zmienne środowiskowe (`.env`) dla Supabase i Openrouter.ai (może być klucz testowy).
2.  **Środowisko testowe/stagingowe (zbliżone do produkcyjnego):**
    - Serwer: DigitalOcean (lub analogiczny).
    - Baza danych: Dedykowana instancja Supabase (Cloud) z kopią struktury produkcyjnej i danymi testowymi.
    - Skonfigurowane zmienne środowiskowe dla tego środowiska.
    - Dostęp przez dedykowany URL (subdomena).
    - Przeglądarki: Najnowsze wersje Chrome, Firefox, Safari, Edge.
3.  **Środowisko produkcyjne:**
    - Ograniczone testy typu "smoke tests" po każdym wdrożeniu.
    - Monitorowanie logów i metryk.

Dane testowe będą obejmować:

- Zestaw kont użytkowników z różnymi uprawnieniami (standardowy, admin - jeśli dotyczy).
- Zestaw przykładowych przepisów tekstowych o różnym stopniu złożoności i sformatowania.
- Listę URL do testowania importu z aniagotuje.pl i kwestiasmaku.com.
- Dane do testowania przypadków brzegowych (puste pola, zbyt długie teksty, specjalne znaki).

## 6. Narzędzia do testowania

- **Testy Jednostkowe:**
  - Frontend (React, utils): Vitest z React Testing Library.
  - Backend (Astro API, services): Vitest.
- **Testy Integracyjne:**
  - Frontend/Backend: Vitest z mniejszym mockowaniem, ewentualnie z wykorzystaniem MSW (Mock Service Worker) do mockowania API.
  - Baza danych: Testy funkcji Supabase przy użyciu narzędzi do testowania SQL lub skryptów.
- **Testy E2E:**
  - Playwright.
- **Testy API:**
  - Postman (dla manualnych testów i eksploracji).
  - Playwright (dla zautomatyzowanych testów API).
- **Testy Wydajnościowe:**
  - k6, Apache JMeter (dla testów obciążeniowych API).
  - Lighthouse, WebPageTest (dla analizy wydajności frontendowej).
- **Testy Bezpieczeństwa:**
  - Podstawowe skanowanie: OWASP ZAP.
  - Manualna weryfikacja RLS w Supabase Studio.
- **Zarządzanie Testami i Błędami:**
  - GitHub Issues (do śledzenia błędów i zadań testowych).
  - Opcjonalnie: TestRail, Xray (jeśli projekt urośnie).
- **CI/CD:**
  - GitHub Actions (do automatycznego uruchamiania testów przy każdym push/PR).

## 7. Harmonogram testów

Harmonogram testów będzie zintegrowany z cyklem rozwoju aplikacji (MVP).

1.  **Faza 1: Rozwój podstawowych modułów (Autentykacja, API Przepisów, Podstawowy Formularz)**
    - Testy jednostkowe i integracyjne: Równolegle z implementacją przez deweloperów.
    - Testy API: Po zakończeniu implementacji każdego endpointu.
    - Testy E2E (scenariusze logowania, dodawania manualnego): Po zintegrowaniu podstawowych komponentów.
2.  **Faza 2: Implementacja funkcjonalności AI (Ekstrakcja z Tekstu i URL)**
    - Testy jednostkowe dla serwisów AI.
    - Testy integracyjne z Openrouter.ai (z mockowaniem i realnymi wywołaniami na testowym kluczu).
    - Testy API dla endpointów ekstrakcji.
    - Testy E2E dla scenariuszy dodawania przepisów z AI.
3.  **Faza 3: Implementacja UI (Lista przepisów, Profil, Sidebar)**
    - Testy jednostkowe i integracyjne komponentów React.
    - Testy E2E dla przepływów związanych z listą i profilem.
4.  **Faza 4: Testy Systemowe i Akceptacyjne**
    - Kompleksowe testy E2E wszystkich kluczowych przepływów.
    - Testy wydajnościowe (podstawowe).
    - Testy bezpieczeństwa (podstawowe).
    - Testy użyteczności.
    - Testy kompatybilności.
    - UAT (User Acceptance Testing) - jeśli dotyczy.
5.  **Faza 5: Testy Regresji**
    - Przed każdym wydaniem/wdrożeniem na produkcję.
    - Po każdej istotnej poprawce błędów.

Każdy sprint/iteracja deweloperska powinna kończyć się cyklem testów odpowiednich dla zaimplementowanych funkcjonalności.

## 8. Kryteria akceptacji testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów)

- Dostępna jest stabilna wersja aplikacji (build) w dedykowanym środowisku testowym.
- Wszystkie kluczowe funkcjonalności przewidziane do testowania w danym cyklu są zaimplementowane.
- Dostępna jest dokumentacja techniczna i funkcjonalna (np. PRD, API plan).
- Środowisko testowe jest skonfigurowane i dostępne (baza danych, serwisy zewnętrzne).
- Kryteria zakończenia poprzedniej fazy testów zostały spełnione.

### 8.2. Kryteria Wyjścia (Zakończenia Testów)

- Pokrycie kodu testami jednostkowymi wynosi co najmniej 70%.
- Wszystkie zdefiniowane przypadki testowe dla krytycznych i wysokich priorytetów funkcjonalności zostały wykonane i zakończyły się sukcesem (100% pass).
- Co najmniej 95% wszystkich zdefiniowanych przypadków testowych zakończyło się sukcesem.
- Brak otwartych błędów o statusie krytycznym (`Critical`) lub wysokim (`High`).
- Wszystkie zidentyfikowane błędy o średnim (`Medium`) priorytecie zostały przeanalizowane i podjęto decyzję co do ich rozwiązania (naprawione, odroczone, zaakceptowane ryzyko).
- Spełnione zostały kluczowe metryki sukcesu zdefiniowane w PRD:
  - AI Parsing Accuracy (tekst): 70%+ poprawnych pól dla dobrze sformatowanych przepisów.
  - URL Import Success: 80%+ udanych importów z aniagotuje.pl i kwestiasmaku.com.
  - Użyteczność: Użytkownicy mogą pomyślnie wykonać kluczowe zadania (dodanie 10+ przepisów różnymi metodami, zarządzanie nimi).
- Wyniki testów wydajnościowych i bezpieczeństwa mieszczą się w akceptowalnych granicach (jeśli zdefiniowano konkretne progi).
- Raport z testów został przygotowany i zaakceptowany przez interesariuszy.
- (Jeśli dotyczy) Testy akceptacyjne użytkownika (UAT) zakończyły się pomyślnie.

## 9. Role i odpowiedzialności w procesie testowania

- **Inżynier QA (Odpowiedzialny za ten plan):**
  - Tworzenie i aktualizacja planu testów.
  - Projektowanie i dokumentowanie przypadków testowych.
  - Wykonywanie testów manualnych (funkcjonalnych, eksploracyjnych, użyteczności).
  - Automatyzacja testów (E2E, API, regresji).
  - Raportowanie i śledzenie błędów.
  - Przygotowywanie raportów z testów.
  - Współpraca z deweloperami w celu rozwiązywania problemów.
  - Koordynacja testów UAT (jeśli dotyczy).
- **Deweloperzy:**
  - Pisanie testów jednostkowych i integracyjnych dla swojego kodu.
  - Naprawianie błędów zgłoszonych przez QA.
  - Uczestnictwo w przeglądach kodu pod kątem testowalności.
  - Utrzymanie środowiska deweloperskiego i wsparcie przy konfiguracji środowiska testowego.
- **Product Owner / Manager Projektu:**
  - Definiowanie wymagań i kryteriów akceptacji.
  - Priorytetyzacja testów i błędów.
  - Udział w testach akceptacyjnych użytkownika (UAT).
  - Podejmowanie decyzji o wydaniu produktu na podstawie wyników testów.
- **Użytkownicy (Beta Testerzy - opcjonalnie):**
  - Udział w testach UAT, dostarczanie feedbacku z perspektywy końcowego użytkownika.

## 10. Procedury raportowania błędów

1.  **Narzędzie do śledzenia błędów:** GitHub Issues.
2.  **Tworzenie zgłoszenia błędu:** Każdy zidentyfikowany błąd powinien zostać zgłoszony jako nowy Issue.
3.  **Elementy zgłoszenia błędu:**
    - **Tytuł:** Krótki, zwięzły opis problemu.
    - **Kroki do reprodukcji:** Szczegółowa, numerowana lista kroków potrzebnych do odtworzenia błędu.
    - **Wynik oczekiwany:** Opis, jak system powinien się zachować.
    - **Wynik rzeczywisty:** Opis, jak system faktycznie się zachował.
    - **Środowisko:** Wersja aplikacji, przeglądarka (wersja), system operacyjny, URL (jeśli dotyczy).
    - **Priorytet:** (np. Krytyczny, Wysoki, Średni, Niski) - określający wpływ błędu na działanie aplikacji.
    - **Dotkliwość (Severity):** (np. Krytyczna, Duża, Średnia, Mała) - określająca techniczny wpływ błędu.
    - **Załączniki:** Screenshoty, nagrania wideo, logi konsoli/sieciowe (jeśli pomocne).
    - **Etykiety (Labels):** np. `bug`, `ui`, `api`, `auth`, `ai-extraction`, nazwa modułu.
    - **Przypisanie (Assignee):** Początkowo może być nieprzypisany lub przypisany do lidera zespołu/QA.
4.  **Cykl życia błędu:**
    - **Nowy (New/Open):** Błąd zgłoszony i oczekujący na analizę.
    - **Potwierdzony (Confirmed/Accepted):** Błąd został zreprodukowany i potwierdzony przez QA/dewelopera.
    - **W trakcie (In Progress):** Deweloper pracuje nad naprawą błędu.
    - **Rozwiązany (Resolved/Fixed):** Deweloper zaimplementował poprawkę i jest ona gotowa do weryfikacji.
    - **Do weryfikacji (Ready for QA/To Verify):** Błąd oczekuje na ponowne przetestowanie przez QA.
    - **Zamknięty (Closed):** Błąd został zweryfikowany przez QA i potwierdzono jego naprawę.
    - **Otwarty ponownie (Reopened):** Błąd nie został poprawnie naprawiony i wymaga dalszych prac.
    - **Odrzucony (Rejected/Won't Fix):** Błąd nie jest defektem, działa zgodnie ze specyfikacją lub jego naprawa nie jest planowana.
5.  **Regularne przeglądy błędów:** Spotkania zespołu w celu omówienia statusu błędów, ich priorytetyzacji i planowania napraw.
    </plan_testów>
