import { useState, useEffect } from "react";

/**
 * Custom hook to manage localStorage with type safety and SSR support
 * @param key - localStorage key
 * @param defaultValue - default value
 * @returns [value, setValue] - similar to useState
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // state initialized with default value
  const [value, setValue] = useState<T>(() => {
    // check if we are in the browser (not SSR)
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

  // effect to save changes to localStorage
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
 * Configuration of localStorage keys used in the application
 * Central place for all localStorage keys
 */
export const LOCAL_STORAGE_KEYS = {
  RECIPE_VIEW_TYPE: "recipe-view-type",
  USER_PREFERENCES: "user-preferences",
  SIDEBAR_COLLAPSED: "sidebar-collapsed",
  THEME: "theme",
} as const;

/**
 * Hook specific for recipe view mode
 * Uses type-safe enum and default values
 */
export function useRecipeViewType() {
  type ViewType = "grid" | "list";

  return useLocalStorage<ViewType>(LOCAL_STORAGE_KEYS.RECIPE_VIEW_TYPE, "grid");
}
