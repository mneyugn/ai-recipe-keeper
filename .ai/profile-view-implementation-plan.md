# Plan implementacji widoku Profil Użytkownika

## 1. Przegląd

Widok Profil Użytkownika (`/profile`) umożliwia zalogowanym użytkownikom przeglądanie informacji o swoim koncie, w tym danych personalnych, statystyk związanych z liczbą przepisów oraz limitów ekstrakcji AI. Widok oferuje również możliwość wylogowania z aplikacji. Głównym celem jest dostarczenie przejrzystego przeglądu stanu konta użytkownika z uwzględnieniem limitów korzystania z funkcji AI.

## 2. Routing widoku

**Ścieżka:** `/profile`
**Typ:** Strona chroniona - dostępna tylko dla zalogowanych użytkowników
**Implementacja:** `src/pages/profile.astro`
**Middleware:** Wymagana autoryzacja użytkownika przez `src/middleware/index.ts`

## 3. Struktura komponentów

```
ProfilePage (src/pages/profile.astro)
├── Layout (src/layouts/BaseLayout.astro)
├── ProfileHeader (React component)
├── UserInfoSection (React component)
│   └── UserInfoCard (React component)
├── ExtractionLimitSection (React component)
│   └── ExtractionLimitCard (React component)
├── ActionsSection (React component)
│   └── LogoutButton (React component)
└── Toast (shadcn/ui) - dla powiadomień
```

## 4. Szczegóły komponentów

### ProfilePage (`src/pages/profile.astro`)

- **Opis komponentu:** Główna strona profilu użytkownika w Astro, która grupuje wszystkie sekcje profilu
- **Główne elementy:** Layout, React component z logiką profilu, middleware dla autoryzacji
- **Obsługiwane zdarzenia:** Ładowanie strony, autoryzacja użytkownika
- **Obsługiwana walidacja:** Sprawdzenie czy użytkownik jest zalogowany
- **Typy:** Brak bezpośrednich propów (strona Astro)
- **Propsy:** Brak (strona główna)

### ProfileContainer (`src/components/ProfileContainer.tsx`)

- **Opis komponentu:** Główny kontener React zarządzający stanem i logiką profilu użytkownika
- **Główne elementy:** useUserProfile hook, obsługa stanów ładowania/błędów, renderowanie podkomponentów
- **Obsługiwane zdarzenia:** Ładowanie danych profilu, obsługa błędów, wylogowanie
- **Obsługiwana walidacja:** Sprawdzenie dostępności danych profilu
- **Typy:** ProfileViewState, UserProfileViewModel
- **Propsy:** Brak (komponent główny)

### UserInfoCard (`src/components/profile/UserInfoCard.tsx`)

- **Opis komponentu:** Karta wyświetlająca podstawowe informacje o użytkowniku
- **Główne elementy:** Card (shadcn/ui), wyświetlanie email, username, liczby przepisów
- **Obsługiwane zdarzenia:** Brak interakcji użytkownika
- **Obsługiwana walidacja:** Sprawdzenie obecności danych użytkownika
- **Typy:** UserInfoCardProps
- **Propsy:** `{ email: string; username: string; recipeCount: number; createdAt: string }`

### ExtractionLimitCard (`src/components/profile/ExtractionLimitCard.tsx`)

- **Opis komponentu:** Karta wyświetlająca informacje o limitach ekstrakcji AI z wizualnym paskiem postępu
- **Główne elementy:** Card (shadcn/ui), Progress (shadcn/ui), wyświetlanie użytych/dostępnych limitów, data resetu
- **Obsługiwane zdarzenia:** Brak interakcji użytkownika
- **Obsługiwana walidacja:** Sprawdzenie czy limit nie przekroczył 100%, walidacja formatu daty
- **Typy:** ExtractionLimitCardProps, ExtractionLimitInfo
- **Propsy:** `{ extractionLimit: ExtractionLimitInfo }`

### LogoutButton (`src/components/profile/LogoutButton.tsx`)

- **Opis komponentu:** Przycisk umożliwiający wylogowanie użytkownika z aplikacji
- **Główne elementy:** Button (shadcn/ui), stan ładowania podczas wylogowania
- **Obsługiwane zdarzenia:** onClick - wylogowanie użytkownika
- **Obsługiwana walidacja:** Sprawdzenie czy operacja wylogowania jest w toku
- **Typy:** LogoutButtonProps
- **Propsy:** `{ onLogout: () => Promise<void>; isLoading?: boolean }`

## 5. Typy

### ProfileViewState

```typescript
interface ProfileViewState {
  data: UserProfileViewModel | null;
  isLoading: boolean;
  error: string | null;
}
```

### UserProfileViewModel

```typescript
interface UserProfileViewModel {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  recipeCount: number;
  extractionLimit: ExtractionLimitInfo;
  memberSinceFormatted: string; // "Członek od: Styczeń 2024"
}
```

### ExtractionLimitInfo

```typescript
interface ExtractionLimitInfo {
  used: number;
  limit: number;
  date: string;
  percentageUsed: number; // used/limit * 100
  isLimitExceeded: boolean; // used >= limit
  resetDateFormatted: string; // "Limit odnawia się jutro" lub "Limit odnawia się 15.01.2024"
  daysTillReset: number;
}
```

### UserInfoCardProps

```typescript
interface UserInfoCardProps {
  email: string;
  username: string;
  recipeCount: number;
  memberSince: string;
}
```

### ExtractionLimitCardProps

```typescript
interface ExtractionLimitCardProps {
  extractionLimit: ExtractionLimitInfo;
}
```

### LogoutButtonProps

```typescript
interface LogoutButtonProps {
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}
```

## 6. Zarządzanie stanem

### Custom Hook: useUserProfile

```typescript
function useUserProfile(): {
  profile: UserProfileViewModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};
```

Logika:

- Pobiera dane z GET /api/users/profile przy pierwszym załadowaniu
- Transformuje UserProfileDTO na UserProfileViewModel
- Formatuje daty i oblicza procentowe użycie limitów
- Obsługuje stany ładowania i błędów
- Zapewnia możliwość ponownego pobrania danych

### Custom Hook: useLogout

```typescript
function useLogout(): {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};
```

Logika:

- Wykonuje wylogowanie użytkownika
- Czyści dane sesji/tokeny
- Przekierowuje na stronę logowania
- Obsługuje błędy podczas wylogowania

## 7. Integracja API

### GET /api/users/profile

- **Typ żądania:** Brak body, autoryzacja w nagłówkach
- **Typ odpowiedzi:** `UserProfileDTO`
- **Obsługa błędów:** 401 (Unauthorized), 500 (Internal Server Error)
- **Transformacja danych:** UserProfileDTO → UserProfileViewModel z dodatkowymi polami obliczeniowymi

### Logout API

- **Implementacja:** Poprzez Supabase auth lub custom endpoint
- **Obsługa:** Czyszczenie sesji, przekierowanie na `/login`

## 8. Interakcje użytkownika

### Wyświetlanie profilu

- **Akcja:** Wejście na `/profile`
- **Rezultat:** Automatyczne pobranie i wyświetlenie danych profilu
- **Stan ładowania:** Skeleton/spinner podczas pobierania danych
- **Obsługa błędów:** Wyświetlenie komunikatu błędu z możliwością ponowienia

### Wylogowanie

- **Akcja:** Kliknięcie przycisku "Wyloguj"
- **Rezultat:** Wylogowanie użytkownika i przekierowanie na stronę logowania
- **Stan ładowania:** Przycisk w stanie loading podczas operacji
- **Obsługa błędów:** Toast z komunikatem błędu, możliwość ponowienia

### Odświeżanie danych

- **Akcja:** Automatyczne odświeżanie przy powrocie na stronę
- **Rezultat:** Aktualne dane profilu i limitów
- **Stan ładowania:** Subtelny wskaźnik ładowania

## 9. Warunki i walidacja

### Autoryzacja

- **Warunek:** Użytkownik musi być zalogowany
- **Komponent:** Middleware sprawdza sesję przed renderowaniem
- **Reakcja:** Przekierowanie na `/login` jeśli nie zalogowany

### Dane profilu

- **Warunek:** Pomyślne pobranie danych z API
- **Komponent:** ProfileContainer sprawdza dostępność danych
- **Reakcja:** Wyświetlenie błędu lub stanu ładowania

### Limit ekstrakcji

- **Warunek:** Sprawdzenie czy limit nie został przekroczony
- **Komponent:** ExtractionLimitCard sprawdza used >= limit
- **Reakcja:** Wyświetlenie odpowiedniego komunikatu i koloru paska postępu

### Format daty

- **Warunek:** Poprawny format daty z API (ISO string)
- **Komponent:** Funkcje formatujące w UserProfileViewModel
- **Reakcja:** Wyświetlenie sformatowanej daty lub fallback

## 10. Obsługa błędów

### Błędy ładowania profilu

- **Typ:** 401 Unauthorized
- **Obsługa:** Automatyczne przekierowanie na `/login`
- **UI:** Brak widocznego błędu (redirect)

- **Typ:** 500 Internal Server Error
- **Obsługa:** Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie"
- **UI:** ErrorBoundary lub stan błędu w komponencie

- **Typ:** Network error
- **Obsługa:** Wyświetlenie komunikatu o problemach z połączeniem
- **UI:** Komunikat z możliwością manual refresh

### Błędy wylogowania

- **Obsługa:** Toast notification z komunikatem błędu
- **UI:** Przycisk wraca do normalnego stanu, możliwość ponowienia
- **Fallback:** Manual redirect do `/login` po określonym czasie

### Błędy transformacji danych

- **Obsługa:** Logging błędu, wyświetlenie części danych które się udało pobrać
- **UI:** Częściowe wyświetlenie profilu z komunikatem o niekompletnych danych

## 11. Kroki implementacji

1. **Utworzenie typu definitions**

   - Dodanie interfejsów ProfileViewState, UserProfileViewModel, ExtractionLimitInfo w `src/types.ts`
   - Dodanie props interfaces dla wszystkich komponentów

2. **Implementacja custom hooks**

   - Utworzenie `src/components/hooks/useUserProfile.ts`
   - Utworzenie `src/components/hooks/useLogout.ts`
   - Dodanie logiki pobierania danych i obsługi błędów

3. **Utworzenie utility functions**

   - Dodanie funkcji formatowania dat w `src/lib/utils.ts`
   - Dodanie funkcji transformacji UserProfileDTO → UserProfileViewModel

4. **Implementacja komponentów React**

   - Utworzenie `src/components/profile/UserInfoCard.tsx`
   - Utworzenie `src/components/profile/ExtractionLimitCard.tsx`
   - Utworzenie `src/components/profile/LogoutButton.tsx`

5. **Implementacja głównego kontenera**

   - Utworzenie `src/components/ProfileContainer.tsx`
   - Integracja wszystkich podkomponentów i hooks

6. **Utworzenie strony Astro**

   - Implementacja `src/pages/profile.astro`
   - Dodanie middleware autoryzacji
   - Integracja z ProfileContainer

7. **Dodanie stylingu**

   - Wykorzystanie Tailwind CSS classes
   - Konfiguracja responsywności
   - Dodanie animacji i transitions

8. **Testy i debugowanie**

   - Testowanie różnych stanów (loading, error, success)
   - Testowanie responsywności
   - Weryfikacja dostępności (screen readers, keyboard navigation)

9. **Integracja z routing**

   - Dodanie linków do profilu w nawigacji
   - Testowanie przekierowań i autoryzacji

10. **Optymalizacja i finalizacja**
    - Code review i refaktoryzacja
    - Optymalizacja wydajności
    - Dodanie dokumentacji komponentów
