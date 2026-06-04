"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { parseQuickAdd } from "@/lib/parser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { NewExpense } from "@/types/expense";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { ScanReceipt } from "@/components/ScanReceipt";
import { ArrowRight } from "lucide-react";

interface QuickAddInputProps {
  onAdd: (expense: NewExpense) => Promise<void>;
  activeMonthKey: string;
}

export function QuickAddInput({ onAdd, activeMonthKey: _activeMonthKey }: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const result = parseQuickAdd(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onAdd({ ...result.expense, category });
      setValue("");
      setCategory("");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await submit();
  }

  function handleScanPrefill(line: string) {
    setValue(line);
    setError(null);
    inputRef.current?.focus();
  }

  const busy = loading;

  return (
    <div className="space-y-1.5">
      <div
        className={[
          "flex items-center gap-1 rounded-2xl border bg-white py-1.5 pl-1.5 pr-2 shadow-sm transition-all",
          "border-zinc-200/90 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500/15",
        ].join(" ")}
      >
        <ScanReceipt onPrefill={handleScanPrefill} disabled={busy} />

        <span className="h-6 w-px shrink-0 bg-zinc-100" aria-hidden />

        <Input
          ref={inputRef}
          autoFocus
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder="Coffee 4.50 or Rent 1200"
          maxLength={500}
          aria-label="Quick add expense"
          aria-describedby={error ? "quick-add-error" : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm font-medium shadow-none focus-visible:ring-0"
        />

        <div className="hidden shrink-0 sm:block">
          <CategoryCombobox value={category} onChange={setCategory} compact />
        </div>

        <Button
          type="button"
          variant="brand"
          size="icon-sm"
          onClick={submit}
          disabled={busy || !value.trim()}
          aria-label="Add expense"
          className="shrink-0 rounded-xl"
        >
          <ArrowRight size={15} />
        </Button>
      </div>

      <p className="hidden px-0.5 text-[11px] text-zinc-400 sm:block">
        Type name + amount, or scan a receipt
      </p>
      <div className="sm:hidden">
        <CategoryCombobox value={category} onChange={setCategory} />
      </div>

      {error && (
        <p
          id="quick-add-error"
          role="alert"
          className="flex items-center gap-1.5 px-0.5 text-xs font-medium text-red-500"
        >
          <span aria-hidden="true">✕</span>
          {error}
        </p>
      )}
    </div>
  );
}
