<architecture_analysis>

1. Komponenty odnalezione w codebase i specyfikacji:
   • LoginForm, RegisterForm, ResetRequestForm, ResetPasswordForm, AuthErrorAlert (React)
   • AuthLayout.astro, AppLayout.astro (Astro Layouts)
   • Strony Astro: /auth/login, /auth/register, /auth/reset, /auth/reset/[token], /logout, /recipes/_ (chronione), /profile (chroniona)
   • Middleware: src/middleware/index.ts (dodaje supabase + session)
   • Serwisy: auth.service.ts (klient), auth-guard.ts (SSR guard), logger.ts
   • API endpoints: /api/auth/_ (login, register, reset, reset-confirm, logout)
   • SupabaseClient (src/db/supabase.client.ts)
   • Istniejące strony korzystające z autentykacji: profile.astro, recipes/new.astro, recipes/[id]/edit.astro (TODO komentarze)

2. Mapa stron ↔ komponentów:
   • /auth/login → AuthLayout + <LoginForm />
   • /auth/register → AuthLayout + <RegisterForm />
   • /auth/reset → AuthLayout + <ResetRequestForm />
   • /auth/reset/[token] → AuthLayout + <ResetPasswordForm />
   • /logout → akcja serwerowa signOut + redirect
   • Strony chronione (/recipes/\*\*, /profile) używają AppLayout oraz guard requireAuth()

3. Przepływ danych (przykład logowania):
   LoginForm → walidacja client-side → auth.service.login (fetch POST /api/auth/login) → endpoint login.ts → Supabase signInWithPassword → cookie sesji → middleware zapisuje session → serwer zwraca JSON → LoginForm odbiera → Router przechodzi do /recipes.
   Analogiczny przepływ dla rejestracji (RegisterForm → signUp).

4. Opis funkcjonalności kluczowych komponentów:
   • LoginForm – zarządzanie stanem pól (email, hasło), walidacja, obsługa błędów, dispatch do API.
   • RegisterForm – zarządzanie stanem pól (email, hasło, confirmPassword), walidacja, obsługa błędów, dispatch do API.
   • AuthErrorAlert – prezentacja błędu;
   • AuthLayout – uproszczony layout bez głównej nawigacji;
   • AppLayout – layout z nawigacją i linkiem Wyloguj;
   • middleware/index – injekcja supabase i session do locals;
   • auth-guard – SSR redirect jeśli brak sesji;
   • Endpoints – cienka warstwa proxy do Supabase;
   • auth.service – abstrakcja fetch do API;
   </architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD
  %% LAYOUTS
  subgraph "Layouty"
    A1["AuthLayout.astro"]
    A2["AppLayout.astro"]
  end

  %% PAGES
  subgraph "Strony Astro"
    P1["/auth/login.astro"]
    P2["/auth/register.astro"]
    P3["/auth/reset.astro"]
    P4["/auth/reset/[token].astro"]
    P5["/logout.astro"]
    P6["Chronione: /recipes/*, /profile"]
  end

  %% REACT COMPONENTS
  subgraph "Komponenty React (Client-side)"
    C1["LoginForm"]
    C2["RegisterForm"]
    C3["ResetRequestForm"]
    C4["ResetPasswordForm"]
    C5["AuthErrorAlert"]
  end

  %% SERVICES & API
  subgraph "Warstwa Serwisów"
    S1["auth.service.ts"]
    S2["fetchJson util"]
  end

  subgraph "API Routes"
    API1["/api/auth/login"]
    API2["/api/auth/register"]
    API3["/api/auth/reset"]
    API4["/api/auth/reset/confirm"]
    API5["/api/auth/logout"]
  end

  subgraph "Backend & Infra"
    B1[("Supabase Auth")]
    B2["middleware/index.ts"]
    B3["auth-guard.ts"]
  end

  %% LAYOUT ↔ PAGES relationships
  A1 --> P1
  A1 --> P2
  A1 --> P3
  A1 --> P4
  P5 --- A1
  A2 --> P6

  %% PAGES ↔ COMPONENTS
  P1 --> C1
  P2 --> C2
  P3 --> C3
  P4 --> C4

  %% COMPONENTS ↔ ERROR ALERT
  C1 --> C5
  C2 --> C5
  C3 --> C5
  C4 --> C5

  %% CLIENT FLOW TO SERVICE
  C1 -->|"login()"| S1
  C2 -->|"register()"| S1
  C3 -->|"requestReset()"| S1
  C4 -->|"confirmReset()"| S1

  S1 --> S2
  S1 -->|"POST"| API1
  S1 -->|"POST"| API2
  S1 -->|"POST"| API3
  S1 -->|"POST"| API4
  S1 -->|"POST"| API5

  %% API to Supabase
  API1 --> B1
  API2 --> B1
  API3 --> B1
  API4 --> B1
  API5 --> B1

  %% Middleware session injection
  B1 --> B2
  B2 -->|"locals.session"| P6
  P6 --> B3
  B3 -->|"redirect /auth/login"| P1

  %% Logout flow
  P5 -->|"POST"| API5
  API5 -.-> B1
  API5 -->|"clear cookie"| B2
  P5 -->|"redirect"| P1

  classDef layout fill:#fef6d8,stroke:#333;
  classDef page fill:#d1e8ff,stroke:#333;
  classDef component fill:#e3ffe3,stroke:#333;
  classDef service fill:#ffd1dc,stroke:#333;
  classDef api fill:#ffe7cc,stroke:#333;
  classDef infra fill:#e5e5e5,stroke:#333;

  class A1,A2 layout;
  class P1,P2,P3,P4,P5,P6 page;
  class C1,C2,C3,C4,C5 component;
  class S1,S2 service;
  class API1,API2,API3,API4,API5 api;
  class B1,B2,B3 infra;
```

</mermaid_diagram>
