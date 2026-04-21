"use client";

import { computeMonthlySummary } from "@/lib/expenseLogic";
import type { Expense } from "@/types/expense";

interface MonthlySummaryProps {
  expenses: Expense[];
}

export function MonthlySummary({ expenses }: MonthlySummaryProps) {
  const { totalOwed, totalPaid, progress } = computeMonthlySummary(expenses);
  const percent = Math.round(progress * 100);
  const remaining = totalOwed - totalPaid;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Total owed</p>
          <p className="mt-1 font-[var(--font-heading)] text-xl font-bold text-zinc-900">${totalOwed.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Paid</p>
          <p className="mt-1 font-[var(--font-heading)] text-xl font-bold text-emerald-600">${totalPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Remaining</p>
          <p className="mt-1 font-[var(--font-heading)] text-xl font-bold text-zinc-500">${remaining.toFixed(2)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">Progress</span>
          <span className="text-xs font-semibold text-zinc-700">{percent}%</span>
        </div>
        <div
          className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly payment progress"
        >
          <div
            className="h-full rounded-full bg-violet-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
