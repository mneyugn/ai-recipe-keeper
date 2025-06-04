# Status implementacji widoku formularza przepisu

## Zrealizowane kroki

### Struktura plików

- ✅ Utworzono `src/pages/recipes/new.astro` - strona dodawania przepisu
- ✅ Utworzono `src/pages/recipes/[id]/edit.astro` - strona edycji przepisu
- ✅ Utworzono `src/components/RecipeForm.tsx` - główny komponent formularza
- ✅ Utworzono `src/components/DynamicFieldList.tsx` - komponent do zarządzania dynamicznymi listami pól
- ✅ Utworzono `src/components/MultiSelectTags.tsx` - komponent do wyboru wielu tagów

### Komponenty

- ✅ Zaimplementowano podstawową strukturę formularza
- ✅ Dodano wszystkie wymagane pola:
  - Nazwa przepisu
  - Lista składników
  - Lista kroków przygotowania
  - Czas przygotowania
  - Notatki
  - Tagi
- ✅ Zaimplementowano DynamicFieldList z:
  - Obsługą dodawania/usuwania elementów
  - Limitami znaków
  - Licznikiem znaków
  - Obsługą błędów walidacji
- ✅ Zaimplementowano MultiSelectTags z:
  - Wyszukiwaniem tagów
  - Kolorowym oznaczeniem tagów
  - Limitem wyboru tagów
  - Możliwością usuwania wybranych tagów

### Walidacja

- ✅ Zaimplementowano schemat walidacji z użyciem Zod
- ✅ Dodano walidację dla wszystkich pól:
  - Wymagane pola
  - Limity długości tekstu
  - Limity liczby elementów w listach
  - Walidacja pustych wartości
- ✅ Dodano wizualne oznaczenie pól z błędami
- ✅ Zaimplementowano automatyczne przewijanie do pierwszego błędu
- ✅ Dodano czyszczenie błędów po zmianie wartości pola

### UI/UX

- ✅ Zintegrowano komponenty Shadcn/ui
- ✅ Dodano responsywny układ
- ✅ Zaimplementowano obsługę stanu ładowania
- ✅ Dodano komunikaty o błędach
- ✅ Dodano kolorowe oznaczenie tagów

## Kolejne kroki

### Integracja z API

- [ ] Implementacja endpointów API w `src/pages/api/`:
  - POST /api/recipes - tworzenie nowego przepisu
  - PUT /api/recipes/[id] - aktualizacja przepisu
  - GET /api/recipes/[id] - pobieranie szczegółów przepisu do edycji
- [ ] Integracja formularza z API
- [ ] Obsługa odpowiedzi i błędów z API
- [ ] Przekierowania po udanym zapisie

### Tryby AI

- [ ] Implementacja trybu wklejania tekstu:
  - [ ] Pole tekstowe do wklejenia przepisu
  - [ ] Przycisk do ekstrakcji danych
  - [ ] Obsługa odpowiedzi AI
  - [ ] Możliwość edycji wyekstrahowanych danych
- [ ] Implementacja trybu importu z URL:
  - [ ] Pole do wprowadzenia URL
  - [ ] Walidacja dozwolonych domen
  - [ ] Przycisk do importu
  - [ ] Obsługa odpowiedzi AI
  - [ ] Możliwość edycji zaimportowanych danych

### Obsługa zdjęć

- [ ] Implementacja uploadu zdjęć
- [ ] Podgląd wybranego zdjęcia
- [ ] Walidacja rozmiaru i formatu
- [ ] Integracja z API do przechowywania zdjęć

### Testy

- [ ] Testy jednostkowe komponentów
- [ ] Testy integracyjne formularza
- [ ] Testy E2E dla głównych ścieżek użytkownika
