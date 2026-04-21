// store/useExpenseStore.ts
import { create } from "zustand";
import { currentMonthKey } from "@/lib/monthKey";

interface ExpenseStore {
  // Active month context
  activeMonthKey: string; // "YYYY-MM", defaults to current month
  setActiveMonthKey: (key: string) => void;

  // Ephemeral UI state
  openPaymentFormId: number | null; // which expense card has the payment form open
  setOpenPaymentFormId: (id: number | null) => void;
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  activeMonthKey: currentMonthKey(),
  setActiveMonthKey: (key) => set({ activeMonthKey: key }),

  openPaymentFormId: null,
  setOpenPaymentFormId: (id) => set({ openPaymentFormId: id }),
}));
