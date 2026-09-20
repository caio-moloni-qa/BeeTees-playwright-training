import { test, expect } from "../helpers/fixtures";
import { ZIPS } from "../data/testData";

// Computed from the live 16-product seed, sorted by calories into 4 quartile
// buckets of 4 — see src/data/hunger.ts. If the seed catalog changes size or
// calorie spread, these expectations (and the feature) move together.
const LITTLE_HUNGRY_IDS = ["guarana", "doctor-bt", "fries-plain", "fries-lemon-pepper"];
const STARVING_IDS = [
  "combo-tenders-drink",
  "combo-tenders-cheeseburguer",
  "combo-bacon-fries",
  "combo-spicy-milkshake",
];

test.describe("Hunger meter", () => {
  test.beforeEach(async ({ app }) => {
    await app.gotoMenu();
  });

  test("Feeling hungry? button sits next to the category filter and opens the meter", async ({
    app,
  }) => {
    await expect(app.menu.categoryFilter).toBeVisible();
    await expect(app.menu.hungerButton).toBeVisible();

    await app.menu.openHungerMeter();

    await expect(app.hunger.pageRoot).toBeVisible();
  });

  test("Defaults to the lowest hunger level with four low-calorie picks", async ({ app }) => {
    await app.menu.openHungerMeter();

    await expect(app.hunger.levelLabel).toHaveText("A little hungry");
    await expect(app.hunger.resultCards).toHaveCount(4);
    for (const id of LITTLE_HUNGRY_IDS) {
      await expect(app.hunger.resultCard(id)).toBeVisible();
    }
  });

  test("Dragging the meter to Starving swaps in the biggest combos", async ({ app }) => {
    await app.menu.openHungerMeter();

    await app.hunger.setLevel(3);

    await expect(app.hunger.levelLabel).toHaveText("Starving");
    await expect(app.hunger.resultCards).toHaveCount(4);
    for (const id of STARVING_IDS) {
      await expect(app.hunger.resultCard(id)).toBeVisible();
    }
    for (const id of LITTLE_HUNGRY_IDS) {
      await expect(app.hunger.resultCard(id)).toBeHidden();
    }
  });

  test("Each keyboard step moves the meter one level and relabels it", async ({ app }) => {
    await app.menu.openHungerMeter();

    await app.hunger.setLevel(1);
    await expect(app.hunger.levelLabel).toHaveText("Hungry");

    await app.hunger.setLevel(2);
    await expect(app.hunger.levelLabel).toHaveText("Very hungry");
  });

  test("A recommended item can be added to the cart like any other product", async ({ app }) => {
    await app.saveLocation(ZIPS.newYork.zip, ZIPS.newYork.country);
    await app.menu.openHungerMeter();

    await app.hunger.addToCart(LITTLE_HUNGRY_IDS[0]);

    await expect(app.header.cartCount).toHaveText("1");
  });

  test("Back to menu returns to the product grid", async ({ app }) => {
    await app.menu.openHungerMeter();
    await app.hunger.goBackToMenu();

    await expect(app.menu.productGrid).toBeVisible();
  });
});
