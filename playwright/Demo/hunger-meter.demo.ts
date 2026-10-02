import * as path from "path";
import { test, expect } from "../helpers/fixtures";
import { Narrator } from "./narration";
import { ZIPS } from "../data/testData";

/**
 * Hunger meter walkthrough for a screen recording — a PACED, NARRATED take, not a test.
 *
 *   npm run demo:hunger-meter
 *
 * A shopper opens "Feeling hungry?", reads the picks at the lowest level, slides to
 * Starving and watches every pick change, adds one through the normal customizer, and
 * then checks the menu's own Combos filter: the Starving picks are exactly the combos.
 *
 * Picks are computed from live catalog data (src/data/hunger.ts), so this file never
 * names a product — it reads them off the screen.
 *
 *   DEMO_BEAT_MS    hold per caption (default 5500)
 *   DEMO_SLOWMO_MS  delay between browser actions (default 600, set in playwright.config.ts)
 */
const BEAT = Number(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.DEMO_BEAT_MS ?? 5500
);
const STARVING_LEVEL = 3;

test("Hunger meter — sliding the meter changes the picks, and Starving turns the menu into combos", async ({
  page,
  app,
}, testInfo) => {
  test.setTimeout(15 * 60_000);

  const resultNames = () => app.hunger.resultCards.locator(".product-card__name");
  const resultIds = async () =>
    (await app.hunger.resultCards.evaluateAll((cards) =>
      cards.map((c) => c.getAttribute("data-product-id") ?? "")
    )).sort();

  // INSTALL — narrator first, before the app loads.
  const narrator = new Narrator(page, BEAT);
  await narrator.install();

  try {
    await app.gotoMenu();

    // FRAME — why the viewer should care, in one sentence.
    await narrator.say(
      "Not sure what to order? The hunger meter turns \"how hungry are you?\" into a short list of picks sized to match.",
      { eyebrow: "Menu · Hunger meter" }
    );

    // BEAT 1 — delivery set, so picks can go straight into the cart later.
    await narrator.focus(app.header.locationToggle, 700);
    await app.saveLocation(ZIPS.newYork.zip, ZIPS.newYork.country);
    await expect(app.header.locationSetIndicator).toBeVisible();
    await narrator.focus(app.menu.hungerButton);
    const hungerButtonText = (await app.menu.hungerButton.innerText()).trim();
    await narrator.say(
      `Delivery is set. The "${hungerButtonText}" button sits right beside the category filter.`,
      { eyebrow: "Step 1 · The entry point" }
    );

    // BEAT 2 — the lowest level and its picks.
    await app.menu.openHungerMeter();
    await expect(app.hunger.pageRoot).toBeVisible();
    await expect(app.hunger.resultCards.first()).toBeVisible();
    await narrator.focus(app.hunger.levelLabel);
    const lowLabel = (await app.hunger.levelLabel.innerText()).trim();
    const lowNames = (await resultNames().allInnerTexts()).map((n) => n.trim());
    const lowIds = await resultIds();
    expect(lowIds.length).toBeGreaterThan(0);
    await narrator.focus(app.hunger.resultsGrid);
    await narrator.say(
      `At "${lowLabel}", the picks are light: ${lowNames.join(", ")}.`,
      { eyebrow: "Step 2 · Lowest level" }
    );

    // BEAT 3 — slide to the top and the picks change completely.
    await narrator.focus(app.hunger.slider);
    await app.hunger.setLevel(STARVING_LEVEL);
    await expect(app.hunger.levelLabel).not.toHaveText(lowLabel);
    await expect(app.hunger.resultCard(lowIds[0])).toBeHidden();
    const highLabel = (await app.hunger.levelLabel.innerText()).trim();
    const highIds = await resultIds();
    expect(highIds.length).toBeGreaterThan(0);
    expect(highIds.filter((id) => lowIds.includes(id))).toEqual([]);
    const highNames = (await resultNames().allInnerTexts()).map((n) => n.trim());
    await narrator.focus(app.hunger.resultsGrid);
    await narrator.say(
      `Slide to "${highLabel}" and every pick changes: ${highNames.join(", ")}. Not one item carried over.`,
      { eyebrow: "Step 3 · Top level" }
    );

    // BEAT 4 — a pick goes into the cart through the normal customizer.
    const pickId = highIds[0];
    const pickCard = app.hunger.resultCard(pickId);
    const pickName = (await pickCard.locator(".product-card__name").innerText()).trim();
    await narrator.focus(pickCard);
    await app.hunger.addToCart(pickId);
    await expect(app.toast).toBeVisible();
    await expect(app.header.cartCount).toHaveText("1");
    const cartCount = (await app.header.cartCount.innerText()).trim();
    await narrator.say(
      `"${pickName}" goes through the usual customizer, just like any menu item. The cart badge now reads ${cartCount}.`,
      { eyebrow: "Step 4 · Straight to the cart" }
    );

    // BEAT 5 — cross-check against the menu's own Combos filter.
    await narrator.focus(app.hunger.backToMenu);
    await app.hunger.goBackToMenu();
    await expect(app.menu.productGrid).toBeVisible();
    await narrator.focus(app.menu.filterButton("combo"));
    await app.menu.filterBy("combo");
    await expect(app.menu.productCards).toHaveCount(highIds.length);
    const comboIds = (
      await app.menu.productCards.evaluateAll((cards) =>
        cards.map((c) => c.getAttribute("data-product-id") ?? "")
      )
    ).sort();
    expect(comboIds).toEqual(highIds);
    const comboFilterText = (await app.menu.filterButton("combo").innerText()).trim();
    await narrator.focus(app.menu.productGrid);
    await narrator.say(
      `The menu's own "${comboFilterText}" filter shows ${comboIds.length} items — exactly the ${highIds.length} "${highLabel}" picks. At the top, it's all combos.`,
      { eyebrow: "Step 5 · Cross-check" }
    );

    // LAND IT — the outcome, said as a result.
    await narrator.say(
      `Moving the meter from "${lowLabel}" to "${highLabel}" swapped every suggestion, and the hungriest level is the combo menu — ready to order.`,
      { eyebrow: "Outcome · Picks that follow hunger", holdMs: BEAT * 1.3 }
    );
  } finally {
    // ALWAYS — write the captions, pass or fail.
    narrator.writeVtt(path.join(testInfo.outputDir, "captions.vtt"));
  }
});
