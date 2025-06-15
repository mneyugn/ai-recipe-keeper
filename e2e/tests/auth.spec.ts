import { test, expect } from "@playwright/test";
import { LoginPage, RegisterPage, ResetRequestPage, ResetPasswordPage } from "../pages";

test.describe("Autoryzacja", () => {
  test.describe("Logowanie", () => {
    test("powinno wyświetlić formularz logowania", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.expectFormToBeVisible();
    });

    test("powinno wyświetlić błędy walidacji dla pustych pól", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.waitForPageLoad();
      await loginPage.expectFormToBeVisible();

      // Kliknij submit z pustymi polami
      await loginPage.clickSubmit();

      // Poczekaj na pojawienie się błędów walidacji
      await loginPage.expectEmailErrorToBeVisible();
      await loginPage.expectPasswordErrorToBeVisible();

      // Sprawdź treść błędów - puste pole email jest traktowane jako nieprawidłowy format
      await loginPage.expectEmailErrorText("Nieprawidłowy format email");
      await loginPage.expectPasswordErrorText("Hasło jest wymagane");
    });

    test("powinno przekierować do strony resetowania hasła", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.clickForgotPassword();

      await expect(page).toHaveURL(/\/auth\/reset/);
    });
  });

  test.describe("Rejestracja", () => {
    test("powinno wyświetlić formularz rejestracji", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.expectFormToBeVisible();
    });

    test("powinno przekierować do strony logowania", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.clickLoginLink();

      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe("Resetowanie hasła - żądanie", () => {
    test("powinno wyświetlić formularz żądania resetowania", async ({ page }) => {
      const resetRequestPage = new ResetRequestPage(page);

      await resetRequestPage.goto();
      await resetRequestPage.expectFormToBeVisible();
    });
  });
});
