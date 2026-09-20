export const SPICY_PRODUCT_IDS = [
  "bt-special",
  "pack-tenders-spicy",
  "combo-spicy-milkshake",
] as const;

export const ZIPS = {
  londrina: { zip: "86015280", country: "BR", store: "BeeTee's Higienopolis" },
  saoPaulo: { zip: "05413010", country: "BR", store: "BeeTee's Pinheiros" },
  newYork: { zip: "10001", country: "US", store: "BeeTee's Midtown" },
  curitiba: { zip: "80010010", country: "BR", store: null },
} as const;

export const CARD = {
  name: "Test User",
  number: "4111111111111111",
  expiry: "1228",
  cvc: "123",
} as const;

export const PROMO_CODES = {
  percentOff: "WELCOME10",
  fixedOff: "SAVE5",
  fixedOffMinOrderUsd: 15,
  expired: "BEETEES2024",
  unknown: "NOTAREALCODE",
} as const;

export type CountryCode = "BR" | "US";
