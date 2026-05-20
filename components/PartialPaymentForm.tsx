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
      handleSubmit();
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
    <div
      className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3"
      role="group"
      aria-label="Record partial payment"
    >
      <p className="mb-2.5 text-xs text-zinc-500">
        Remaining: <span className="font-semibold text-zinc-800">{fmt(remaining)}</span>
      </p>

      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
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
            className="w-28 border-zinc-200 bg-white pl-6 text-sm font-medium"
          />
        </div>

        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={handleSubmit}
          disabled={loading}
          className="font-semibold"
        >
          {loading ? "Saving…" : "Pay"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          onKeyDown={handleCancelKeyDown}
          className="text-zinc-400 hover:text-zinc-600"
        >
          Cancel
        </Button>
      </div>

      {error && (
        <p id="payment-error" role="alert" className="mt-2 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
