import { useExpenseStore, useHydrated, CURRENCY_CONFIG } from "@/store/useExpenseStore";

/** prevents a flash of wrong currency on PWA cold start. */
export function useCurrency() {
  const currency = useExpenseStore((s) => s.currency);
  const hydrated = useHydrated();

  // Use USD as the stable default until localStorage has been read.
  // This prevents a flash where amounts briefly show in the wrong currency.
  const resolvedCurrency = hydrated ? currency : "NGN";
  const { symbol } = CURRENCY_CONFIG[resolvedCurrency];

  function fmt(amount: number): string {
    // Use "en-US" explicitly to avoid locale-dependent formatting differences
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return { fmt, symbol, currency: resolvedCurrency };
}
