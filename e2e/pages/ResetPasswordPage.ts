import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ResetPasswordPage extends BasePage {
  // Locators - Form state
  private readonly resetPasswordForm: Locator;
  private readonly resetPasswordFormElement: Locator;
  private readonly newPasswordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly submitButton: Locator;
  private readonly newPasswordError: Locator;
  private readonly confirmPasswordError: Locator;
  private readonly authErrorAlert: Locator;
  private readonly authErrorMessage: Locator;

  // Locators - Token error state
  private readonly tokenErrorContainer: Locator;
  private readonly tokenErrorAlert: Locator;
  private readonly generateNewLinkButton: Locator;
  private readonly backToLoginFromErrorButton: Locator;

  // Locators - Success state
  private readonly successContainer: Locator;
  private readonly successAlert: Locator;
  private readonly goToLoginButton: Locator;

  constructor(page: Page, token?: string) {
    const url = token ? `/auth/reset/${token}` : "/auth/reset";
    super(page, url);

    // Initialize form locators using data-testid
    this.resetPasswordForm = this.page.getByTestId("reset-password-form");
    this.resetPasswordFormElement = this.page.getByTestId("reset-password-form-element");
    this.newPasswordInput = this.page.getByTestId("reset-password-new-password-input");
    this.confirmPasswordInput = this.page.getByTestId("reset-password-confirm-password-input");
    this.submitButton = this.page.getByTestId("reset-password-submit-button");
    this.newPasswordError = this.page.getByTestId("reset-password-new-password-error");
    this.confirmPasswordError = this.page.getByTestId("reset-password-confirm-password-error");
    this.authErrorAlert = this.page.getByTestId("auth-error-alert");
    this.authErrorMessage = this.page.getByTestId("auth-error-message");

    // Initialize token error state locators
    this.tokenErrorContainer = this.page.getByTestId("reset-password-token-error");
    this.tokenErrorAlert = this.page.getByTestId("reset-password-token-error-alert");
    this.generateNewLinkButton = this.page.getByTestId("reset-password-generate-new-link");
    this.backToLoginFromErrorButton = this.page.getByTestId("reset-password-back-to-login");

    // Initialize success state locators
    this.successContainer = this.page.getByTestId("reset-password-success");
    this.successAlert = this.page.getByTestId("reset-password-success-alert");
    this.goToLoginButton = this.page.getByTestId("reset-password-go-to-login");
  }

  // Actions - Form state
  async fillNewPassword(password: string): Promise<void> {
    await this.fillInput(this.newPasswordInput, password);
  }

  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.fillInput(this.confirmPasswordInput, confirmPassword);
  }

  async clickSubmit(): Promise<void> {
    await this.clickElement(this.submitButton);
  }

  async resetPassword(newPassword: string, confirmPassword: string): Promise<void> {
    await this.fillNewPassword(newPassword);
    await this.fillConfirmPassword(confirmPassword);
    await this.clickSubmit();
  }

  // Actions - Token error state
  async clickGenerateNewLink(): Promise<void> {
    await this.clickElement(this.generateNewLinkButton);
  }

  async clickBackToLoginFromError(): Promise<void> {
    await this.clickElement(this.backToLoginFromErrorButton);
  }

  // Actions - Success state
  async clickGoToLogin(): Promise<void> {
    await this.clickElement(this.goToLoginButton);
  }

  // Assertions - Form state
  async expectFormToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.resetPasswordForm);
  }

  async expectNewPasswordErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.newPasswordError);
  }

  async expectConfirmPasswordErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.confirmPasswordError);
  }

  async expectAuthErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.authErrorAlert);
  }

  async expectNewPasswordErrorText(text: string): Promise<void> {
    await this.expectToHaveText(this.newPasswordError, text);
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

  // Assertions - Token error state
  async expectTokenErrorToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.tokenErrorContainer);
  }

  async expectTokenErrorAlertToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.tokenErrorAlert);
  }

  async expectTokenErrorText(text: string): Promise<void> {
    await this.expectToContainText(this.tokenErrorAlert, text);
  }

  // Assertions - Success state
  async expectSuccessToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.successContainer);
  }

  async expectSuccessAlertToBeVisible(): Promise<void> {
    await this.expectToBeVisible(this.successAlert);
  }

  // Getters for direct access to locators if needed
  get getNewPasswordInput(): Locator {
    return this.newPasswordInput;
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

  get getTokenErrorContainer(): Locator {
    return this.tokenErrorContainer;
  }

  get getSuccessContainer(): Locator {
    return this.successContainer;
  }

  get getGoToLoginButton(): Locator {
    return this.goToLoginButton;
  }
}
