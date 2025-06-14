import { test, expect } from "@playwright/test";

test.describe("Podstawowe testy", () => {
  test("strona logowania ładuje się poprawnie", async ({ page }) => {
    await page.goto("/auth/login");

    // Sprawdź czy formularz logowania jest widoczny
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("formularz logowania ma wymagane pola", async ({ page }) => {
    await page.goto("/auth/login");

    // Sprawdź atrybuty pól
    await expect(page.locator("#email")).toHaveAttribute("type", "email");
    await expect(page.locator("#password")).toHaveAttribute("type", "password");

    // Sprawdź placeholdery
    await expect(page.locator("#email")).toHaveAttribute("placeholder", "nazwa@przykład.pl");
    await expect(page.locator("#password")).toHaveAttribute("placeholder", "Wprowadź hasło");
  });
});
