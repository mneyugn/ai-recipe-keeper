import { Page, expect } from "@playwright/test";

/**
 * Funkcje pomocnicze dla testów E2E
 */

/**
 * Czeka na załadowanie strony i sprawdza podstawowe elementy
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Loguje użytkownika przed testem
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/auth/login");
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL("/dashboard");
}

/**
 * Czyści localStorage i sessionStorage
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Sprawdza czy element jest widoczny z timeout
 */
export async function expectElementToBeVisible(page: Page, selector: string, timeout = 5000): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Wypełnia formularz danymi
 */
export async function fillForm(page: Page, formData: Record<string, string>): Promise<void> {
  for (const [field, value] of Object.entries(formData)) {
    await page.fill(`[data-testid="${field}"]`, value);
  }
}

/**
 * Czeka na API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(urlPattern);
}

/**
 * Robi screenshot z timestampem
 */
export async function takeTimestampedScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Testuje responsywność na różnych urządzeniach
 */
export async function testResponsiveness(page: Page, callback: () => Promise<void>): Promise<void> {
  const viewports = [
    { width: 375, height: 667, name: "mobile" }, // iPhone SE
    { width: 768, height: 1024, name: "tablet" }, // iPad
    { width: 1920, height: 1080, name: "desktop" }, // Desktop
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await waitForPageLoad(page);
    await callback();
  }
}

/**
 * Sprawdza dostępność (a11y) podstawowych elementów
 */
export async function checkBasicAccessibility(page: Page): Promise<void> {
  // Sprawdź czy są odpowiednie role ARIA
  const mainContent = page.locator('[role="main"], main');
  await expect(mainContent).toBeVisible();

  // Sprawdź czy linki mają dostępne nazwy
  const links = page.locator("a");
  const linkCount = await links.count();

  for (let i = 0; i < linkCount; i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href");
    if (href && href !== "#") {
      await expect(link).toHaveAttribute("href");
    }
  }
}

/**
 * Mock API endpoint
 */
export async function mockApiEndpoint(page: Page, url: string | RegExp, response: any): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}
