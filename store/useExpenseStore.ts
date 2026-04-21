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
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set) => ({
      activeMonthKey: currentMonthKey(),
      setActiveMonthKey: (key) => set({ activeMonthKey: key }),

      openPaymentFormId: null,
      setOpenPaymentFormId: (id) => set({ openPaymentFormId: id }),

      currency: "USD",
      setCurrency: (c) => set({ currency: c }),
    }),
    {
      name: "expensio-store",
      // Only persist currency preference; month key and UI state reset on load
      partialize: (state) => ({ currency: state.currency }),
    }
  )
);
