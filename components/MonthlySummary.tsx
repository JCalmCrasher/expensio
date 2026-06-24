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

export function MonthlySummary({
  expenses,
  allExpenses = expenses,
  categories = [],
}: MonthlySummaryProps) {
  const { totalOwed, totalPaid, progress } = computeMonthlySummary(expenses);
  const percent = Math.round(progress * 100);
  const remaining = totalOwed - totalPaid;
  const { fmt, symbol } = useCurrency();
  const insight = buildSummaryInsight(expenses, allExpenses, categories, symbol);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      {insight && (
        <p className="mb-3 text-sm leading-snug text-zinc-600">{insight}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 truncate">
            Total owed
          </p>
          <p className="mt-0.5 text-base font-bold text-zinc-900 tabular-nums truncate">
            {fmt(totalOwed)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 truncate">
            Paid
          </p>
          <p className="mt-0.5 text-base font-bold text-emerald-600 tabular-nums truncate">
            {fmt(totalPaid)}
          </p>
        </div>
        <div className="min-w-0 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 truncate">
            Remaining
          </p>
          <p className="mt-0.5 text-base font-bold text-zinc-500 tabular-nums truncate">
            {fmt(remaining)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">Progress</span>
          <span className="text-xs font-semibold text-zinc-700">{percent}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly payment progress"
        >
          <div
            className="h-full rounded-full bg-green-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
