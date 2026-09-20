import type { Locator, Page } from "@playwright/test";
import { CartDrawer } from "./cartDrawer";
import { CheckoutPage } from "./checkoutPage";
import { ConfirmationPage } from "./confirmationPage";
import { HungerMeterPage } from "./hungerMeterPage";
import { Header } from "./header";
import { LocationDrawer } from "./locationDrawer";
import { MenuPage } from "./menuPage";
import type { CountryCode } from "../data/testData";

export class App {
  readonly cart: CartDrawer;
  readonly checkout: CheckoutPage;
  readonly confirmation: ConfirmationPage;
  readonly header: Header;
  readonly location: LocationDrawer;
  readonly menu: MenuPage;
  readonly hunger: HungerMeterPage;
  readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.cart = new CartDrawer(page);
    this.checkout = new CheckoutPage(page);
    this.confirmation = new ConfirmationPage(page);
    this.header = new Header(page);
    this.location = new LocationDrawer(page);
    this.menu = new MenuPage(page);
    this.hunger = new HungerMeterPage(page);
    this.toast = page.getByTestId("cart-toast");
  }

  async gotoMenu(): Promise<void> {
    await this.menu.goto();
  }

  async saveLocation(zip: string, country: CountryCode): Promise<void> {
    await this.header.openLocation();
    await this.location.panel.waitFor({ state: "visible" });
    await this.location.saveLocation(zip, country);
  }

  async lookupAddress(zip: string, country: CountryCode): Promise<void> {
    await this.header.openLocation();
    await this.location.panel.waitFor({ state: "visible" });
    await this.location.lookupAddress(zip, country);
  }

  async addToCart(productId: string): Promise<void> {
    await this.menu.addProductWithDefaultCustomization(productId);
  }

  async goToCheckout(): Promise<void> {
    await this.cart.goCheckout.click();
    await this.page.getByTestId("page-spinner").waitFor({ state: "visible" });
    await this.page.getByTestId("page-spinner").waitFor({
      state: "hidden",
      timeout: 4_000,
    });
    await this.checkout.pageRoot.waitFor({ state: "visible" });
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async reloadToMenu(): Promise<void> {
    await this.reload();
    await this.menu.productGrid.waitFor({ state: "visible" });
  }

  async clearSessionAndReloadToMenu(): Promise<void> {
    await this.page.context().clearCookies();
    await this.reloadToMenu();
  }

  dismissNextDialog(): void {
    this.page.once("dialog", (dialog) => {
      void dialog.dismiss();
    });
  }
}
