import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId("login-email");
    this.password = page.getByTestId("login-password");
    this.submit = page.getByTestId("login-submit");
    this.error = page.getByTestId("login-error");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password");
    // No test id on this link yet — located by its visible (en-US) text.
    this.signupLink = page.getByRole("button", { name: /Sign up/ });
  }

  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async goToSignup(): Promise<void> {
    await this.signupLink.click();
  }

  async loginAs(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

export type SignupDetails = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  zip: string;
  street: string;
};

/**
 * The signup screen has no data-testids, so fields are located by their en-US labels.
 * Signup country defaults to US; switching it to BR relabels the form in Portuguese.
 */
export class SignupPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly zip: Locator;
  readonly lookup: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly street: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByLabel("First name");
    this.lastName = page.getByLabel("Last name");
    this.email = page.getByLabel("Email");
    // MUI puts the required "*" in the accessible name, so anchor instead of exact-matching;
    // "^Password" also keeps "Confirm password" out.
    this.password = page.getByLabel(/^Password/);
    this.confirmPassword = page.getByLabel("Confirm password");
    this.zip = page.getByLabel("ZIP / Postal code");
    this.lookup = page.getByRole("button", { name: "Look up address" });
    this.city = page.getByLabel("City");
    this.state = page.getByLabel("State / Province");
    this.street = page.getByLabel("Street address");
    this.submit = page.getByRole("button", { name: "Create account" });
  }

  async fillAccount(
    details: Pick<SignupDetails, "firstName" | "lastName" | "email" | "password">
  ): Promise<void> {
    await this.firstName.fill(details.firstName);
    await this.lastName.fill(details.lastName);
    await this.email.fill(details.email);
    await this.password.fill(details.password);
    await this.confirmPassword.fill(details.password);
  }

  /** Runs the postal lookup; city/state come back from it, the street is typed by hand. */
  async lookupZip(zip: string): Promise<void> {
    await this.zip.fill(zip);
    await this.lookup.click();
  }

  async createAccount(): Promise<void> {
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
