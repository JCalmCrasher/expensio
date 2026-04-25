"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { parseQuickAdd } from "@/lib/parser";
import type { NewExpense } from "@/types/expense";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

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

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();

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

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="e.g. Rent 1200 high or Coffee 4.50 paid"
          maxLength={500}
          aria-label="Quick add expense"
          aria-describedby={error ? "quick-add-error" : undefined}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-[15px] font-medium text-zinc-900 shadow-sm placeholder:font-normal placeholder:text-zinc-400 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-400 disabled:opacity-50"
        />
        <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          ↵ Enter
        </kbd>
      </div>
      
      <div className="mt-2 flex items-center gap-2">
        <div className="w-48">
          <CategoryCombobox 
            value={category} 
            onChange={setCategory} 
          />
        </div>
        <p className="text-[10px] text-zinc-400 font-medium">
          Tip: Add category now or later in details.
        </p>
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
