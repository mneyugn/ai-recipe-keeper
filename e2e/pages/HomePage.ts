import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  // Selektory elementów
  private readonly navigationMenu: Locator;
  private readonly loginButton: Locator;
  private readonly heroTitle: Locator;
  private readonly featuresSection: Locator;

  constructor(page: Page) {
    super(page, "/");

    // Inicjalizacja locatorów
    this.navigationMenu = page.locator('[data-testid="main-navigation"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.heroTitle = page.locator('[data-testid="hero-title"]');
    this.featuresSection = page.locator('[data-testid="features-section"]');
  }

  // Akcje na stronie
  async clickLoginButton(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  async getHeroTitle(): Promise<string> {
    return await this.getText(this.heroTitle);
  }

  // Sprawdzenia
  async expectNavigationToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.navigationMenu);
  }

  async expectHeroTitleToContain(text: string): Promise<void> {
    await this.expectToContainText(this.heroTitle, text);
  }

  async expectFeaturesSectionToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.featuresSection);
  }

  // Metody pomocnicze
  async isPageLoaded(): Promise<boolean> {
    return (await this.isVisible(this.navigationMenu)) && (await this.isVisible(this.heroTitle));
  }
}
