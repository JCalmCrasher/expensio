import { useExpenseStore, CURRENCY_CONFIG } from "@/store/useExpenseStore";

/** Returns a formatter function: fmt(1200) → "$1,200.00" or "₦1,200.00" */
export function useCurrency() {
  const currency = useExpenseStore((s) => s.currency);
  const { symbol } = CURRENCY_CONFIG[currency];

  function fmt(amount: number): string {
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return { fmt, symbol, currency };
}
