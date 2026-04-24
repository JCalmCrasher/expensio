"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { useCurrency } from "@/lib/useCurrency";
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
      className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3"
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
          <input
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
            className="w-28 rounded-lg border border-zinc-200 bg-white pl-6 pr-3 py-2 text-sm font-medium text-zinc-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Pay"}
        </button>

        <button
          onClick={onCancel}
          onKeyDown={handleCancelKeyDown}
          className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p id="payment-error" role="alert" className="mt-2 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
