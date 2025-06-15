import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ResetRequestPage extends BasePage {
  // Locators - Form state
  private readonly resetRequestForm: Locator;
  private readonly resetRequestFormElement: Locator;
  private readonly emailInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginLink: Locator;
  private readonly emailError: Locator;
  private readonly authErrorAlert: Locator;
  private readonly authErrorMessage: Locator;

  // Locators - Success state
  private readonly successContainer: Locator;
  private readonly successAlert: Locator;
  private readonly backToLoginButton: Locator;
  private readonly sendAgainButton: Locator;

  constructor(page: Page) {
    super(page, "/auth/reset");

    // Initialize form locators using data-testid
    this.resetRequestForm = this.page.getByTestId("reset-request-form");
    this.resetRequestFormElement = this.page.getByTestId("reset-request-form-element");
    this.emailInput = this.page.getByTestId("reset-request-email-input");
    this.submitButton = this.page.getByTestId("reset-request-submit-button");
    this.loginLink = this.page.getByTestId("reset-request-login-link");
    this.emailError = this.page.getByTestId("reset-request-email-error");
    this.authErrorAlert = this.page.getByTestId("auth-error-alert");
    this.authErrorMessage = this.page.getByTestId("auth-error-message");

    // Initialize success state locators
    this.successContainer = this.page.getByTestId("reset-request-success");
    this.successAlert = this.page.getByTestId("reset-request-success-alert");
    this.backToLoginButton = this.page.getByTestId("reset-request-back-to-login");
    this.sendAgainButton = this.page.getByTestId("reset-request-send-again");
  }

  // Actions - Form state
  async fillEmail(email: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
  }

  async clickSubmit(): Promise<void> {
    await this.clickElement(this.submitButton);
  }

  async clickLoginLink(): Promise<void> {
    await this.clickElement(this.loginLink);
  }

  async requestReset(email: string): Promise<void> {
    await this.fillEmail(email);
    await this.clickSubmit();
  }

  // Actions - Success state
  async clickBackToLogin(): Promise<void> {
    await this.clickElement(this.backToLoginButton);
  }

  async clickSendAgain(): Promise<void> {
    await this.clickElement(this.sendAgainButton);
  }

  // Assertions - Form state
  async expectFormToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.resetRequestForm);
  }

  async expectEmailErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.emailError);
  }

  async expectAuthErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.authErrorAlert);
  }

  async expectEmailErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.emailError, text);
  }

  async expectAuthErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.authErrorMessage, text);
  }

  async expectSubmitButtonToBeDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitButtonToBeEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectSubmitButtonText(text: string): Promise<void> {
    await this.expectToHaveText(this.submitButton, text);
  }

  // Assertions - Success state
  async expectSuccessToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.successContainer);
  }

  async expectSuccessAlertToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.successAlert);
  }

  async expectSuccessAlertToContainEmail(email: string): Promise<void> {
    await this.expectToContainText(this.successAlert, email);
  }

  // Getters for direct access to locators if needed
  get getEmailInput(): Locator {
    return this.emailInput;
  }

  get getSubmitButton(): Locator {
    return this.submitButton;
  }

  get getAuthErrorAlert(): Locator {
    return this.authErrorAlert;
  }

  get getSuccessContainer(): Locator {
    return this.successContainer;
  }

  get getBackToLoginButton(): Locator {
    return this.backToLoginButton;
  }

  get getSendAgainButton(): Locator {
    return this.sendAgainButton;
  }
}
