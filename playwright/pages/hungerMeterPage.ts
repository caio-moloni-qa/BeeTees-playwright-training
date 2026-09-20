import type { Locator, Page } from "@playwright/test";

export class HungerMeterPage {
  readonly pageRoot: Locator;
  readonly backToMenu: Locator;
  readonly levelLabel: Locator;
  readonly slider: Locator;
  readonly sliderThumb: Locator;
  readonly resultsHeading: Locator;
  readonly resultsGrid: Locator;
  readonly resultCards: Locator;

  constructor(private readonly page: Page) {
    this.pageRoot = page.getByTestId("hunger-page");
    this.backToMenu = page.getByTestId("hunger-back-to-menu");
    this.levelLabel = page.getByTestId("hunger-level-label");
    this.slider = page.getByTestId("hunger-meter-slider");
    this.sliderThumb = this.slider.locator('input[type="range"]');
    this.resultsHeading = page.getByTestId("hunger-results-heading");
    this.resultsGrid = page.getByTestId("hunger-results-grid");
    this.resultCards = this.resultsGrid.locator(".product-card");
  }

  resultCard(productId: string): Locator {
    return this.resultsGrid.locator(`.product-card[data-product-id="${productId}"]`);
  }

  async addToCart(productId: string): Promise<void> {
    await this.resultCard(productId).getByTestId("add-to-cart").click();
    await this.page.getByTestId("customizer-add-to-cart").click();
  }

  /** Focuses the thumb and drives it by keyboard — robust regardless of pixel geometry. */
  async setLevel(level: number): Promise<void> {
    await this.sliderThumb.focus();
    await this.page.keyboard.press("Home");
    for (let i = 0; i < level; i++) {
      await this.page.keyboard.press("ArrowRight");
    }
  }

  async goBackToMenu(): Promise<void> {
    await this.backToMenu.click();
  }
}
