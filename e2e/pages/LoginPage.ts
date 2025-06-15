import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Locators
  private readonly loginForm: Locator;
  private readonly loginFormElement: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly emailError: Locator;
  private readonly passwordError: Locator;
  private readonly authErrorAlert: Locator;
  private readonly authErrorMessage: Locator;

  constructor(page: Page) {
    super(page, "/auth/login");

    // Initialize locators using data-testid
    this.loginForm = this.page.getByTestId("login-form");
    this.loginFormElement = this.page.getByTestId("login-form-element");
    this.emailInput = this.page.getByTestId("login-email-input");
    this.passwordInput = this.page.getByTestId("login-password-input");
    this.submitButton = this.page.getByTestId("login-submit-button");
    this.forgotPasswordLink = this.page.getByTestId("login-forgot-password-link");
    this.emailError = this.page.getByTestId("login-email-error");
    this.passwordError = this.page.getByTestId("login-password-error");
    this.authErrorAlert = this.page.getByTestId("auth-error-alert");
    this.authErrorMessage = this.page.getByTestId("auth-error-message");
  }

  // Actions
  async fillEmail(email: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  async clickSubmit(): Promise<void> {
    await this.clickElement(this.submitButton);
  }

  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  // Assertions
  async expectFormToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.loginForm);
  }

  async expectEmailErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.emailError);
  }

  async expectPasswordErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.passwordError);
  }

  async expectAuthErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.authErrorAlert);
  }

  async expectEmailErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.emailError, text);
  }

  async expectPasswordErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.passwordError, text);
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

  // Getters for direct access to locators if needed
  get getEmailInput(): Locator {
    return this.emailInput;
  }

  get getPasswordInput(): Locator {
    return this.passwordInput;
  }

  get getSubmitButton(): Locator {
    return this.submitButton;
  }

  get getAuthErrorAlert(): Locator {
    return this.authErrorAlert;
  }
}
