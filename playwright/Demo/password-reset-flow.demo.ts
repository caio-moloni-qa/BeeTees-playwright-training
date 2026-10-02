import * as path from "path";
import { test, expect } from "../helpers/fixtures";
import { Narrator } from "./narration";
import { ZIPS } from "../data/testData";

/**
 * Password reset walkthrough for a screen recording — a PACED, NARRATED take, not a test.
 *
 *   npm run demo:password-reset-flow
 *
 * A brand-new account is created on screen, then "forgets" its password: the user requests
 * a reset, an expired link is refused, the real link sets a new password, and two login
 * attempts prove the old password is dead and the new one works.
 *
 * Uses a fresh, throwaway account every take — never the shared alex@beetees.test user.
 *
 *   DEMO_BEAT_MS    hold per caption (default 5500)
 *   DEMO_SLOWMO_MS  delay between browser actions (default 600, set in playwright.config.ts)
 */
const BEAT = Number(process.env.DEMO_BEAT_MS ?? 5500);
const FIRST_NAME = "Riley";
const LAST_NAME = "Demo";
const ORIGINAL_PASSWORD = "originalPass123";
const NEW_PASSWORD = "newSecurePass456";
const EXPIRED_TOKEN = "expired-demo-reset-token";
const STREET = "1 Demo Street";

test("Password reset — a user recovers access on their own, and an expired link stays shut", async ({
  page,
  app,
}, testInfo) => {
  test.setTimeout(15 * 60_000);

  // A unique, disposable account per take — safe to change the password of.
  const email = `reset-demo-${Date.now()}@example.com`;

  // The profile screen has no Page Object; its Email field and Log out button by label/name.
  const profileEmail = page.getByLabel("Email");
  const logout = page.getByRole("button", { name: "Log out" });

  // INSTALL — narrator first, before the app loads.
  const narrator = new Narrator(page, BEAT);
  await narrator.install();

  try {
    await app.gotoMenu();

    // FRAME — why the viewer should care, in one sentence.
    await narrator.say(
      "A customer who forgets their password can now get back in on their own — no support ticket, no shared reset.",
      { eyebrow: "Accounts · Password reset" }
    );

    // BEAT 1 — create a brand-new account through the real sign-up screen.
    await narrator.focus(app.header.profileToggle, 700);
    await app.openLogin();
    await expect(app.login.email).toBeVisible();
    await narrator.focus(app.login.signupLink);
    await app.login.goToSignup();
    await expect(app.signup.submit).toBeVisible();
    await app.signup.fillAccount({
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      email,
      password: ORIGINAL_PASSWORD,
    });
    await narrator.focus(app.signup.zip);
    await app.signup.lookupZip(ZIPS.newYork.zip);
    await expect(app.location.storeStatus).toContainText(ZIPS.newYork.store);
    await app.signup.street.fill(STREET);
    const signupStore = (await app.location.storeStatus.innerText()).trim();
    await narrator.say(
      `First, a brand-new test account, ${email}, with a deliverable address: "${signupStore}". The shared demo user is never touched.`,
      { eyebrow: "Step 1 · A fresh account" }
    );

    // BEAT 2 — the account exists and is signed in; sign out to play the forgetful user.
    await narrator.focus(app.signup.submit);
    await app.signup.createAccount();
    await expect(logout).toBeVisible({ timeout: 10_000 });
    await expect(profileEmail).toHaveValue(email);
    await narrator.focus(logout);
    await logout.click();
    await app.openLogin();
    await expect(app.login.email).toBeVisible();
    await narrator.say(
      "Account created and signed out. Now pretend the original password has been forgotten.",
      { eyebrow: "Step 2 · Signed out" }
    );

    // BEAT 3 — request a reset from the login screen.
    await narrator.focus(app.login.forgotPasswordLink);
    await app.login.goToForgotPassword();
    await expect(app.forgotPassword.pageRoot).toBeVisible();
    await narrator.focus(app.forgotPassword.email);
    await app.forgotPassword.requestReset(email);
    await expect(app.forgotPassword.success).toBeVisible();
    const successMessage = (await app.forgotPassword.success.innerText()).trim();
    await narrator.say(
      `The confirmation reads "${successMessage}" — worded the same whether or not the email exists, so it never leaks who has an account.`,
      { eyebrow: "Step 3 · Reset requested" }
    );

    // BEAT 4 — the on-screen token is a training-only shortcut.
    await expect(app.forgotPassword.devToken).toBeVisible();
    await expect(app.forgotPassword.devContinue).toBeVisible();
    await narrator.focus(app.forgotPassword.devToken, 1200);
    await narrator.say(
      "Training-environment shortcut: this app has no email service, so the reset token is shown right here. In production it would only arrive by email.",
      { eyebrow: "Step 4 · Dev/test only", holdMs: BEAT * 1.3 }
    );

    // BEAT 5 — an expired link is refused.
    await narrator.focus(app.forgotPassword.devContinue);
    await app.forgotPassword.devContinue.click();
    await expect(app.resetPassword.pageRoot).toBeVisible();
    await expect(app.resetPassword.token).not.toHaveValue("");
    const liveToken = await app.resetPassword.token.inputValue();
    await narrator.focus(app.resetPassword.token);
    await app.resetPassword.resetWithToken(EXPIRED_TOKEN, NEW_PASSWORD);
    await expect(app.resetPassword.error).toBeVisible();
    await expect(app.resetPassword.error).toContainText(/invalid|expired/i);
    const expiredError = (await app.resetPassword.error.innerText()).trim();
    await narrator.say(
      `First, an old, expired link: "${expiredError}" The password stays exactly as it was.`,
      { eyebrow: "Step 5 · Expired link refused" }
    );

    // BEAT 6 — the real, fresh link sets the new password.
    await narrator.focus(app.resetPassword.newPassword);
    await app.resetPassword.resetWithToken(liveToken, NEW_PASSWORD);
    await expect(app.login.email).toBeVisible({ timeout: 10_000 });
    await narrator.say(
      "Now the fresh link from this request: the new password is accepted and the user is sent back to sign in.",
      { eyebrow: "Step 6 · New password set" }
    );

    // BEAT 7 — the old password no longer works.
    await narrator.focus(app.login.email);
    await app.login.loginAs(email, ORIGINAL_PASSWORD);
    await expect(app.login.error).toBeVisible();
    const loginError = (await app.login.error.innerText()).trim();
    await narrator.say(
      `Login with the OLD password: "${loginError}" That door is closed.`,
      { eyebrow: "Step 7 · Old password rejected" }
    );

    // LAND IT — the new password works.
    await app.login.loginAs(email, NEW_PASSWORD);
    await expect(app.menu.productGrid).toBeVisible({ timeout: 10_000 });
    await app.openLogin();
    await expect(logout).toBeVisible();
    await expect(profileEmail).toHaveValue(email);
    const signedInAs = await profileEmail.inputValue();
    await narrator.focus(profileEmail);
    await narrator.say(
      `Login with the NEW password: the profile opens for ${signedInAs}. Access recovered without help — and the expired link opened nothing.`,
      { eyebrow: "Outcome · Self-service recovery", holdMs: BEAT * 1.3 }
    );
  } finally {
    // ALWAYS — write the captions, pass or fail.
    narrator.writeVtt(path.join(testInfo.outputDir, "captions.vtt"));
  }
});
