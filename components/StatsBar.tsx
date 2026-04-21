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

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <Pill value={total} label="total" color="text-zinc-600 bg-zinc-100" />
      <Pill value={paid} label="paid" color="text-emerald-700 bg-emerald-50" />
      <Pill value={unpaid} label="unpaid" color="text-amber-700 bg-amber-50" />
      {high > 0 && <Pill value={high} label="high" color="text-red-700 bg-red-50" />}
    </div>
  );
}

function Pill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}
    >
      <span>{value}</span>
      <span className="font-normal opacity-70">{label}</span>
    </span>
  );
}
