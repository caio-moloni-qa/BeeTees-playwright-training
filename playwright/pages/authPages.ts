import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId("login-email");
    this.password = page.getByTestId("login-password");
    this.submit = page.getByTestId("login-submit");
    this.error = page.getByTestId("login-error");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password");
  }

  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async loginAs(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

export class ForgotPasswordPage {
  readonly pageRoot: Locator;
  readonly email: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly success: Locator;
  readonly devToken: Locator;
  readonly devContinue: Locator;
  readonly backToLogin: Locator;

  constructor(private readonly page: Page) {
    this.pageRoot = page.getByTestId("forgot-password-page");
    this.email = page.getByTestId("forgot-password-email");
    this.submit = page.getByTestId("forgot-password-submit");
    this.error = page.getByTestId("forgot-password-error");
    this.success = page.getByTestId("forgot-password-success");
    this.devToken = page.getByTestId("forgot-password-dev-token");
    this.devContinue = page.getByTestId("forgot-password-dev-continue");
    this.backToLogin = page.getByTestId("forgot-password-back-to-login");
  }

  async requestReset(email: string): Promise<void> {
    await this.email.fill(email);
    await this.submit.click();
  }
}

export class ResetPasswordPage {
  readonly pageRoot: Locator;
  readonly token: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.pageRoot = page.getByTestId("reset-password-page");
    this.token = page.getByTestId("reset-password-token");
    this.newPassword = page.getByTestId("reset-password-new");
    this.confirmPassword = page.getByTestId("reset-password-confirm");
    this.submit = page.getByTestId("reset-password-submit");
    this.error = page.getByTestId("reset-password-error");
  }

  async resetTo(newPassword: string, confirmPassword = newPassword): Promise<void> {
    await this.newPassword.fill(newPassword);
    await this.confirmPassword.fill(confirmPassword);
    await this.submit.click();
  }

  async resetWithToken(
    token: string,
    newPassword: string,
    confirmPassword = newPassword
  ): Promise<void> {
    await this.token.fill(token);
    await this.resetTo(newPassword, confirmPassword);
  }
}
