"use client";

import type { Expense } from "@/types/expense";

interface StatsBarProps {
  expenses: Expense[];
}

export function StatsBar({ expenses }: StatsBarProps) {
  const total = expenses.length;
  const paid = expenses.filter((e) => e.status === "paid").length;
  const unpaid = total - paid;
  const high = expenses.filter((e) => e.priority === "High" && e.status === "unpaid").length;

  const stats = [
    { label: "Total",  value: total,  color: "text-zinc-900" },
    { label: "Paid",   value: paid,   color: "text-emerald-600" },
    { label: "Unpaid", value: unpaid, color: "text-amber-600" },
    { label: "High priority", value: high, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center shadow-sm"
        >
          <p className={`text-lg font-bold ${color}`}>{value}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
