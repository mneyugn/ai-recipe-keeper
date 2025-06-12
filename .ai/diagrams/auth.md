<authentication_analysis>

1. Główne przepływy autentykacji:
   • Logowanie (email/username + hasło) z automatycznym zalogowaniem.
   • Rejestracja nowego użytkownika (tworzy konto i loguje).
   • Reset hasła – inicjacja (email) i potwierdzenie (zmiana hasła).
   • Wylogowanie (unieważnienie sesji).
   • Dostęp do chronionych stron (guard + middleware).
   • Odświeżanie tokenu (access ↔ refresh) zarządzane przez Supabase.

2. Aktorzy i interakcje:
   • Browser – formularze React, supabase-js, pliki cookie.
   • API – endpointy Astro `/api/auth/*`, proxy do Supabase Auth.
   • Middleware – `src/middleware/index.ts`, dodaje `locals.session`.
   • Auth – usługa Supabase Auth (weryfikacja, sesje, e-maile).
   • Opcjonalnie Mail – serwer pocztowy obsługujący link resetu.

3. Weryfikacja i odświeżanie tokenów:
   • Po pomyślnym logowaniu/odświeżeniu Auth zwraca
   `access_token` (JWT, ~1h) i `refresh_token` (długi).
   • Cookie ustawiane przez API są odczytywane przez supabase-js
   po stronie klienta oraz przez Middleware po stronie serwera.
   • Przy każdym SSR `middleware` wywołuje `auth.getSession()`,
   co w razie potrzeby automatycznie odświeża token.
   • Gdy odświeżenie nie powiedzie się (revoked/expired), guard
   przekierowuje do `/auth/login`.

4. Kroki autentykacji (skrót):
   a. Login: Browser → API → Auth ✅ sesja → cookie → redirect.
   b. Register: Browser → API → Auth (signUp) ✅ sesja → cookie.
   c. Reset start: Browser → API → Auth (resetPasswordForEmail) →
   Mail → użytkownik.
   d. Reset confirm: Browser (z tokenami) → API → Auth (update pwd)
   ✅ nowa sesja.
   e. Logout: Browser → API → Auth (signOut) → czyszczenie cookie.
   f. Guard: Browser → Middleware → Auth (getSession) • redirect.
   </authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
  autonumber
  participant Browser
  participant API
  participant Middleware
  participant Auth as "Supabase Auth"
  %% LOGIN FLOW
  Note over Browser,API: Logowanie
  Browser->>API: POST /api/auth/login (email, pwd)
  activate API
  API->>Auth: signInWithPassword
  activate Auth
  Auth-->>API: session{access,refresh}
  deactivate Auth
  API-->>Browser: 200 + Set-Cookie
  deactivate API
  Browser->>Browser: redirect /recipes
  %% PROTECTED SSR REQUEST
  Note over Browser,Middleware: Dostęp do /recipes
  Browser->>Middleware: GET /recipes
  activate Middleware
  Middleware->>Auth: getSession(cookie)
  activate Auth
  Auth-->>Middleware: session / null
  deactivate Auth
  alt Sesja OK
    Middleware-->>Browser: HTML 200 (Recipes page)
  else Brak sesji
    Middleware-->>Browser: 302 /auth/login
  end
  deactivate Middleware
  %% TOKEN AUTO-REFRESH (CLIENT)
  Note over Browser,Auth: Odświeżenie tokenu
  Browser->>Auth: refreshToken (auto supabase-js)
  activate Auth
  Auth-->>Browser: new access_token
  deactivate Auth
  %% LOGOUT
  Note over Browser,API: Wylogowanie
  Browser->>API: POST /api/auth/logout
  activate API
  API->>Auth: signOut
  Auth-->>API: 200 OK
  API-->>Browser: clear cookie + 302 /auth/login
  deactivate API
  %% RESET PASSWORD
  Note over Browser,API: Reset hasła (inicjacja)
  Browser->>API: POST /api/auth/reset (email)
  API->>Auth: resetPasswordForEmail
  Auth-->>API: 200 OK (mail sent)
  API-->>Browser: info "Sprawdź skrzynkę"
  %% RESET CONFIRM
  Note over Browser,API: Reset hasła (potwierdzenie)
  Browser->>API: POST /api/auth/reset/confirm
  API->>Auth: updateUser(password)
  Auth-->>API: new session
  API-->>Browser: 200 OK + Set-Cookie
```

</mermaid_diagram>
