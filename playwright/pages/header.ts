import type { Locator, Page } from "@playwright/test";

export class Header {
  readonly cartToggle: Locator;
  readonly cartCount: Locator;
  readonly home: Locator;
  readonly logo: Locator;
  readonly locationToggle: Locator;
  readonly locationSetIndicator: Locator;
  readonly storeBanner: Locator;
  readonly profileToggle: Locator;

  constructor(private readonly page: Page) {
    this.cartToggle = page.getByTestId("cart-toggle");
    this.cartCount = page.getByTestId("cart-count");
    this.home = page.getByTestId("header-home");
    this.logo = page.getByTestId("site-logo");
    this.locationToggle = page.getByTestId("location-toggle");
    this.locationSetIndicator = page.getByTestId("location-set-indicator");
    this.storeBanner = page.getByTestId("menu-store-banner");
    this.profileToggle = page.getByTestId("profile-toggle");
  }

  async openCart(options?: { force?: boolean }): Promise<void> {
    await this.cartToggle.click(options);
  }

  async openLocation(options?: { force?: boolean }): Promise<void> {
    await this.locationToggle.click(options);
  }

  async goHome(): Promise<void> {
    await this.home.click();
  }

  /** Opens login for a guest, or profile for an authenticated user. */
  async openProfile(): Promise<void> {
    await this.profileToggle.click();
  }
}
