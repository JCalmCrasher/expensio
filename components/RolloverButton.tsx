"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Expense } from "@/types/expense";
import { Button } from "@/components/ui/button";

interface RolloverButtonProps {
  expenses: Expense[];
  activeMonthKey: string;
  onRollover: () => Promise<void>;
}

const MIN_SPIN_MS = 600;

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
      <Button
        type="button"
        variant="toolbar"
        size="icon-sm"
        disabled
        aria-label="No unpaid expenses to roll over"
        title="No unpaid expenses to roll over"
        className="text-zinc-300"
      >
        <RefreshCw size={14} aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="rollover"
      size="icon-sm"
      onClick={handleClick}
      disabled={loading}
      aria-label={loading ? "Rolling over expenses" : "Roll over unpaid expenses to next month"}
      title={loading ? "Rolling over…" : "Roll over to next month"}
      className="sm:h-auto sm:min-h-0 sm:gap-1.5 sm:px-3 sm:py-1.5"
    >
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden />
      <span className="hidden sm:inline">
        {loading ? "Rolling over…" : "Roll over"}
      </span>
    </Button>
  );
}
