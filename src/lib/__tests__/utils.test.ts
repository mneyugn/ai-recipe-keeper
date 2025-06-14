import { describe, test, expect, vi } from "vitest";

// Przykładowe funkcje pomocnicze do testowania
// Możesz dodać te funkcje do src/lib/utils.ts
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("pl-PL");
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const debounce = <T extends unknown[]>(func: (...args: T) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const fetchRecipes = async (query: string) => {
  const response = await fetch(`/api/recipes?q=${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }
  return response.json();
};

describe("Utils Functions", () => {
  describe("formatDate", () => {
    test("formatuje datę w polskim formacie", () => {
      const date = new Date("2024-01-15");
      const formatted = formatDate(date);

      expect(formatted).toBe("15.01.2024");
    });

    test("obsługuje różne daty", () => {
      const date = new Date("2023-12-31");
      const formatted = formatDate(date);

      expect(formatted).toBe("31.12.2023");
    });
  });

  describe("validateEmail", () => {
    test("zwraca true dla poprawnego email", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("user+tag@example.org")).toBe(true);
    });

    test("zwraca false dla niepoprawnego email", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("test@.com")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("debounce", () => {
    test("opóźnia wykonanie funkcji", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("test");

      // Funkcja nie powinna być wywołana natychmiast
      expect(mockFn).not.toHaveBeenCalled();

      // Czekamy 150ms
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Teraz powinna być wywołana
      expect(mockFn).toHaveBeenCalledWith("test");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("anuluje poprzednie wywołanie", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("first");
      debouncedFn("second");

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Tylko ostatnie wywołanie powinno być wykonane
      expect(mockFn).toHaveBeenCalledWith("second");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchRecipes", () => {
    test("pobiera przepisy z API", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          { id: 1, name: "Spaghetti" },
          { id: 2, name: "Pizza" },
        ]),
      };

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const recipes = await fetchRecipes("pasta");

      expect(global.fetch).toHaveBeenCalledWith("/api/recipes?q=pasta");
      expect(recipes).toEqual([
        { id: 1, name: "Spaghetti" },
        { id: 2, name: "Pizza" },
      ]);
    });

    test("rzuca błąd gdy API zwraca błąd", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(fetchRecipes("invalid")).rejects.toThrow("Failed to fetch recipes");
    });
  });
});
