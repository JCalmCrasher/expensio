"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { parseQuickAdd } from "@/lib/parser";
import {
  buildRepeatExpense,
  getLastCategoryForTitle,
  getLastExpense,
  getRecentCategories,
  hasDuplicateToday,
  matchTitleSuggestions,
} from "@/lib/expenseMemory";
import { useIsMobile } from "@/lib/useIsMobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { ScanReceipt } from "@/components/ScanReceipt";
import type { Expense, NewExpense } from "@/types/expense";

interface QuickAddInputProps {
  onAdd: (expense: NewExpense) => Promise<void>;
  onAddMultiple?: (expenses: NewExpense[]) => Promise<void>;
  activeMonthKey: string;
  recentExpenses: Expense[];
}

type ScanPreview = { line: string; merchant: string | null };

export function QuickAddInput({
  onAdd,
  onAddMultiple,
  activeMonthKey,
  recentExpenses,
}: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [scanPreview, setScanPreview] = useState<ScanPreview | null>(null);
  const [sticky, setSticky] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);

  const isMobile = useIsMobile();
  const recentCategories = getRecentCategories(recentExpenses);
  const lastExpense = getLastExpense(recentExpenses, activeMonthKey);

  useEffect(() => {
    if (!isMobile || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  useEffect(() => {
    if (!sticky || !barRef.current) return;
    setBarHeight(barRef.current.offsetHeight);
  }, [sticky, value, category, scanPreview, suggestions.length]);

  useEffect(() => {
    const matches = matchTitleSuggestions(value, recentExpenses);
    setSuggestions(matches);
    setActiveSuggestion(-1);
  }, [value, recentExpenses]);

  async function commitExpense(expense: NewExpense) {
    setLoading(true);
    try {
      await onAdd(expense);
      setValue("");
      setCategory("");
      setScanPreview(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function submit(skipDuplicateCheck = false) {
    const result = parseQuickAdd(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const resolvedCategory = result.categoryFromParser || category;
    const expense: NewExpense = { ...result.expense, category: resolvedCategory };

    if (
      !skipDuplicateCheck &&
      hasDuplicateToday(recentExpenses, expense.title, expense.totalAmount)
    ) {
      toast(`You logged ${expense.title} ${expense.totalAmount} earlier today`, {
        action: {
          label: "Add anyway",
          onClick: () => void commitExpense(expense),
        },
      });
      return;
    }

    setError(null);
    await commitExpense(expense);
  }

  function applySuggestion(title: string) {
    const parts = value.trim().split(/\s+/);
    const amount = parts.find((p) => /^-?\d+(\.\d+)?$/.test(p));
    setValue(amount ? `${title} ${amount}` : title);
    const cat = getLastCategoryForTitle(recentExpenses, title);
    if (cat) setCategory(cat);
    setSuggestions([]);
    inputRef.current?.focus();
  }

  async function handleRepeatLast() {
    if (!lastExpense) {
      toast.message("No expense to repeat yet");
      return;
    }
    await commitExpense(buildRepeatExpense(lastExpense, activeMonthKey));
    toast.success(`Repeated "${lastExpense.title}"`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && activeSuggestion >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestion]);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      void handleRepeatLast();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  function handleScanPrefill(line: string) {
    setValue(line);
    setError(null);
    setScanPreview(null);
    inputRef.current?.focus();
  }

  function handleScanPreview(preview: ScanPreview) {
    setScanPreview(preview);
    setError(null);
  }

  const busy = loading;

  const inputBar = (
    <div className="space-y-1.5">
      {scanPreview && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
          <span className="text-muted-foreground">
            {scanPreview.merchant ? `${scanPreview.merchant} · ` : ""}
            <span className="font-semibold text-foreground">{scanPreview.line}</span>
          </span>
          <div className="ml-auto flex gap-1.5">
            <Button
              type="button"
              size="compact"
              variant="brand"
              onClick={() => {
                setValue(scanPreview.line);
                setScanPreview(null);
                void submit();
              }}
            >
              Add
            </Button>
            <Button
              type="button"
              size="compact"
              variant="outline"
              onClick={() => {
                setValue(scanPreview.line);
                setScanPreview(null);
                inputRef.current?.focus();
              }}
            >
              Edit
            </Button>
          </div>
        </div>
      )}

      <div
        ref={barRef}
        className={[
          "flex w-full items-center gap-1 rounded-2xl border bg-card py-2 pl-2 pr-2.5 shadow-md transition-all",
          "border-border focus-within:border-ring/40 focus-within:ring-2 focus-within:ring-ring/10",
          sticky && isMobile ? "fixed left-4 right-4 top-[56px] z-30 shadow-lg" : "",
        ].join(" ")}
      >
        <ScanReceipt
          onPrefill={handleScanPrefill}
          onScanPreview={handleScanPreview}
          onImportMultiple={onAddMultiple}
          activeMonthKey={activeMonthKey}
          disabled={busy}
        />

        <span className="h-6 w-px shrink-0 bg-border" aria-hidden />

        <div className="relative min-w-0 flex-1">
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
            placeholder="Coffee 4.50 #food"
            maxLength={500}
            aria-label="Quick add expense"
            id="quick-add-input"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-describedby={error ? "quick-add-error" : undefined}
            className="w-full border-0 bg-transparent py-2.5 font-mono text-sm font-medium shadow-none focus-visible:ring-0"
          />

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-40 mt-1 max-h-40 overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
            >
              {suggestions.map((title, i) => (
                <li key={title} role="option" aria-selected={i === activeSuggestion}>
                  <button
                    type="button"
                    className={[
                      "w-full px-3 py-1.5 text-left text-sm",
                      i === activeSuggestion ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(title);
                    }}
                  >
                    {title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden shrink-0 sm:block">
          <CategoryCombobox value={category} onChange={setCategory} compact />
        </div>

        {lastExpense && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            onClick={() => void handleRepeatLast()}
            aria-label="Repeat last expense"
            title="Repeat last (Ctrl+Shift+Enter)"
            className="shrink-0 text-muted-foreground/70 hover:text-accent-foreground"
          >
            <RotateCcw size={14} />
          </Button>
        )}

        <Button
          type="button"
          variant="brand"
          size="icon-sm"
          onClick={() => void submit()}
          disabled={busy || !value.trim()}
          aria-label="Add expense"
          className="shrink-0 rounded-xl"
        >
          <ArrowRight size={15} />
        </Button>
      </div>

      {recentCategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {recentCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={[
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                category === cat
                  ? "border-green-200 bg-accent text-accent-foreground dark:border-green-800"
                  : "border-border bg-card text-muted-foreground hover:border-border/80",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <p className="hidden px-0.5 text-[11px] text-muted-foreground/70 sm:block">
        Name + amount · #category · due friday · Ctrl+Shift+Enter to repeat
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

  return (
    <>
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
      {sticky && isMobile && barHeight > 0 && <div style={{ height: barHeight }} aria-hidden />}
      {inputBar}
    </>
  );
}
