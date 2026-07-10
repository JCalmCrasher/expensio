"use client";

import { useCurrency } from "@/lib/useCurrency";
import { MonthlySummarySkeleton } from "@/components/MonthlySummarySkeleton";

interface MonthlySummaryProps {
  totalOwed: number;
  totalPaid: number;
  insight?: string | null;
  loading?: boolean;
}

function heroTone(remaining: number, totalOwed: number) {
  const ratio = totalOwed > 0 ? remaining / totalOwed : 1;

  if (ratio > 0.2) {
    return {
      card: "bg-accent",
      heading: "text-accent-foreground/80",
      amount: "text-accent-foreground",
      detail: "text-accent-foreground/80",
      insight: "text-accent-foreground/70",
    };
  }

  if (ratio > 0.05) {
    return {
      card: "bg-amber-50 dark:bg-amber-950/40",
      heading: "text-amber-800/80 dark:text-amber-400/80",
      amount: "text-amber-800 dark:text-amber-400",
      detail: "text-amber-700/80 dark:text-amber-400/80",
      insight: "text-amber-700/70 dark:text-amber-400/70",
    };
  }

  return {
    card: "bg-red-50 dark:bg-red-950/40",
    heading: "text-red-800/80 dark:text-red-400/80",
    amount: "text-red-800 dark:text-red-400",
    detail: "text-red-700/80 dark:text-red-400/80",
    insight: "text-red-700/70 dark:text-red-400/70",
  };
}

export function MonthlySummary({
  totalOwed,
  totalPaid,
  insight = null,
  loading = false,
}: MonthlySummaryProps) {
  const remaining = Math.max(0, totalOwed - totalPaid);
  const { fmt } = useCurrency();
  const tone = heroTone(remaining, totalOwed);

  if (loading) {
    return <MonthlySummarySkeleton />;
  }

  return (
    <div
      id="tour-summary"
      className={`rounded-3xl px-6 py-10 text-center transition-colors duration-500 ${tone.card}`}
    >
      <p className={`text-sm font-medium ${tone.heading}`}>Remaining this month</p>
      <p className={`mt-2 text-5xl font-bold tracking-tight tabular-nums ${tone.amount}`}>
        {fmt(remaining)}
      </p>
      {totalOwed > 0 && (
        <p className={`mt-3 text-sm ${tone.detail}`}>
          {fmt(totalPaid)} paid of {fmt(totalOwed)}
        </p>
      )}
      {insight && (
        <p className={`mx-auto mt-4 max-w-md text-sm leading-relaxed ${tone.insight}`}>
          {insight}
        </p>
      )}
    </div>
  );
}
