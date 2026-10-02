import { create } from "zustand";
import { validatePromoCode, type AppliedPromo } from "../checkout/promoCodes";

export type PaymentMethod = "card" | "pay-in-restaurant";
export type TipPercent = 0 | 10 | 15 | 20;
export type DonationType = "none" | "fixed" | "percent";

export const DONATION_FIXED_OPTIONS = [1, 2, 5] as const;
export const DONATION_PERCENT_OPTIONS = [1, 2, 5] as const;

export type CheckoutForm = {
  fullName: string;
  email: string;
  zipCode: string;
  paymentMethod: PaymentMethod;
  cardNameOnCard: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  tipPercent: TipPercent;
  donationType: DonationType;
  /** USD amount when fixed; percentage value when percent; 0 otherwise. */
  donationAmount: number;
  donationCustomFixed: string;
  donationCustomPercent: string;
};

const emptyForm = (): CheckoutForm => ({
  fullName: "",
  email: "",
  zipCode: "",
  paymentMethod: "card",
  cardNameOnCard: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
  tipPercent: 0,
  donationType: "none",
  donationAmount: 0,
  donationCustomFixed: "",
  donationCustomPercent: "",
});

type CheckoutState = {
  form: CheckoutForm;
  errors: Record<string, string>;
  /** Filled in after submit so the confirmation page can greet the user. */
  confirmedUserName: string;
  /** Raw text in the promo code field, before it's applied. */
  promoCodeInput: string;
  appliedPromo: AppliedPromo | null;
  promoError: string;

  setField: <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) => void;
  resetForm: () => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  setConfirmedUserName: (name: string) => void;
  setPromoCodeInput: (value: string) => void;
  applyPromoCode: (subtotalUsd: number) => void;
  removePromoCode: () => void;
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  form: emptyForm(),
  errors: {},
  confirmedUserName: "",
  promoCodeInput: "",
  appliedPromo: null,
  promoError: "",

  setField: (field, value) =>
    set((state) => ({
      form: { ...state.form, [field]: value },
      // Clearing the error on edit gives instant feedback as the user fixes a field.
      errors: state.errors[field] ? omitKey(state.errors, field) : state.errors,
    })),

  resetForm: () =>
    set({
      form: emptyForm(),
      errors: {},
      promoCodeInput: "",
      appliedPromo: null,
      promoError: "",
    }),

  setErrors: (errors) => set({ errors }),
  clearError: (field) =>
    set((state) =>
      state.errors[field] ? { errors: omitKey(state.errors, field) } : state
    ),
  clearAllErrors: () => set({ errors: {} }),
  setConfirmedUserName: (name) => set({ confirmedUserName: name }),

  setPromoCodeInput: (value) => set({ promoCodeInput: value, promoError: "" }),
  applyPromoCode: (subtotalUsd) =>
    set((state) => {
      const result = validatePromoCode(state.promoCodeInput, subtotalUsd);
      if (!result.valid) {
        return { promoError: result.error };
      }
      return { appliedPromo: result.promo, promoError: "", promoCodeInput: "" };
    }),
  removePromoCode: () => set({ appliedPromo: null, promoError: "", promoCodeInput: "" }),
}));

function omitKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  const next = { ...obj };
  delete next[key];
  return next;
}

