import { type Page, type Locator, expect } from "@playwright/test";

export abstract class BasePage {
  protected page: Page;
  protected url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  protected async clickElement(locator: Locator): Promise<void> {
    await locator.click();
  }

  protected async fillInput(locator: Locator, text: string): Promise<void> {
    await locator.fill(text);
  }

  protected async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || "";
  }

  protected async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  protected async waitForElement(locator: Locator, timeout = 5000): Promise<void> {
    await locator.waitFor({ timeout });
  }

  protected async expectToBeVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  protected async expectToHaveText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  protected async expectToContainText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }
}
