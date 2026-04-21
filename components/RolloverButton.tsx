"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Expense } from "@/types/expense";

interface RolloverButtonProps {
  expenses: Expense[];
  activeMonthKey: string;
  onRollover: () => Promise<void>;
}

export function RolloverButton({
  expenses,
  activeMonthKey: _activeMonthKey,
  onRollover,
}: RolloverButtonProps) {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const hasUnpaid = expenses.some((e) => e.status === "unpaid");

  async function handleClick() {
    if (!hasUnpaid || loading || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      await onRollover();
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  if (!hasUnpaid) {
    return (
      <span
        title="No unpaid expenses to roll over"
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 cursor-not-allowed select-none"
      >
        <RefreshCw size={12} />
        Roll over
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Roll over unpaid expenses to next month"
      className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors duration-150 hover:bg-violet-100 hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      {loading ? "Rolling over…" : "Roll over"}
    </button>
  );
}
