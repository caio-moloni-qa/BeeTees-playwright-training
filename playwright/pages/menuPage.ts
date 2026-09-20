import type { Locator, Page } from "@playwright/test";
import type { MenuFilter } from "../../src/stores/uiStore";
import { Header } from "./header";

export class MenuPage {
  readonly header: Header;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly productImages: Locator;
  readonly categoryFilter: Locator;
  readonly promoBanner: Locator;
  readonly searchToggle: Locator;
  readonly searchInput: Locator;
  readonly searchClose: Locator;
  readonly hungerButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new Header(page);
    this.productGrid = page.getByTestId("product-grid");
    this.productCards = this.productGrid.locator(".product-card");
    this.productImages = this.productGrid.getByTestId("product-image");
    this.categoryFilter = page.getByTestId("menu-category-filter");
    this.promoBanner = page.getByTestId("promo-banner");
    this.searchToggle = page.getByTestId("menu-search-toggle");
    this.searchInput = page.getByTestId("menu-search");
    this.searchClose = page.getByTestId("menu-search-close");
    this.hungerButton = page.getByTestId("hunger-button");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  filterButton(filter: MenuFilter): Locator {
    return this.page.getByTestId(`menu-category-filter-${filter}`);
  }

  async filterBy(filter: MenuFilter): Promise<void> {
    await this.filterButton(filter).click();
  }

  productCard(productId: string): Locator {
    return this.productGrid.locator(`[data-product-id="${productId}"]`);
  }

  productName(card: Locator): Locator {
    return card.locator(".product-card__name");
  }

  productDescription(card: Locator): Locator {
    return card.locator(".product-card__desc");
  }

  productPrice(card: Locator): Locator {
    return card.locator(".product-card__price");
  }

  productPrices(): Locator {
    return this.productGrid.locator(".product-card__price");
  }

  productImage(card: Locator): Locator {
    return card.getByTestId("product-image");
  }

  productBadge(productId: string): Locator {
    return this.productCard(productId).locator(".product-card__badge");
  }

  promoSlide(promoId: string): Locator {
    return this.page.getByTestId(`promo-slide-${promoId}`);
  }

  async allProductPricesText(): Promise<string[]> {
    return this.productPrices().allTextContents();
  }

  async addProduct(productId: string): Promise<void> {
    await this.productCard(productId).getByTestId("add-to-cart").click();
  }

  async addProductWithDefaultCustomization(productId: string): Promise<void> {
    await this.addProduct(productId);
    await this.page.getByTestId("customizer-add-to-cart").click();
  }

  async openSearch(): Promise<void> {
    await this.searchToggle.click();
  }

  async searchFor(query: string): Promise<void> {
    await this.openSearch();
    await this.searchInput.fill(query);
  }

  async openHungerMeter(): Promise<void> {
    await this.hungerButton.click();
  }
}
