# 🎨 Dokumentacja Wdrożenia - Nowoczesny Sidebar

## 📋 Przegląd

Nowoczesny, responsywny sidebar dla AI RecipeKeeper zbudowany z wykorzystaniem:

- **React 19** - logika komponentów
- **TypeScript 5** - type safety
- **Tailwind 4** - stylowanie
- **Shadcn/ui** - komponenty UI
- **Lucide React** - ikony
- **Astro 5** - integracja z aplikacją

## 🏗️ Struktura Komponentów

```
src/
├── components/
│   ├── AppSidebar.tsx          # Główny komponent sidebara
│   ├── SidebarRenderer.tsx     # React renderer z state management
│   ├── SidebarIntegration.astro # Integracja z Astro
│   └── ui/                     # Shadcn/ui komponenty
├── layouts/
│   └── AppLayout.astro         # Layout z sidebajem
└── pages/
    └── demo-sidebar.astro      # Strona demonstracyjna
```

## 🚀 Instrukcje Wdrożenia

### 1. Instalacja Zależności

Komponenty zostały już zainstalowane:

- ✅ `sheet` - dla mobile overlay
- ✅ `avatar` - dla awatara użytkownika
- ✅ `dropdown-menu` - dla menu użytkownika
- ✅ `badge` - dla liczników
- ✅ `button` - dla przycisków
- ✅ `lucide-react` - dla ikon

### 2. Użycie w Aplikacji

#### Dla nowych stron:

```astro
---
import AppLayout from "../layouts/AppLayout.astro";
---

<AppLayout title="Tytuł Strony">
  <h1>Twoja treść</h1>
  <!-- Sidebar będzie automatycznie dodany -->
</AppLayout>
```

#### Dla istniejących stron:

```astro
<!-- Przed -->
<Layout title="Przepisy">
  <div>Treść</div>
</Layout>

<!-- Po -->
<AppLayout title="Przepisy">
  <div>Treść</div>
</AppLayout>
```

### 3. Konfiguracja API Endpoints

Sidebar wymaga następujących endpointów:

```typescript
// GET /api/users/profile
interface UserProfile {
  email: string;
  name?: string;
  recipeCount?: number;
}

// POST /api/auth/logout
// Zwraca: 200 OK przy sukcesie
```

## 🎛️ Customizacja

### Modyfikacja Nawigacji

W `AppSidebar.tsx`, sekcja `navigationItems`:

```typescript
const navigationItems: NavigationItem[] = [
  {
    id: 'recipes',
    label: 'Moje Przepisy',
    href: '/recipes',
    icon: <BookOpen className="w-5 h-5" />,
    badge: user?.recipeCount // Opcjonalny licznik
  },
  // Dodaj nowe elementy tutaj
  {
    id: 'favorites',
    label: 'Ulubione',
    href: '/favorites',
    icon: <Heart className="w-5 h-5" />
  }
];
```

### Stylowanie Brand/Logo

W `AppSidebar.tsx`, sekcja header:

```tsx
<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
  <BookOpen className="w-5 h-5 text-primary-foreground" />
</div>
<div>
  <h1 className="text-lg font-semibold text-foreground">AI RecipeKeeper</h1>
  <p className="text-xs text-muted-foreground">Twoje przepisy</p>
</div>
```

### Zmiana Szerokości Sidebara

W pliku `AppLayout.astro` i `AppSidebar.tsx`:

```css
/* Obecna szerokość: 320px (w-80) */
/* Zmień na np. 280px (w-70) lub 360px (w-90) */

.lg:ml-80 → .lg:ml-70  /* w layout */
w-80 → w-70           /* w sidebar */
```

## 📱 Responsywność

### Desktop (≥ 1024px):

- Sidebar fixed po lewej stronie
- Główna treść z marginesem
- Zawsze widoczny

### Tablet (768px - 1023px):

- Sidebar jako overlay
- Przycisk hamburger
- Backdrop blur

### Mobile (< 768px):

- Pełnoekranowy overlay
- Slide-in animacja
- Touch gestures

## 🎨 Wskazówki Designu

### Kolory (Tailwind + Shadcn):

- `bg-background` - tło sidebara
- `border-border` - ramki
- `text-foreground` - główny tekst
- `text-muted-foreground` - drugorzędny tekst
- `bg-primary` - aktywne elementy
- `bg-accent` - hover state

### Animacje:

- Hover transitions: 200ms
- Slide animations: 300ms
- Responsive changes: smooth

## 🔧 Troubleshooting

### Problem: Sidebar nie renderuje się

**Rozwiązanie:** Sprawdź czy:

1. Endpoint `/api/users/profile` działa
2. User jest zalogowany
3. React dependencies są zainstalowane

### Problem: Mobile menu nie działa

**Rozwiązanie:** Sprawdź czy:

1. Tailwind breakpoints są poprawne
2. JavaScript jest włączony
3. Event listeners są zarejestrowane

### Problem: Styling nie jest poprawny

**Rozwiązanie:** Sprawdź czy:

1. Tailwind CSS jest skonfigurowany
2. Shadcn/ui theme jest załadowany
3. CSS custom properties działają

## 🎯 Następne Kroki

1. **Integracja z autentykacją** - połączenie z Supabase Auth
2. **Persystencja stanu** - localStorage dla preferencji
3. **Animacje rozszerzone** - page transitions
4. **Notyfikacje** - toast messages w sidebar
5. **Search** - globalne wyszukiwanie w sidebar

## 📞 Wsparcie

W przypadku problemów:

1. Sprawdź logi konsoli przeglądarki
2. Zweryfikuj network requests do API
3. Przetestuj na różnych urządzeniach
4. Sprawdź dokumentację Shadcn/ui
