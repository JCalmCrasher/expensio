"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Expense } from "@/types/expense";

interface RolloverButtonProps {
  expenses: Expense[];
  activeMonthKey: string;
  onRollover: () => Promise<void>;
}

const MIN_SPIN_MS = 600; // minimum visible loading duration to prevent flicker

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
    const start = Date.now();
    try {
      await onRollover();
    } finally {
      // Ensure the spinner is visible for at least MIN_SPIN_MS
      const elapsed = Date.now() - start;
      const remaining = MIN_SPIN_MS - elapsed;
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }
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
        <span className="hidden sm:block">Roll over</span>
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Roll over unpaid expenses to next month"
      className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors duration-150 hover:bg-green-100 hover:border-green-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      <span className="hidden sm:block">{loading ? "Rolling over…" : "Roll over"}</span>
    </button>
  );
}
