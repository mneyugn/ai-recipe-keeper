import { useState, useEffect } from "react";

/**
 * Custom hook do zarządzania localStorage z type safety i obsługą SSR
 * @param key - klucz w localStorage
 * @param defaultValue - wartość domyślna
 * @returns [value, setValue] - podobnie jak useState
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Stan inicjalizowany wartością domyślną
  const [value, setValue] = useState<T>(() => {
    // Sprawdzenie czy jesteśmy w przeglądarce (nie SSR)
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Efekt do zapisywania zmian w localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * Konfiguracja kluczy localStorage używanych w aplikacji
 * Centralne miejsce dla wszystkich kluczy localStorage
 */
export const LOCAL_STORAGE_KEYS = {
  RECIPE_VIEW_TYPE: "recipe-view-type",
  USER_PREFERENCES: "user-preferences",
  SIDEBAR_COLLAPSED: "sidebar-collapsed",
  THEME: "theme",
} as const;

/**
 * Hook specyficzny dla trybu widoku przepisów
 * Używa type-safe enum i domyślne wartości
 */
export function useRecipeViewType() {
  type ViewType = "grid" | "list";

  return useLocalStorage<ViewType>(LOCAL_STORAGE_KEYS.RECIPE_VIEW_TYPE, "grid");
}
