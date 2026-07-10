"use client";

import { computeMonthlySummary } from "@/lib/expenseLogic";
import { buildSummaryInsight } from "@/lib/summaryInsight";
import { useCurrency } from "@/lib/useCurrency";
import type { Category, Expense } from "@/types/expense";

interface MonthlySummaryProps {
  expenses: Expense[];
  allExpenses?: Expense[];
  categories?: Category[];
}

function heroTone(remaining: number, totalOwed: number) {
  if (totalOwed <= 0) {
    return {
      card: "bg-green-50 dark:bg-green-950/40",
      amount: "text-foreground",
      label: "text-muted-foreground",
    };
  }
  const ratio = remaining / totalOwed;
  if (ratio > 0.5) {
    return {
      card: "bg-green-50 dark:bg-green-950/40",
      amount: "text-green-800 dark:text-green-400",
      label: "text-muted-foreground",
    };
  }
  if (ratio > 0.2) {
    return {
      card: "bg-amber-50 dark:bg-amber-950/40",
      amount: "text-amber-800 dark:text-amber-400",
      label: "text-muted-foreground",
    };
  }
  return {
    card: "bg-red-50 dark:bg-red-950/40",
    amount: "text-red-800 dark:text-red-400",
    label: "text-muted-foreground",
  };
}

export function MonthlySummary({
  expenses,
  allExpenses = expenses,
  categories = [],
}: MonthlySummaryProps) {
  const { totalOwed, totalPaid } = computeMonthlySummary(expenses);
  const remaining = Math.max(0, totalOwed - totalPaid);
  const { fmt, symbol } = useCurrency();
  const insight = buildSummaryInsight(expenses, allExpenses, categories, symbol);
  const tone = heroTone(remaining, totalOwed);

  return (
    <div
      id="tour-summary"
      className={`rounded-3xl px-6 py-10 text-center transition-colors duration-500 ${tone.card}`}
    >
      <p className={`text-sm font-medium ${tone.label}`}>Remaining this month</p>
      <p className={`mt-2 text-5xl font-bold tracking-tight tabular-nums ${tone.amount}`}>
        {fmt(remaining)}
      </p>
      {totalOwed > 0 && (
        <p className={`mt-3 text-sm ${tone.label}`}>
          {fmt(totalPaid)} paid of {fmt(totalOwed)}
        </p>
      )}
      {insight && (
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {insight}
        </p>
      )}
    </div>
  );
}
