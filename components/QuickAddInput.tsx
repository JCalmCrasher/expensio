"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { parseQuickAdd } from "@/lib/parser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { NewExpense } from "@/types/expense";
import { CategoryCombobox } from "@/components/CategoryCombobox";
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

  return (
    <div>
      {/* Single row: text input + category picker + submit */}
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-400 transition-all">
        <Input
          ref={inputRef}
          autoFocus
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder='e.g. Rent 1200 high or Coffee 4.50 note: morning run'
          maxLength={500}
          aria-label="Quick add expense"
          aria-describedby={error ? "quick-add-error" : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm font-medium shadow-none focus-visible:ring-0"
        />

        {/* Category picker — compact inline */}
        <div className="shrink-0 hidden sm:block">
          <CategoryCombobox
            value={category}
            onChange={setCategory}
            compact
          />
        </div>

        {/* Submit button */}
        <Button
          type="button"
          variant="brand"
          size="icon"
          onClick={submit}
          disabled={loading || !value.trim()}
          aria-label="Add expense"
          className="shrink-0"
        >
          <ArrowRight size={14} />
        </Button>
      </div>

      {/* Category picker on mobile — below the row */}
      <div className="mt-2 sm:hidden">
        <CategoryCombobox value={category} onChange={setCategory} />
      </div>

      {error && (
        <p
          id="quick-add-error"
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500"
        >
          <span aria-hidden="true">✕</span>
          {error}
        </p>
      )}
    </div>
  );
}
