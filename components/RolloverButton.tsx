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

  const label = loading ? "Rolling over…" : "Roll over";
  const ariaLabel = loading
    ? "Rolling over expenses"
    : hasUnpaid
      ? "Roll over unpaid expenses to next month"
      : "No unpaid expenses to roll over";

  if (!hasUnpaid) {
    return (
      <>
        <Button
          type="button"
          variant="toolbar"
          size="icon-sm"
          disabled
          aria-label={ariaLabel}
          title={ariaLabel}
          className="shrink-0 text-zinc-300 sm:hidden"
        >
          <RefreshCw size={14} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="rollover"
          size="sm"
          disabled
          aria-label={ariaLabel}
          title={ariaLabel}
          className="hidden shrink-0 sm:inline-flex"
        >
          <RefreshCw size={14} aria-hidden />
          <span className="whitespace-nowrap">Roll over</span>
        </Button>
      </>
    );
  }

  return (
    <>
      {/* Mobile: icon only */}
      <Button
        type="button"
        variant="rollover"
        size="icon-sm"
        onClick={handleClick}
        disabled={loading}
        aria-label={ariaLabel}
        title={label}
        className="shrink-0 sm:hidden"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden />
      </Button>
      {/* Desktop: labeled button — must not use icon-sm or text overflows siblings */}
      <Button
        type="button"
        variant="rollover"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        aria-label={ariaLabel}
        title={label}
        className="hidden shrink-0 sm:inline-flex"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden />
        <span className="whitespace-nowrap">{label}</span>
      </Button>
    </>
  );
}
