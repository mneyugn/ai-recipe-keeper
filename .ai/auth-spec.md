# Specyfikacja techniczna modułu autentykacji użytkowników

**Dokument odnosi się do wymagań z PRD (US-001 – US-004) oraz stosu technologicznego Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Supabase Auth. Opisuje strukturę kodu, podział odpowiedzialności i kluczowe scenariusze.**

---

## 1. Architektura interfejsu użytkownika

### 1.1 Strony Astro (warstwa routingu i SSR)

| Ścieżka               | Plik                                 | Layout             | Cel                                                        |
| --------------------- | ------------------------------------ | ------------------ | ---------------------------------------------------------- |
| `/auth/login`         | `src/pages/auth/login.astro`         | `AuthLayout.astro` | Formularz logowania                                        |
| `/auth/register`      | `src/pages/auth/register.astro`      | `AuthLayout.astro` | Formularz rejestracji                                      |
| `/auth/reset`         | `src/pages/auth/reset.astro`         | `AuthLayout.astro` | Formularz inicjacji resetu hasła                           |
| `/auth/reset/[token]` | `src/pages/auth/reset/[token].astro` | `AuthLayout.astro` | Ustawienie nowego hasła na podstawie linku z e-maila       |
| `/logout`             | `src/pages/logout.astro`             | brak               | Wywołanie akcji `signOut` i przekierowanie do `auth/login` |

Uwagi:

1. Adresacja `/auth/...` skupia wszystkie ekrany związane z autentykacją w jednym miejscu.
2. Każda strona Astro odpowiada za:
   • pobranie bieżącej sesji z `context.locals.session` (jeśli istnieje),
   • SSR minimalnych danych (np. flaga `error` przekazana query stringiem),
   • import odpowiedniego komponentu React (Client-only) z formularzem.

### 1.2 Layouty Astro

`src/layouts/AuthLayout.astro`
• Prosty, zcentralizowany kontener (max-width, cieniowanie),
• Header z logo + przełącznik do innej ścieżki (np. _Masz konto? Zaloguj się_ / _Nie masz konta? Zarejestruj się_),
• Brak nawigacji głównej aplikacji.

`src/layouts/AppLayout.astro`
• Istniejący lub nowy layout dla części zalogowanej (lista przepisów itp.),
• W nagłówku widoczny avatar/nazwa + przycisk **Wyloguj** (link do `/logout`).

### 1.3 Komponenty React (Client-side)

Struktura: `src/components/auth/`

| Komponent           | Plik                    | Odpowiedzialność                                                                                                                                           |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoginForm`         | `LoginForm.tsx`         | 1) Kontrola pól `email`, `password`; 2) client-side walidacja; 3) wywołanie `authService.login`; 4) obsługa błędów; 5) nawigacja do `/recipes` po sukcesie |
| `RegisterForm`      | `RegisterForm.tsx`      | 1) Kontrola pól `email`, `password`, `confirmPassword`; 2) client-side walidacja; 3) wywołanie `authService.register`                                      |
| `ResetRequestForm`  | `ResetRequestForm.tsx`  | wprowadzenie e-maila, wywołanie `authService.requestReset`; komunikat "Sprawdź skrzynkę"                                                                   |
| `ResetPasswordForm` | `ResetPasswordForm.tsx` | pola `newPassword/confirm`; `authService.confirmReset` z tokenem z URL                                                                                     |
| `AuthErrorAlert`    | `AuthErrorAlert.tsx`    | komponent prezentujący komunikaty błędów w ustandaryzowany sposób                                                                                          |

Walidacja: biblioteka [`valibot`](https://github.com/fabian-hiller/valibot) lub `zod`.
• email – poprawny format, wymagany przy rejestracji i resetowaniu hasła,
• password – min. 8 znaków,
• confirmPassword – zgodne z `password`.

Błędy wyświetlane inline przy polach + globalny `AuthErrorAlert`.

### 1.4 Scenariusze UI

1. **Rejestracja sukces** → automatycznie zaloguj użytkownika, redirect `/recipes`.
2. **Rejestracja błędna** (użyty e-mail/nazwa, słabe hasło) → czerwone komunikaty z Supabase (`User already registered` etc.).
3. **Logowanie niepoprawne** → komunikat "Nieprawidłowe dane logowania".
4. **Reset hasła – brak e-maila** → "Nie znaleziono konta".
5. **Reset link expired** → strona `/auth/reset/[token]` wyświetla info "Link wygasł, wygeneruj nowy".
6. **Wylogowanie** → czyszczenie sesji, redirect `/auth/login`.
7. **Link "Zapomniałem hasła?"** → przekierowanie do `/auth/reset`.

---

## 2. Logika backendowa (warstwa server-side)

### 2.1 Warstwa API (`src/pages/api/auth/*`)

Chociaż większość operacji realizuje Supabase po stronie klienta, dodajemy cienką warstwę proxy ze względów bezpieczeństwa oraz by umożliwić ewentualne rozszerzenia (np. logi audytu):

| Endpoint                  | Metoda | Plik               | Input                    | Output              |
| ------------------------- | ------ | ------------------ | ------------------------ | ------------------- |
| `/api/auth/login`         | POST   | `login.ts`         | `{ email, password }`    | `{ session, user }` |
| `/api/auth/register`      | POST   | `register.ts`      | `{ email, password }`    | `{ session, user }` |
| `/api/auth/reset`         | POST   | `reset.ts`         | `{ email }`              | `{ message }`       |
| `/api/auth/reset/confirm` | POST   | `reset-confirm.ts` | `{ token, newPassword }` | `{ message }`       |
| `/api/auth/logout`        | POST   | `logout.ts`        | brak                     | `{ message }`       |

Każdy plik:

1. Tworzy serwerowego klienta Supabase poprzez `createServerClient(context)` z biblioteki `@supabase/auth-helpers-astro` (dostęp do cookies + nagłówków).
2. Waliduje `req.body` przy pomocy tego samego schematu co na froncie.
3. Wywołuje odpowiednią metodę Supabase (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser` itd.).
4. Zwraca JSON lub status 4xx z opisową wiadomością.
5. Łapie i loguje wyjątki (np. `console.error` + dedykowany logger w `src/lib/services/logger.ts`).

### 2.2 Middleware sesji

Aktualizujemy `src/middleware/index.ts`:

```ts
import { defineMiddleware } from "astro:middleware";
import { createMiddlewareClient } from "@supabase/auth-helpers-astro";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createMiddlewareClient(context, {
    supabaseUrl: import.meta.env.SUPABASE_URL,
    supabaseKey: import.meta.env.SUPABASE_KEY,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  context.locals.supabase = supabase;
  context.locals.session = session;

  return next();
});
```

Korzyści: dostęp do bieżącego użytkownika w każdej stronie Astro oraz możliwość SSR chronionych widoków.

### 2.3 Ochrona routingu

Dodajemy pomocniczą funkcję `requireAuth(c: APIContext)` w `src/lib/services/auth-guard.ts`:

```ts
export function requireAuth(context: APIContext) {
  if (!context.locals.session) {
    return context.redirect("/auth/login");
  }
}
```

Stosowana w stronach, np. w `src/pages/recipes/index.astro` na początku pliku:

```ts
---
import { requireAuth } from "@/lib/services/auth-guard";
requireAuth(Astro);
---
```

---

## 3. System autentykacji (Supabase Auth × Astro)

### 3.1 Konfiguracja Supabase

1. W projekcie Supabase włączone **Session Persistence = "All"**.
2. Adresy URL Redirect:
   • `http://localhost:3000/auth/reset/*` (dev),
   • `https://YOUR_DOMAIN.com/auth/reset/*` (prod).
3. Anon key i URL już są w env (`SUPABASE_URL`, `SUPABASE_KEY`). Dodajemy `SUPABASE_SERVICE_ROLE_KEY` tylko na serwerze, jeżeli w przyszłości potrzebne operacje o wyższym poziomie uprawnień.

### 3.2 Serwis kliencki

`src/lib/services/auth.service.ts` (API wrapper używany przez komponenty React):

```ts
export const authService = {
  login: async (credentials) => fetchJson("/api/auth/login", credentials),
  register: async (data) => fetchJson("/api/auth/register", data),
  requestReset: async (data) => fetchJson("/api/auth/reset", data),
  confirmReset: async (data) => fetchJson("/api/auth/reset/confirm", data),
  logout: async () => fetchJson("/api/auth/logout"),
};
```

Wspólny util `fetchJson` obsługuje timeout, JSON headers, oraz przekierowania 401 → `/auth/login`.

### 3.3 Przechowywanie sesji

Supabase ustawia cookie `sb:token` (lub podobne). Dzięki `auth-helpers-astro` po stronie serwera mamy dostęp do sesji, a po stronie React — do lightweight klienta `createBrowserClient()` (import w komponentach jeśli potrzebne).

### 3.4 Reset hasła

• `authService.requestReset` wywołuje `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${ORIGIN}/auth/reset` })`.
• Po kliknięciu linku w e-mailu Supabase przekieruje do `/auth/reset?access_token=XXX&refresh_token=YYY`.
• `/auth/reset/[token].astro` wyciąga tokeny z query params, ustawia sesję przez `supabase.auth.setSession`, następnie `authService.confirmReset` ustawia nowe hasło.

---

## 4. Walidacja i obsługa błędów

1. Walidacja front + back przy pomocy jednolitych schematów (`valibot`).
2. Mapowanie kodów błędów Supabase na przyjazne komunikaty (util `mapSupabaseError(code)` w `src/lib/services/auth.errors.ts`).
3. Globalny handler `onError` w formularzach React → prezentacja `AuthErrorAlert`.
4. Middleware 401 → przekierowanie do `/auth/login` z `redirectTo` w query string dla płynnego powrotu.

---

## 5. Zmiany w strukturze katalogów

```
src/
  layouts/
    AuthLayout.astro
  pages/
    auth/
      login.astro
      register.astro
      reset.astro
      reset/[token].astro
    logout.astro
    api/
      auth/
        login.ts
        register.ts
        reset.ts
        reset-confirm.ts
        logout.ts
  components/
    auth/
      LoginForm.tsx
      RegisterForm.tsx
      ResetRequestForm.tsx
      ResetPasswordForm.tsx
      AuthErrorAlert.tsx
  lib/
    services/
      auth.service.ts
      auth-guard.ts
      auth.errors.ts
      logger.ts
```

---

## 6. Testy i kontrola jakości

1. Testy jednostkowe schematów walidacji (`vitest`).
2. Testy integracyjne endpointów API (mock Supabase).
3. Testy E2E (Playwright):
   • Rejestracja nowego użytkownika,
   • Niedozwolone logowanie → komunikat,
   • Reset hasła – pełny flow,
   • Wylogowanie i próba wejścia na `/recipes` → redirect.

---

## 7. Wymagania bezpieczeństwa

• Wymuszamy HTTPS w `production`.
• Cookie `Secure`, `SameSite=Lax`.
• Brak przechowywania haseł w logach.
• Limit prób logowania (nadbudowa w przyszłości – poza MVP, patrz PRD).

---

## 8. Kluczowe wnioski

1. Supabase Auth w połączeniu z `@supabase/auth-helpers-astro` zapewnia spójny mechanizm sesji zarówno na serwerze (SSR), jak i w przeglądarce.
2. Oddzielenie formularzy (React) od stron (Astro) pozwala wykorzystać zalety obydwu technologii: SSR dla SEO i szybszego pierwszego ładowania, RSC dla bogatej interakcji i walidacji w czasie rzeczywistym.
3. Warstwa API jest cienka, ale zostawia miejsce na audyt, rate-limiting czy dodatkowe logiki biznesowe bez ingerencji w komponenty UI.
4. Przyjęta struktura katalogów jest zgodna z istniejącymi standardami projektu i nie koliduje z bieżącą implementacją funkcji przepisów.
