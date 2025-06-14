# Dokumentacja Testowania - AI Recipe Keeper

## Przegląd

Projekt wykorzystuje dwa główne narzędzia testowe:

- **Vitest** - testy jednostkowe i integracyjne
- **Playwright** - testy E2E (end-to-end)

## Instalacja pakietów testowych

```bash
# Pakiety dla testów jednostkowych
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react

# Pakiety dla testów E2E
npm install --save-dev @playwright/test

# Inicjalizacja Playwright
npx playwright install
```

## Konfiguracja

### Vitest (Testy jednostkowe)

Konfiguracja znajduje się w `vitest.config.ts`:

- Środowisko: jsdom (dla testów komponentów React)
- Setup: `src/test/setup.ts` (globalne mocki i matchers)
- Coverage: v8 provider z progami 80%
- Aliasy: @, @/components, @/lib, @/types

### Playwright (Testy E2E)

Konfiguracja znajduje się w `playwright.config.ts`:

- Browser: Tylko Chromium (Desktop Chrome)
- Katalog testów: `./e2e`
- Page Object Model: `e2e/pages/`
- Autentyfikacja: `e2e/setup/auth.setup.ts`

## Uruchamianie testów

### Testy jednostkowe

```bash
# Uruchom testy w trybie watch
npm run test

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy jednokrotnie
npm run test:run

# Uruchom testy z pokryciem kodu
npm run test:coverage

# Uruchom testy w trybie watch (jawnie)
npm run test:watch
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run e2e

# Uruchom testy z interfejsem UI
npm run e2e:ui

# Uruchom testy w trybie headed (widoczna przeglądarka)
npm run e2e:headed

# Debugowanie testów
npm run e2e:debug

# Generator testów (codegen)
npm run e2e:codegen

# Uruchom wszystkie testy (jednostkowe + E2E)
npm run test:all
```

## Struktura katalogów

```
├── src/
│   ├── test/
│   │   └── setup.ts                 # Setup dla testów jednostkowych
│   ├── components/
│   │   └── __tests__/              # Testy komponentów
│   │       └── Button.test.tsx
│   └── lib/
│       └── __tests__/              # Testy funkcji pomocniczych
│           └── utils.test.ts
├── e2e/
│   ├── pages/                      # Page Object Model
│   │   ├── BasePage.ts
│   │   └── HomePage.ts
│   ├── setup/                      # Setup dla E2E
│   │   └── auth.setup.ts
│   └── tests/                      # Testy E2E
│       └── home.spec.ts
├── vitest.config.ts                # Konfiguracja Vitest
└── playwright.config.ts            # Konfiguracja Playwright
```

## Zmienne środowiskowe dla testów

Stwórz plik `.env.test` z następującymi zmiennymi:

```bash
# Dane testowego użytkownika
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# URL aplikacji
TEST_BASE_URL=http://localhost:4321
```

## Wzorce testowe

### Testy jednostkowe z Vitest

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { expect, test, describe } from 'vitest'

describe('Component', () => {
  test('should render correctly', () => {
    render(<Component />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('should handle click', () => {
    const handleClick = vi.fn()
    render(<Component onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testy E2E z Playwright

```typescript
import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

test("should load home page", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.expectNavigationToBeVisible();
  await expect(page).toHaveScreenshot("home-page.png");
});
```

## Najlepsze praktyki

### Vitest

- Używaj `vi.fn()` do mockowania funkcji
- Wykorzystuj `vi.spyOn()` do monitorowania istniejących funkcji
- Grupuj testy w `describe` bloki
- Używaj inline snapshots dla assertion
- Mockuj API calls z `vi.mock()`

### Playwright

- Używaj Page Object Model
- Zawsze dodawaj `data-testid` do elementów
- Wykorzystuj visual regression testing
- Testuj na różnych rozmiarach ekranu
- Używaj `expect(page).toHaveScreenshot()` do porównań wizualnych

## CI/CD

Testy są zintegrowane z pipeline CI/CD:

- Testy jednostkowe uruchamiają się przy każdym commit
- Testy E2E uruchamiają się przed deployment
- Wyniki testów są zapisywane w `test-results/`

## Debugging

### Vitest

```bash
# UI mode
npm run test:ui

# Watch mode z filtrowaniem
npm run test:watch -- --grep "Button"
```

### Playwright

```bash
# Debug mode
npm run e2e:debug

# Trace viewer
npx playwright show-trace trace.zip

# Codegen dla tworzenia nowych testów
npm run e2e:codegen
```
