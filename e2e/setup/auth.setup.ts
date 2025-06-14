import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Przejdź do strony logowania
  await page.goto("/auth/login");

  // Wypełnij formularz logowania
  // Dostosuj selektory do rzeczywistych pól w Twojej aplikacji
  await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL || "test@example.com");
  await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD || "testpassword123");

  // Kliknij przycisk logowania
  await page.click('[data-testid="login-button"]');

  // Poczekaj na przekierowanie po udanym logowaniu
  await page.waitForURL("/dashboard"); // Dostosuj URL do Twojej aplikacji

  // Sprawdź, czy użytkownik jest zalogowany
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // Zapisz stan uwierzytelnienia
  await page.context().storageState({ path: authFile });
});
