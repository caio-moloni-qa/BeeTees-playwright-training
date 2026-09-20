import type { Product } from "../types/product";

export type Locale = "en-US" | "pt-BR";

let activeLocale: Locale = "en-US";

export function setLocale(countryCode: string): void {
  activeLocale = countryCode.toUpperCase() === "BR" ? "pt-BR" : "en-US";
}

export function getLocale(): Locale {
  return activeLocale;
}

const USD_TO_BRL = 5.7;

export function fromDisplayPrice(localAmount: number): number {
  return activeLocale === "pt-BR" ? localAmount / USD_TO_BRL : localAmount;
}

export function formatPrice(usd: number): string {
  if (activeLocale === "pt-BR") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(usd * USD_TO_BRL);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(usd);
}

export function productName(product: Product): string {
  return (
    product.translations?.[activeLocale]?.name ??
    product.translations?.["en-US"]?.name ??
    product.name
  );
}

export function productShortName(product: Product): string {
  return (
    product.translations?.[activeLocale]?.shortName ??
    product.translations?.["en-US"]?.shortName ??
    product.shortName
  );
}

export function localizedProductDescription(product: Product): string {
  return (
    product.translations?.[activeLocale]?.description ??
    product.translations?.["en-US"]?.description ??
    product.description
  );
}

export type TranslationKey =
  | "categoryAll"
  | "categoryBurger"
  | "categoryTender"
  | "categoryCombo"
  | "categoryDrink"
  | "categorySide"
  | "menuHeading"
  | "menuCategoryLabel"
  | "menuSearchLabel"
  | "menuSearchPlaceholder"
  | "menuOrderingFrom"
  | "menuAddToCart"
  | "menuAddToCartHint"
  | "menuNoItems"
  | "spicyBadge"
  | "caloriesLabel"
  | "caloriesValue"
  | "promoRegionLabel"
  | "promoDotLabel"
  | "promoComboEyebrow"
  | "promoComboHeadline"
  | "promoComboSubline"
  | "promoSpicyEyebrow"
  | "promoSpicyHeadline"
  | "promoSpicySubline"
  | "promoDeliveryEyebrow"
  | "promoDeliveryHeadline"
  | "promoDeliverySubline"
  | "customizerTitle"
  | "customizerClose"
  | "customizerBasePrice"
  | "customizerPatties"
  | "customizerPattySingular"
  | "customizerPattyPlural"
  | "customizerAddOns"
  | "customizerQuantity"
  | "customizerDecreaseQuantity"
  | "customizerIncreaseQuantity"
  | "customizerAddToCart"
  | "customizerExtraEverything"
  | "customizerExtraCheese"
  | "customizerExtraBacon"
  | "customizerExtraGrilledOnions"
  | "customizerExtraJalapenos"
  | "customizerExtraSauce"
  | "customizerExtraSpicyDust"
  | "customizerExtraLargePack"
  | "customizerExtraLargeDrink"
  | "customizerExtraLoadedFries"
  | "customizerExtraLargeSize"
  | "customizerExtraSeasoning"
  | "customizerExtraDippingSauce"
  | "customizerExtraNoIce"
  | "cartTitle"
  | "cartEmpty"
  | "cartEach"
  | "cartRemove"
  | "cartDecrease"
  | "cartIncrease"
  | "cartSubtotal"
  | "cartGoToCheckout"
  | "checkoutBackToMenu"
  | "checkoutTitle"
  | "checkoutSectionDetails"
  | "checkoutName"
  | "checkoutEmail"
  | "checkoutSectionDelivery"
  | "checkoutZip"
  | "checkoutStreet"
  | "checkoutNeighborhood"
  | "checkoutCityState"
  | "checkoutCountry"
  | "checkoutComplement"
  | "checkoutSectionPayment"
  | "checkoutPayCard"
  | "checkoutPayRestaurant"
  | "checkoutCardDetails"
  | "checkoutCardName"
  | "checkoutCardNumber"
  | "checkoutExpiry"
  | "checkoutSecurityCode"
  | "checkoutOrderSummary"
  | "checkoutNoItems"
  | "checkoutSubtotal"
  | "checkoutTip"
  | "checkoutTipNone"
  | "checkoutTotal"
  | "checkoutDonation"
  | "checkoutDonationAssociation"
  | "checkoutDonationNone"
  | "checkoutDonationFixed"
  | "checkoutDonationPercent"
  | "checkoutDonationCustom"
  | "checkoutPlaceOrder"
  | "checkoutErrorNameRequired"
  | "checkoutErrorEmailRequired"
  | "checkoutErrorEmailInvalid"
  | "checkoutErrorZipRequired"
  | "checkoutErrorCardNameRequired"
  | "checkoutErrorCardNameInvalid"
  | "checkoutErrorCardNumberRequired"
  | "checkoutErrorCardNumberInvalid"
  | "checkoutErrorExpiryRequired"
  | "checkoutErrorExpiryInvalid"
  | "checkoutErrorCvcRequired"
  | "checkoutErrorCvcInvalid"
  | "confirmTitle"
  | "confirmSubtitle"
  | "confirmEta"
  | "confirmDeliveryAddress"
  | "confirmBackToMenu"
  | "locationPanelTitle"
  | "locationIntro"
  | "locationStoresTitleBR"
  | "locationStoresTitleUS"
  | "locationStoreAvailable"
  | "locationStoreUnavailable"
  | "locationStoreHint"
  | "locationCountryLabel"
  | "locationCountryUS"
  | "locationCountryBR"
  | "locationZip"
  | "locationLookupBtn"
  | "locationLookingUp"
  | "locationStreet"
  | "locationStreetPlaceholder"
  | "locationNeighborhood"
  | "locationCity"
  | "locationStateProv"
  | "locationCountryFromLookup"
  | "locationComplement"
  | "locationComplementPlaceholder"
  | "locationSaveBtn"
  | "locationSaving"
  | "locationSaveError"
  | "locationLoadError"
  | "locationStoreRequired"
  | "headerCloseLocation"
  | "headerOpenLocation"
  | "headerCloseCart"
  | "headerOpenCart"
  | "toastAddedToCart"
  | "hungerButton"
  | "hungerPageTitle"
  | "hungerPageSubtitle"
  | "hungerLevelLittle"
  | "hungerLevelHungry"
  | "hungerLevelVery"
  | "hungerLevelStarving"
  | "hungerResultsHeading"
  | "hungerBackToMenu"
  | "authLoginTitle"
  | "authLoginSubtitle"
  | "authSignupTitle"
  | "authSignupSubtitle"
  | "authEmail"
  | "authPassword"
  | "authConfirmPassword"
  | "authLogin"
  | "authSignup"
  | "authCreateAccount"
  | "authHaveAccount"
  | "authNeedAccount"
  | "authContinueGuest"
  | "authPasswordMismatch"
  | "authPasswordTooShort"
  | "authLoginSuccess"
  | "authSignupSuccess"
  | "authDemoHint"
  | "authProfile"
  | "authAccountDetails"
  | "authPreviousOrders"
  | "authLogout"
  | "authSaveChanges"
  | "authFirstName"
  | "authLastName"
  | "authNoOrders"
  | "authOrderDetails"
  | "authReorder"
  | "authClose"
  | "authMaybeLater"
  | "authReorderPrompt"
  | "authItemCount"
  | "authLoginRequired";

type Dictionary = Partial<Record<TranslationKey, string>>;

let translations: Record<Locale, Dictionary> = { "en-US": {}, "pt-BR": {} };

export function setTranslationDictionaries(
  next: Partial<Record<Locale, Dictionary>>
): void {
  translations = {
    "en-US": next["en-US"] ?? {},
    "pt-BR": next["pt-BR"] ?? {},
  };
}

export function t(key: TranslationKey, vars?: Record<string, string>): string {
  const dict = translations[activeLocale];
  let str = dict[key] ?? translations["en-US"][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{${k}}`).join(v);
    }
  }
  return str;
}
