import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
  // Locators
  private readonly registerForm: Locator;
  private readonly registerFormElement: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginLink: Locator;
  private readonly emailError: Locator;
  private readonly passwordError: Locator;
  private readonly confirmPasswordError: Locator;
  private readonly authErrorAlert: Locator;
  private readonly authErrorMessage: Locator;

  constructor(page: Page) {
    super(page, "/auth/register");

    // Initialize locators using data-testid
    this.registerForm = this.page.getByTestId("register-form");
    this.registerFormElement = this.page.getByTestId("register-form-element");
    this.emailInput = this.page.getByTestId("register-email-input");
    this.passwordInput = this.page.getByTestId("register-password-input");
    this.confirmPasswordInput = this.page.getByTestId("register-confirm-password-input");
    this.submitButton = this.page.getByTestId("register-submit-button");
    this.loginLink = this.page.getByTestId("register-login-link");
    this.emailError = this.page.getByTestId("register-email-error");
    this.passwordError = this.page.getByTestId("register-password-error");
    this.confirmPasswordError = this.page.getByTestId("register-confirm-password-error");
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

  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.fillInput(this.confirmPasswordInput, confirmPassword);
  }

  async clickSubmit(): Promise<void> {
    await this.clickElement(this.submitButton);
  }

  async clickLoginLink(): Promise<void> {
    await this.clickElement(this.loginLink);
  }

  async register(email: string, password: string, confirmPassword: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
    await this.clickSubmit();
  }

  // Assertions
  async expectFormToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.registerForm);
  }

  async expectEmailErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.emailError);
  }

  async expectPasswordErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.passwordError);
  }

  async expectConfirmPasswordErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.confirmPasswordError);
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

  async expectConfirmPasswordErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.confirmPasswordError, text);
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

  get getConfirmPasswordInput(): Locator {
    return this.confirmPasswordInput;
  }

  get getSubmitButton(): Locator {
    return this.submitButton;
  }

  get getAuthErrorAlert(): Locator {
    return this.authErrorAlert;
  }
}
