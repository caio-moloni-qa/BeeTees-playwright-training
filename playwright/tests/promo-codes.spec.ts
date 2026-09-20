import { test, expect } from "../helpers/fixtures";
import { PROMO_CODES, ZIPS } from "../data/testData";

const PRODUCT_ID = "cheeseburguer";
const CUSTOMER = "Alice";
const EMAIL = "alice@example.com";

test.describe("Promo codes at checkout", () => {
  test.beforeEach(async ({ app }) => {
    // A US ZIP keeps pricing in USD, so the discount math below is exact.
    await app.gotoMenu();
    await app.saveLocation(ZIPS.newYork.zip, ZIPS.newYork.country);
    await app.addToCart(PRODUCT_ID);
    await app.header.openCart();
    await app.goToCheckout();
    await app.checkout.fillPersonalDetails(CUSTOMER, EMAIL);
  });

  test("Apply button is disabled until a code is typed", async ({ app }) => {
    await expect(app.checkout.promoApply).toBeDisabled();

    await app.checkout.promoInput.fill(PROMO_CODES.percentOff);
    await expect(app.checkout.promoApply).toBeEnabled();

    await app.checkout.promoInput.fill("");
    await expect(app.checkout.promoApply).toBeDisabled();
  });

  test("Valid percent code discounts the subtotal and total", async ({ app }) => {
    await app.checkout.applyPromoCode(PROMO_CODES.percentOff);

    await expect(app.checkout.promoApplied).toContainText(PROMO_CODES.percentOff);
    await expect(app.checkout.discountAmount).toContainText("$0.35");
    await expect(app.checkout.totalAmount).toContainText("$3.14");
  });

  test("Valid fixed code discounts the total by an exact amount once the minimum order is met", async ({
    app,
  }) => {
    await app.header.openCart();
    // 5 x $3.49 = $17.45, clearing SAVE5's $15 minimum.
    for (let i = 0; i < 4; i++) {
      await app.cart.incrementFirstLine();
    }
    await app.cart.close();
    await expect(app.cart.drawer).toBeHidden();

    await app.checkout.applyPromoCode(PROMO_CODES.fixedOff);

    await expect(app.checkout.promoApplied).toContainText(PROMO_CODES.fixedOff);
    await expect(app.checkout.discountAmount).toContainText("$5.00");
    await expect(app.checkout.totalAmount).toContainText("$12.45");
  });

  test("Unknown code shows an error and leaves the total unchanged", async ({ app }) => {
    await app.checkout.applyPromoCode(PROMO_CODES.unknown);

    await expect(app.checkout.promoError).toContainText("This promo code isn't valid.");
    await expect(app.checkout.promoApplied).toBeHidden();
    await expect(app.checkout.discountAmount).toBeHidden();
    await expect(app.checkout.totalAmount).toContainText("$3.49");
  });

  test("Expired code shows an expiry-specific error", async ({ app }) => {
    await app.checkout.applyPromoCode(PROMO_CODES.expired);

    await expect(app.checkout.promoError).toContainText("This promo code has expired.");
    await expect(app.checkout.promoApplied).toBeHidden();
  });

  test("Fixed code below the minimum order shows the minimum required", async ({ app }) => {
    await app.checkout.applyPromoCode(PROMO_CODES.fixedOff);

    await expect(app.checkout.promoError).toContainText(
      `Minimum order of $${PROMO_CODES.fixedOffMinOrderUsd}.00 required.`
    );
    await expect(app.checkout.promoApplied).toBeHidden();
    await expect(app.checkout.totalAmount).toContainText("$3.49");
  });

  test("Removing an applied code restores the original total", async ({ app }) => {
    await app.checkout.applyPromoCode(PROMO_CODES.percentOff);
    await expect(app.checkout.totalAmount).toContainText("$3.14");

    await app.checkout.promoRemove.click();

    await expect(app.checkout.promoApplied).toBeHidden();
    await expect(app.checkout.promoInput).toBeVisible();
    await expect(app.checkout.promoInput).toHaveValue("");
    await expect(app.checkout.discountAmount).toBeHidden();
    await expect(app.checkout.totalAmount).toContainText("$3.49");
  });

  test("Code matching is case-insensitive", async ({ app }) => {
    await app.checkout.applyPromoCode(PROMO_CODES.percentOff.toLowerCase());

    await expect(app.checkout.promoApplied).toContainText(PROMO_CODES.percentOff);
    await expect(app.checkout.totalAmount).toContainText("$3.14");
  });
});
