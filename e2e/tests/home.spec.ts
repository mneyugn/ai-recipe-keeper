import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

test.describe("Strona główna", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });

  test("powinna wyświetlić się poprawnie", async () => {
    // Sprawdź, czy tytuł strony jest poprawny
    await expect(homePage.getTitle()).resolves.toContain("AI Recipe Keeper");

    // Sprawdź, czy nawigacja jest widoczna
    await homePage.expectNavigationToBeVisible();

    // Sprawdź, czy sekcja funkcji jest widoczna
    await homePage.expectFeaturesSectionToBeVisible();
  });

  test("powinna zawierać tytuł hero", async () => {
    // Sprawdź, czy tytuł hero zawiera odpowiedni tekst
    await homePage.expectHeroTitleToContain("Recipe");
  });

  test("powinna umożliwić przejście do logowania", async ({ page }) => {
    // Kliknij przycisk logowania
    await homePage.clickLoginButton();

    // Sprawdź, czy zostaliśmy przekierowani do strony logowania
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test("powinna zrobić screenshot strony głównej", async ({ page }) => {
    // Zrób screenshot do porównania wizualnego
    await expect(page).toHaveScreenshot("home-page.png");
  });

  test("powinna być responsywna na urządzeniach mobilnych", async ({ page }) => {
    // Ustaw rozmiar okna na mobilny
    await page.setViewportSize({ width: 375, height: 667 });

    // Sprawdź, czy strona wciąż się ładuje poprawnie
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Sprawdź, czy główne elementy są widoczne
    await homePage.expectNavigationToBeVisible();
  });
});
