"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { useCurrency } from "@/lib/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Expense } from "@/types/expense";

interface PartialPaymentFormProps {
  expense: Expense;
  onSubmit: (amount: number) => Promise<void>;
  onCancel: () => void;
}

export function PartialPaymentForm({ expense, onSubmit, onCancel }: PartialPaymentFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const remaining = expense.totalAmount - expense.amountPaid;
  const { fmt, symbol } = useCurrency();

  async function handleSubmit() {
    const amount = parseFloat(value);
    if (!value || isNaN(amount) || amount <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(amount);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  function handleCancelKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }

  return (
    <div role="group" aria-label="Record partial payment" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Remaining{" "}
          <span className="font-semibold tabular-nums text-foreground">{fmt(remaining)}</span>
        </p>
        {expense.amountPaid > 0 && (
          <p className="text-[11px] tabular-nums text-muted-foreground/80">
            {fmt(expense.amountPaid)} already paid
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
            {symbol}
          </span>
          <Input
            ref={inputRef}
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="0.00"
            aria-label="Payment amount"
            aria-describedby={error ? "payment-error" : undefined}
            className="w-full bg-background py-2.5 pl-7 text-sm font-medium text-foreground"
          />
        </div>

        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="h-9 shrink-0 px-4 font-semibold"
        >
          {loading ? "Saving…" : "Pay"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          onKeyDown={handleCancelKeyDown}
          className="h-9 shrink-0 text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>

      {error && (
        <p id="payment-error" role="alert" className="text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
