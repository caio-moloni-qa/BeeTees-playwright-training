import { formatPrice, t } from "../i18n/locale";

export type PromoCodeDefinition = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderUsd?: number;
  expired?: boolean;
};

export const PROMO_CODES: readonly PromoCodeDefinition[] = [
  { code: "WELCOME10", type: "percent", value: 10 },
  { code: "SAVE5", type: "fixed", value: 5, minOrderUsd: 15 },
  { code: "BEETEES2024", type: "percent", value: 20, expired: true },
];

export type AppliedPromo = {
  code: string;
  label: string;
  discountUsd: number;
};

export type PromoValidationResult =
  | { valid: true; promo: AppliedPromo }
  | { valid: false; error: string };

function findPromo(rawCode: string): PromoCodeDefinition | undefined {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }
  return PROMO_CODES.find((p) => p.code === normalized);
}

/**
 * Percent codes discount the subtotal only (not tip/donation) — the common
 * real-world rule. Fixed codes subtract a flat amount; the caller clamps the
 * grand total at zero so a fixed code can never push a total negative.
 */
export function validatePromoCode(
  rawCode: string,
  subtotalUsd: number
): PromoValidationResult {
  const definition = findPromo(rawCode);

  if (!definition) {
    return { valid: false, error: t("checkoutErrorPromoUnknown") };
  }
  if (definition.expired) {
    return { valid: false, error: t("checkoutErrorPromoExpired") };
  }
  if (definition.minOrderUsd != null && subtotalUsd < definition.minOrderUsd) {
    return {
      valid: false,
      error: t("checkoutErrorPromoMinOrder", {
        amount: formatPrice(definition.minOrderUsd),
      }),
    };
  }

  const discountUsd =
    definition.type === "percent"
      ? (subtotalUsd * definition.value) / 100
      : definition.value;

  const label =
    definition.type === "percent"
      ? `${definition.value}%`
      : formatPrice(definition.value);

  return {
    valid: true,
    promo: { code: definition.code, label, discountUsd },
  };
}
