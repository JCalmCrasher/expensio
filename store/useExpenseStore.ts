// store/useExpenseStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentMonthKey } from "@/lib/monthKey";

export type Currency = "USD" | "NGN";

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; label: string; flag: string }> = {
  USD: { symbol: "$", label: "USD", flag: "🇺🇸" },
  NGN: { symbol: "₦", label: "NGN", flag: "🇳🇬" },
};

interface ExpenseStore {
  activeMonthKey: string;
  setActiveMonthKey: (key: string) => void;

  openPaymentFormId: number | null;
  setOpenPaymentFormId: (id: number | null) => void;

  currency: Currency;
  setCurrency: (c: Currency) => void;

  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set) => ({
      activeMonthKey: currentMonthKey(),
      setActiveMonthKey: (key) => set({ activeMonthKey: key }),

      openPaymentFormId: null,
      setOpenPaymentFormId: (id) => set({ openPaymentFormId: id }),

      currency: "NGN",
      setCurrency: (c) => set({ currency: c }),

      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "expensio-store",
      partialize: (state) => ({ currency: state.currency }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Returns true once Zustand has rehydrated from localStorage */
export function useHydrated() {
  return useExpenseStore((s) => s._hasHydrated);
}
