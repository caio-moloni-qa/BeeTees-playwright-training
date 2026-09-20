import type { Product } from "../types/product";
import type { TranslationKey } from "../i18n/locale";

export const HUNGER_LEVEL_COUNT = 4;

/** Index 0 = a little hungry, last index = starving. */
export const HUNGER_LEVEL_LABELS: readonly TranslationKey[] = [
  "hungerLevelLittle",
  "hungerLevelHungry",
  "hungerLevelVery",
  "hungerLevelStarving",
];

export function clampHungerLevel(level: number): number {
  return Math.min(HUNGER_LEVEL_COUNT - 1, Math.max(0, Math.round(level)));
}

/**
 * Splits the live catalog into HUNGER_LEVEL_COUNT calorie-sorted buckets and
 * returns the one matching `level`. Computed from product data rather than
 * hardcoded IDs/thresholds, so picks stay correct if the seeded catalog changes.
 */
export function pickForHungerLevel(
  products: readonly Product[],
  level: number
): Product[] {
  if (products.length === 0) {
    return [];
  }
  const sorted = [...products].sort((a, b) => a.caloriesKcal - b.caloriesKcal);
  const bucketSize = Math.ceil(sorted.length / HUNGER_LEVEL_COUNT);
  const clamped = clampHungerLevel(level);
  const start = clamped * bucketSize;
  return sorted.slice(start, start + bucketSize);
}
