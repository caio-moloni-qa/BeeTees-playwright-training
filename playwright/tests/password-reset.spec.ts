import { test, expect } from "../helpers/fixtures";
import { ZIPS } from "../data/testData";

const ORIGINAL_PASSWORD = "originalPass123";
const NEW_PASSWORD = "newSecurePass456";
const EXPIRED_TOKEN = "expired-demo-reset-token";

test.describe("Password reset flow", () => {
  let email: string;

  test.beforeEach(async ({ request }, testInfo) => {
    // A fresh account per test — isolated from the shared demo user and from
    // other workers/runs, and safe to actually mutate the password of.
    email = `reset-test-${testInfo.workerIndex}-${Date.now()}@example.com`;
    const signup = await request.post("/api/auth/signup", {
      data: {
        firstName: "Reset",
        lastName: "Tester",
        email,
        password: ORIGINAL_PASSWORD,
        location: {
          zipCode: ZIPS.newYork.zip,
          countryCode: ZIPS.newYork.country,
          streetLine: "1 Test St",
          neighborhood: "",
          city: "New York",
          state: "NY",
          country: "United States",
          complement: "",
          storeId: "us-ny-midtown",
        },
      },
    });
    expect(signup.ok()).toBeTruthy();
  });

  /** Requests a reset for the test user and lands on the reset page with a live token pre-filled. */
  async function reachResetPage(app: import("../pages/app").App): Promise<void> {
    await app.gotoMenu();
    await app.openLogin();
    await app.login.goToForgotPassword();
    await app.forgotPassword.requestReset(email);
    await expect(app.forgotPassword.devToken).toBeVisible();
    await app.forgotPassword.devContinue.click();
    await expect(app.resetPassword.pageRoot).toBeVisible();
    await expect(app.resetPassword.token).not.toHaveValue("");
  }

  test("Forgot password link on login navigates to the reset request page", async ({ app }) => {
    await app.gotoMenu();
    await app.openLogin();
    await app.login.goToForgotPassword();

    await expect(app.forgotPassword.pageRoot).toBeVisible();
  });

  test("Requesting a reset for a registered email shows the dev token", async ({ app }) => {
    await app.gotoMenu();
    await app.openLogin();
    await app.login.goToForgotPassword();
    await app.forgotPassword.requestReset(email);

    await expect(app.forgotPassword.success).toContainText(
      "If an account exists for that email, a reset link has been sent."
    );
    await expect(app.forgotPassword.devToken).toBeVisible();
    await expect(app.forgotPassword.devContinue).toBeVisible();
  });

  test("Requesting a reset for an unknown email shows the same message, no token", async ({
    app,
  }) => {
    await app.gotoMenu();
    await app.openLogin();
    await app.login.goToForgotPassword();
    await app.forgotPassword.requestReset("nobody-at-all@example.com");

    await expect(app.forgotPassword.success).toContainText(
      "If an account exists for that email, a reset link has been sent."
    );
    await expect(app.forgotPassword.devToken).toBeHidden();
    await expect(app.forgotPassword.devContinue).toBeHidden();
  });

  test("Completing the flow lets the user log in with the new password, not the old one", async ({
    app,
  }) => {
    await reachResetPage(app);
    await app.resetPassword.resetTo(NEW_PASSWORD);

    // AuthSuccessOverlay holds briefly, then redirects to login.
    await expect(app.login.email).toBeVisible({ timeout: 5_000 });

    await app.login.loginAs(email, ORIGINAL_PASSWORD);
    await expect(app.login.error).toContainText("Invalid email or password");

    await app.login.loginAs(email, NEW_PASSWORD);
    await expect(app.menu.productGrid).toBeVisible();
  });

  test("An expired token is rejected with an invalid-link error", async ({ app }) => {
    await reachResetPage(app);
    // Overwrite the live pre-filled token with the seeded, always-expired one.
    await app.resetPassword.resetWithToken(EXPIRED_TOKEN, NEW_PASSWORD);

    await expect(app.resetPassword.error).toContainText(
      "This reset link is invalid or has expired."
    );
  });

  test("An empty token shows a required-field error", async ({ app }) => {
    await reachResetPage(app);
    await app.resetPassword.token.fill("");
    await app.resetPassword.resetTo(NEW_PASSWORD);

    await expect(app.resetPassword.error).toContainText("Reset token is required.");
  });

  test("A password under 8 characters shows a client-side error", async ({ app }) => {
    await reachResetPage(app);
    await app.resetPassword.resetTo("short1");

    await expect(app.resetPassword.error).toContainText(
      "Password must be at least 8 characters."
    );
  });

  test("Mismatched confirm password shows a client-side error", async ({ app }) => {
    await reachResetPage(app);
    await app.resetPassword.resetTo(NEW_PASSWORD, "somethingElse123");

    await expect(app.resetPassword.error).toContainText("Passwords do not match.");
  });
});
