"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Calendar,
  CalendarArrowDown,
  CalendarArrowUp,
  DollarSign,
  FileUp,
  LayoutDashboard,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  PartyPopper,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useExpenseStore, CURRENCY_CONFIG, type Currency } from "@/store/useExpenseStore";
import type { AccentColor } from "@/lib/appearance";
import { ACCENT_OPTIONS } from "@/lib/appearance";
import {
  currentMonthKey,
  formatMonthKey,
  nextMonthKey,
  prevMonthKey,
} from "@/lib/monthKey";
import { searchMonthExpenses } from "@/lib/monthExpenseQueries";
import { formatShortcut } from "@/lib/keyboard";
import { useIsMobile } from "@/lib/useIsMobile";
import type { Expense } from "@/types/expense";

export interface AppCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMonthKey: string;
  otherMonthKeys: string[];
  currency: Currency;
  onNavigateMonth: (monthKey: string) => void;
  onEditExpense: (expense: Expense) => void;
  onOpenSettings: () => void;
  onOpenInsights: () => void;
  onOpenImport: () => void;
  onStartTour: () => void;
  onOpenWhatsNew: () => void;
  onFocusQuickAdd: () => void;
  onFocusSearch: () => void;
}

export function AppCommandMenu({
  open,
  onOpenChange,
  activeMonthKey,
  otherMonthKeys,
  currency,
  onNavigateMonth,
  onEditExpense,
  onOpenSettings,
  onOpenInsights,
  onOpenImport,
  onStartTour,
  onOpenWhatsNew,
  onFocusQuickAdd,
  onFocusSearch,
}: AppCommandMenuProps) {
  const [query, setQuery] = useState("");
  const [expenseHits, setExpenseHits] = useState<Expense[]>([]);
  const { setTheme } = useTheme();
  const setCurrency = useExpenseStore((s) => s.setCurrency);
  const setAccent = useExpenseStore((s) => s.setAccent);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setExpenseHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setExpenseHits([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void searchMonthExpenses(activeMonthKey, q, 12).then((rows) => {
        if (!cancelled) setExpenseHits(rows);
      });
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeMonthKey, open, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      event.preventDefault();
      onOpenChange(true);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  function run(action: () => void) {
    action();
    onOpenChange(false);
  }

  const modK = formatShortcut(["mod", "K"]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Commands"
      description="Search commands and expenses"
    >
      <CommandInput
        placeholder={isMobile ? "Search commands or expenses…" : `Search… (${modK} to open)`}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[min(60vh,360px)]">
        <CommandEmpty>No results found.</CommandEmpty>

        {expenseHits.length > 0 && (
          <CommandGroup heading="Expenses this month">
            {expenseHits.map((expense) => (
              <CommandItem
                key={expense.id}
                value={`expense ${expense.title} ${expense.category}`}
                onSelect={() => run(() => onEditExpense(expense))}
              >
                <Pencil className="mr-2 h-4 w-4 opacity-60" />
                <span className="truncate">{expense.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {CURRENCY_CONFIG[currency].symbol}
                  {expense.totalAmount.toLocaleString()}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => run(onFocusQuickAdd)}>
            <Plus className="mr-2 h-4 w-4 opacity-60" />
            Add expense
            {!isMobile && <CommandShortcut>N</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => run(onFocusSearch)}>
            <Search className="mr-2 h-4 w-4 opacity-60" />
            Search list
            {!isMobile && <CommandShortcut>/</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenInsights)}>
            <LayoutDashboard className="mr-2 h-4 w-4 opacity-60" />
            Open insights
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenSettings)}>
            <Settings className="mr-2 h-4 w-4 opacity-60" />
            Settings
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenImport)}>
            <FileUp className="mr-2 h-4 w-4 opacity-60" />
            Import / export data
          </CommandItem>
          <CommandItem onSelect={() => run(onStartTour)}>
            <Sparkles className="mr-2 h-4 w-4 opacity-60" />
            Take a tour
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenWhatsNew)}>
            <PartyPopper className="mr-2 h-4 w-4 opacity-60" />
            What&apos;s new
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Month">
          <CommandItem
            onSelect={() => run(() => onNavigateMonth(prevMonthKey(activeMonthKey)))}
          >
            <CalendarArrowUp className="mr-2 h-4 w-4 opacity-60" />
            Previous month
            {!isMobile && <CommandShortcut>←</CommandShortcut>}
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => onNavigateMonth(nextMonthKey(activeMonthKey)))}
          >
            <CalendarArrowDown className="mr-2 h-4 w-4 opacity-60" />
            Next month
            {!isMobile && <CommandShortcut>→</CommandShortcut>}
          </CommandItem>
          {activeMonthKey !== currentMonthKey() && (
            <CommandItem onSelect={() => run(() => onNavigateMonth(currentMonthKey()))}>
              <Calendar className="mr-2 h-4 w-4 opacity-60" />
              Go to current month
            </CommandItem>
          )}
          {otherMonthKeys.slice(0, 6).map((monthKey) => (
            <CommandItem
              key={monthKey}
              onSelect={() => run(() => onNavigateMonth(monthKey))}
            >
              <Calendar className="mr-2 h-4 w-4 opacity-60" />
              {formatMonthKey(monthKey)}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Currency">
          {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((code) => (
            <CommandItem
              key={code}
              onSelect={() => run(() => setCurrency(code))}
            >
              <DollarSign className="mr-2 h-4 w-4 opacity-60" />
              {CURRENCY_CONFIG[code].flag} {code}
              {currency === code && (
                <span className="ml-auto text-xs text-muted-foreground">Active</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4 opacity-60" />
            Light theme
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4 opacity-60" />
            Dark theme
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))}>
            <Settings className="mr-2 h-4 w-4 opacity-60" />
            System theme
          </CommandItem>
          {ACCENT_OPTIONS.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => run(() => setAccent(option.id as AccentColor))}
            >
              <span
                className="mr-2 h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: option.swatch }}
              />
              {option.label} accent
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
