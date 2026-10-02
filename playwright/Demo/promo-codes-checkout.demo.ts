import * as path from "path";
import type { Locator } from "@playwright/test";
import { test, expect } from "../helpers/fixtures";
import { Narrator } from "./narration";
import { PROMO_CODES, ZIPS } from "../data/testData";

/**
 * Promo codes at checkout walkthrough for a screen recording — a PACED, NARRATED take,
 * not a test.
 *
 *   npm run demo:promo-codes-checkout
 *
 * A shopper reaches checkout, applies a valid coupon and watches the total drop on the
 * spot, removes it and gets the original total back, then tries an expired coupon and gets
 * a specific expiry message while the cart, details and total stay intact.
 *
 *   DEMO_BEAT_MS    hold per caption (default 5500)
 *   DEMO_SLOWMO_MS  delay between browser actions (default 600, set in playwright.config.ts)
 */
const BEAT = Number(process.env.DEMO_BEAT_MS ?? 5500);
const PRODUCT_ID = "cheeseburguer";
const CUSTOMER_NAME = "Jordan Lee";
const CUSTOMER_EMAIL = "jordan.lee@example.com";

/** The total and discount rows hold a label and an amount; the amount is the last line. */
async function amountIn(row: Locator): Promise<string> {
  const lines = (await row.innerText())
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[lines.length - 1];
}

test("Promo codes — a valid coupon lowers the total at once, an expired one is refused without breaking checkout", async ({
  page,
  app,
}, testInfo) => {
  test.setTimeout(15 * 60_000);

  // INSTALL — narrator first, before the app loads.
  const narrator = new Narrator(page, BEAT);
  await narrator.install();

  try {
    await app.gotoMenu();

    // FRAME — why the viewer should care, in one sentence.
    await narrator.say(
      "Shoppers can now type a coupon at checkout — and they find out on the spot whether it worked, before they pay.",
      { eyebrow: "Checkout · Promo codes" }
    );

    // BEAT 1 — get a US order to checkout (US keeps prices in dollars).
    await narrator.focus(app.header.locationToggle, 700);
    await app.saveLocation(ZIPS.newYork.zip, ZIPS.newYork.country);
    await expect(app.header.locationSetIndicator).toBeVisible();
    await narrator.focus(app.menu.productCard(PRODUCT_ID).first());
    await app.addToCart(PRODUCT_ID);
    await expect(app.header.cartCount).toHaveText("1");
    await app.header.openCart();
    await expect(app.cart.drawer).toBeVisible();
    await app.goToCheckout();
    await app.checkout.fillPersonalDetails(CUSTOMER_NAME, CUSTOMER_EMAIL);
    await expect(app.checkout.discountAmount).toBeHidden();
    await narrator.focus(app.checkout.totalAmount);
    const originalTotal = await amountIn(app.checkout.totalAmount);
    const subtotal = (await app.checkout.subtotalAmount.innerText()).trim();
    await narrator.say(
      `One item in the cart, no coupon yet: subtotal ${subtotal}, total ${originalTotal}. Keep an eye on that total.`,
      { eyebrow: "Step 1 · The starting total" }
    );

    // BEAT 2 — the Apply button waits for a code.
    await narrator.focus(app.checkout.promoInput);
    await expect(app.checkout.promoApply).toBeDisabled();
    await narrator.say(
      "The Apply button stays disabled while the coupon field is empty — nothing to submit by accident.",
      { eyebrow: "Step 2 · Guarded input" }
    );

    // BEAT 3 — a valid percent coupon lowers the total immediately.
    await app.checkout.applyPromoCode(PROMO_CODES.percentOff);
    await expect(app.checkout.promoApplied).toContainText(PROMO_CODES.percentOff);
    await expect(app.checkout.discountAmount).toBeVisible();
    await expect(app.checkout.totalAmount).not.toContainText(originalTotal);
    await narrator.focus(app.checkout.totalAmount);
    const discount = (await amountIn(app.checkout.discountAmount)).replace(/^-/, "");
    const discountedTotal = await amountIn(app.checkout.totalAmount);
    await narrator.say(
      `${PROMO_CODES.percentOff} is accepted: a ${discount} discount appears and the total drops from ${originalTotal} to ${discountedTotal} — no reload.`,
      { eyebrow: "Step 3 · Valid coupon" }
    );

    // BEAT 4 — removing it restores the original total.
    await narrator.focus(app.checkout.promoRemove);
    await app.checkout.promoRemove.click();
    await expect(app.checkout.promoApplied).toBeHidden();
    await expect(app.checkout.discountAmount).toBeHidden();
    await expect(app.checkout.totalAmount).toContainText(originalTotal);
    await expect(app.checkout.promoInput).toHaveValue("");
    const restoredTotal = await amountIn(app.checkout.totalAmount);
    await narrator.say(
      `Remove the coupon and the total is back to ${restoredTotal}, with the field cleared for a new code.`,
      { eyebrow: "Step 4 · Remove restores" }
    );

    // BEAT 5 — an expired coupon gets its own, specific message.
    await narrator.focus(app.checkout.promoInput);
    await app.checkout.applyPromoCode(PROMO_CODES.expired);
    await expect(app.checkout.promoError).toBeVisible();
    await expect(app.checkout.promoError).toContainText(/expired/i);
    await narrator.focus(app.checkout.promoError);
    const expiredMessage = (await app.checkout.promoError.innerText()).trim();
    await narrator.say(
      `${PROMO_CODES.expired} is refused with "${expiredMessage}" — it says expired, not just "invalid".`,
      { eyebrow: "Step 5 · Expired coupon" }
    );

    // BEAT 6 — and checkout is untouched by the rejection.
    await expect(app.checkout.promoApplied).toBeHidden();
    await expect(app.checkout.discountAmount).toBeHidden();
    await expect(app.checkout.totalAmount).toContainText(originalTotal);
    await expect(app.header.cartCount).toHaveText("1");
    await expect(app.checkout.name).toHaveValue(CUSTOMER_NAME);
    await expect(app.checkout.placeOrder).toBeEnabled();
    await narrator.focus(app.checkout.totalAmount);
    const totalAfterRejection = await amountIn(app.checkout.totalAmount);
    const cartCountAfterRejection = (await app.header.cartCount.innerText()).trim();
    await narrator.say(
      `Nothing broke: the total still reads ${totalAfterRejection}, the cart still holds ${cartCountAfterRejection} item, and the details already typed are kept.`,
      { eyebrow: "Step 6 · Cart intact" }
    );

    // LAND IT — the outcome, said as a result.
    await narrator.focus(app.checkout.placeOrder);
    await narrator.say(
      `A valid coupon took ${originalTotal} down to ${discountedTotal} instantly; an expired one was refused clearly — and the order is still ready to place.`,
      { eyebrow: "Outcome · Coupons that behave", holdMs: BEAT * 1.3 }
    );
  } finally {
    // ALWAYS — write the captions, pass or fail.
    narrator.writeVtt(path.join(testInfo.outputDir, "captions.vtt"));
  }
});
