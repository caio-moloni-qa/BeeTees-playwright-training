import * as path from "path";
import { test, expect } from "../helpers/fixtures";
import { Narrator } from "./narration";
import { ZIPS } from "../data/testData";

/**
 * Guest checkout (Brazil) walkthrough for a screen recording — a PACED, NARRATED take,
 * not a test.
 *
 *   npm run demo:guest-checkout-br
 *
 * A shopper with no account sets a Brazilian delivery ZIP, watches BeeTee's resolve the
 * nearest store and switch the whole app to Portuguese, adds a burger, and completes
 * checkout with a test card — proving the guest flow never asks for an account.
 *
 *   DEMO_BEAT_MS    hold per caption (default 5500)
 *   DEMO_SLOWMO_MS  delay between browser actions (default 600, set in playwright.config.ts)
 */
const BEAT = Number(process.env.DEMO_BEAT_MS ?? 5500);
const PRODUCT_ID = "cheeseburguer";
const CUSTOMER_NAME = "Ana Souza";
const CUSTOMER_EMAIL = "ana.souza@example.com";

test("Guest checkout (BR) — a shopper orders and pays without ever creating an account", async ({
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
      "BeeTee's lets a shopper order without creating an account — set a delivery ZIP, and the nearest store and language follow automatically.",
      { eyebrow: "Delivery & Checkout · Guest flow" }
    );

    // BEAT 1 — ZIP lookup resolves the nearest store.
    await narrator.focus(app.header.locationToggle, 700);
    await app.header.openLocation();
    await app.location.panel.waitFor({ state: "visible" });
    await narrator.focus(app.location.zip);
    await app.location.lookupAddress(ZIPS.londrina.zip, ZIPS.londrina.country);
    await expect(app.location.storeStatus).toContainText(ZIPS.londrina.store);
    const storeText = (await app.location.storeStatus.innerText()).trim();
    await narrator.say(
      `ZIP ${ZIPS.londrina.zip} resolves to "${storeText}" — the nearest store, found automatically.`,
      { eyebrow: "Step 1 · Store lookup" }
    );

    // BEAT 2 — save the location.
    await narrator.focus(app.location.save);
    await app.location.save.click();
    await expect(app.location.panel).not.toBeInViewport({ timeout: 5_000 });
    await expect(app.header.locationSetIndicator).toBeVisible();
    await narrator.say(
      "Location saved — the header now shows a delivery indicator, and the menu is ready to order from.",
      { eyebrow: "Step 2 · Location saved" }
    );

    // BEAT 3 — add a product to the cart.
    await narrator.focus(app.menu.productCard(PRODUCT_ID).first());
    await app.addToCart(PRODUCT_ID);
    await expect(app.toast).toBeVisible();
    await expect(app.header.cartCount).toHaveText("1");
    const toastText = (await app.toast.innerText()).trim();
    await narrator.say(
      `${toastText} — the cart badge updates immediately, confirming the add.`,
      { eyebrow: "Step 3 · Add to cart" }
    );

    // BEAT 4 — open the cart and read the localized price back.
    await app.header.openCart();
    await expect(app.cart.drawer).toBeVisible();
    await narrator.focus(app.cart.subtotal);
    const subtotalText = (await app.cart.subtotal.innerText()).trim();
    await narrator.say(
      `Cart subtotal reads ${subtotalText} — priced in Brazilian reais now that delivery is set to Brazil.`,
      { eyebrow: "Step 4 · Localized pricing" }
    );

    // BEAT 5 — go to checkout; the whole page is Portuguese now.
    await app.goToCheckout();
    const checkoutTitleText = (await app.checkout.title.first().innerText()).trim();
    await narrator.say(
      `The checkout heading reads "${checkoutTitleText}" — Portuguese, switched automatically by the Brazilian ZIP.`,
      { eyebrow: "Step 5 · Localized checkout" }
    );

    // BEAT 6 — fill contact details and a test card.
    await narrator.focus(app.checkout.name);
    await app.checkout.fillPersonalDetails(CUSTOMER_NAME, CUSTOMER_EMAIL);
    await narrator.focus(app.checkout.cardNumber);
    await app.checkout.fillValidCard();
    await narrator.say(
      "Contact details and a test card are filled in — the same validation rules a real customer would hit.",
      { eyebrow: "Step 6 · Payment details" }
    );

    // LAND IT — place the order and read the confirmation back.
    await narrator.focus(app.checkout.placeOrder);
    await app.checkout.placeOrderNow();
    await expect(app.confirmation.pageRoot).toBeVisible();
    await expect(app.confirmation.title).toContainText(CUSTOMER_NAME);
    const confirmTitleText = (await app.confirmation.title.innerText()).trim();
    const etaText = (await app.confirmation.eta.innerText()).trim();
    await narrator.say(
      `${confirmTitleText} Order confirmed — ${etaText}, no account required.`,
      { eyebrow: "Outcome · Guest order placed", holdMs: BEAT * 1.3 }
    );
  } finally {
    // ALWAYS — write the captions, pass or fail.
    narrator.writeVtt(path.join(testInfo.outputDir, "captions.vtt"));
  }
});
