# Testy E2E dla AI Recipe Keeper

## Konfiguracja

### Zmienne środowiskowe

Przed uruchomieniem testów, utwórz plik `.env.test` w głównym katalogu projektu:

```bash
# Dane testowego użytkownika do logowania
E2E_EMAIL=test@example.com
E2E_PASSWORD=testpassword123

# URL aplikacji (opcjonalnie)
E2E_BASE_URL=http://localhost:3000

# Timeout dla testów
E2E_TIMEOUT=30000
```

### Instalacja i uruchomienie

1. Zainstaluj zależności:

```bash
npm install
```

2. Uruchom aplikację w tle:

```bash
npm run dev
```

3. Uruchom testy e2e:

```bash
npm run test:e2e
```

## Struktura testów

### Logowanie (`auth.spec.ts`)

Testy obejmują:

#### Podstawowe funkcjonalności:

- ✅ Wyświetlanie formularza logowania
- ✅ Walidacja pustych pól
- ✅ Walidacja nieprawidłowego formatu email
- ✅ Walidacja zbyt krótkiego hasła
- ✅ Pomyślne logowanie z prawidłowymi danymi
- ✅ Wyświetlanie błędów dla nieprawidłowych danych
- ✅ Wyłączanie przycisku submit podczas wysyłania
- ✅ Przekierowanie do strony resetowania hasła

#### Zarządzanie sesją:

- ✅ Wylogowanie użytkownika
- ✅ Przekierowanie niezalogowanych do strony logowania
- ✅ Utrzymanie sesji po odświeżeniu strony
- ✅ Wylogowanie po wygaśnięciu sesji

#### Dostępność i UX:

- ✅ Nawigacja klawiaturą
- ✅ Wyświetlanie loading state podczas logowania

## Page Object Model

Testy używają wzorca Page Object Model dla lepszej organizacji:

- `LoginPage` - interakcje ze stroną logowania
- `RegisterPage` - interakcje ze stroną rejestracji
- `ResetRequestPage` - interakcje ze stroną resetowania hasła
- `BasePage` - wspólne funkcjonalności dla wszystkich stron

## Wymagania testowe

### Selektory data-testid

Aplikacja musi zawierać następujące selektory:

**Strona logowania:**

- `login-form` - formularz logowania
- `login-email-input` - pole email
- `login-password-input` - pole hasła
- `login-submit-button` - przycisk submit
- `login-forgot-password-link` - link resetowania hasła
- `login-email-error` - błąd pola email
- `login-password-error` - błąd pola hasła
- `auth-error-alert` - alert błędu uwierzytelniania
- `auth-error-message` - komunikat błędu

**Nawigacja:**

- `user-profile` - profil zalogowanego użytkownika
- `logout-button` - przycisk wylogowania

## Uruchamianie testów

### Wszystkie testy:

```bash
npm run test:e2e
```

### Testy w trybie headed (z interfejsem przeglądarki):

```bash
npm run test:e2e -- --headed
```

### Testy w trybie debug:

```bash
npm run test:e2e -- --debug
```

### Pojedynczy plik testowy:

```bash
npm run test:e2e -- auth.spec.ts
```

### Konkretny test:

```bash
npm run test:e2e -- --grep "powinno pomyślnie zalogować użytkownika"
```

## Raporty

Po uruchomieniu testów dostępne są:

- HTML Report: `playwright-report/index.html`
- JUnit XML: `test-results/junit.xml`
- JSON: `test-results/results.json`

## Debugowanie

1. **Trace Viewer**: Automatycznie generowany przy niepowodzeniu testu
2. **Screenshots**: Zapisywane przy błędach
3. **Video**: Nagrywane przy niepowodzeniu testów

## Najlepsze praktyki

1. **Używaj zmiennych środowiskowych** dla danych testowych
2. **Testuj na prawdziwych danych** ale w izolowanym środowisku
3. **Sprawdzaj loading states** i elementy UX
4. **Testuj dostępność** klawiaturową
5. **Używaj odpowiednich timeoutów** dla asynchronicznych operacji
6. **Cleanup** po testach jeśli modyfikują dane
