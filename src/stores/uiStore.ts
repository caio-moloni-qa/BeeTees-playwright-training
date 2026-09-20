import { create } from "zustand";

export type AppView =
  | "shop"
  | "checkout"
  | "confirmation"
  | "login"
  | "signup"
  | "profile"
  | "forgot-password"
  | "reset-password";

export type MenuFilter = "all" | "burger" | "tenders" | "combo" | "drink" | "side";

type UiState = {
  view: AppView;
  menuFilter: MenuFilter;
  menuSearch: string;
  /** Toast message — empty string means hidden. */
  toastItemName: string;
  /** Stable counter so the toast component can re-trigger its hide-timer on repeated adds. */
  toastVersion: number;
  /** Stable counter used to re-render locale consumers after the global locale changes. */
  localeVersion: number;
  pageSpinnerVisible: boolean;
  customizerProductId: string | null;
  /**
   * Product the user tried to add to the cart while no delivery location was set.
   * The location-save handler reads this, adds the item, then clears it.
   */
  pendingAddProductId: string | null;
  /**
   * Hands the dev reset token from ForgotPasswordPage to ResetPasswordPage
   * without a real router/query string. Cleared once the reset page reads it.
   */
  pendingResetToken: string;

  setView: (view: AppView) => void;
  setMenuFilter: (filter: MenuFilter) => void;
  setMenuSearch: (query: string) => void;
  showToast: (itemName: string) => void;
  hideToast: () => void;
  bumpLocaleVersion: () => void;
  showPageSpinner: () => void;
  hidePageSpinner: () => void;
  openCustomizer: (productId: string) => void;
  closeCustomizer: () => void;
  setPendingAddProductId: (productId: string | null) => void;
  setPendingResetToken: (token: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  view: "shop",
  menuFilter: "all",
  menuSearch: "",
  toastItemName: "",
  toastVersion: 0,
  localeVersion: 0,
  pageSpinnerVisible: false,
  customizerProductId: null,
  pendingAddProductId: null,
  pendingResetToken: "",

  setView: (view) => set({ view }),
  setMenuFilter: (menuFilter) => set({ menuFilter }),
  setMenuSearch: (menuSearch) => set({ menuSearch: menuSearch.toLowerCase() }),
  showToast: (itemName) =>
    set((s) => ({ toastItemName: itemName, toastVersion: s.toastVersion + 1 })),
  hideToast: () => set({ toastItemName: "" }),
  bumpLocaleVersion: () => set((s) => ({ localeVersion: s.localeVersion + 1 })),
  showPageSpinner: () => set({ pageSpinnerVisible: true }),
  hidePageSpinner: () => set({ pageSpinnerVisible: false }),
  openCustomizer: (customizerProductId) => set({ customizerProductId }),
  closeCustomizer: () => set({ customizerProductId: null }),
  setPendingAddProductId: (pendingAddProductId) => set({ pendingAddProductId }),
  setPendingResetToken: (pendingResetToken) => set({ pendingResetToken }),
}));
