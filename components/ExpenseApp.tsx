"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Menu, Search, HelpCircle, X, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { applyPayment, buildRolloverCopies } from "@/lib/expenseLogic";
import { nextMonthKey, formatMonthKey } from "@/lib/monthKey";
import { useExpenseStore, CURRENCY_CONFIG } from "@/store/useExpenseStore";
import type { Currency } from "@/store/useExpenseStore";
import { QuickAddInput } from "@/components/QuickAddInput";
import { MonthNavigator } from "@/components/MonthNavigator";
import { MonthlySummary } from "@/components/MonthlySummary";
import { RolloverButton } from "@/components/RolloverButton";
import { ExpenseList } from "@/components/ExpenseList";
import { AppSidebar } from "@/components/AppSidebar";
import { StatsBar } from "@/components/StatsBar";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import type { Expense, NewExpense, Priority } from "@/types/expense";
import dynamic from "next/dynamic";

const AppTour = dynamic(() => import("@/components/AppTour").then((m) => m.AppTour), {
  ssr: false,
});

const TOUR_KEY = "expensio-tour-done-v1"; // F8: versioned to avoid cross-deployment collision

/** Derive the monthKey from dueDate if it's in a different month than the active one */
function resolveMonthKey(expense: NewExpense, activeMonthKey: string): string {
  if (expense.dueDate) {
    const dueMonth = new Date(expense.dueDate).toISOString().slice(0, 7); // "YYYY-MM"
    if (dueMonth !== activeMonthKey) return dueMonth;
  }
  return activeMonthKey;
}

export default function ExpenseApp() {
  const {
    activeMonthKey,
    setActiveMonthKey,
    openPaymentFormId,
    setOpenPaymentFormId,
    currency,
    setCurrency,
  } = useExpenseStore();

  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TOUR_KEY)) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await db.expenses.count();
      } catch {
        if (!cancelled) setDbUnavailable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const expenses =
    useLiveQuery(
      async () => {
        const rows = await db.expenses.where("monthKey").equals(activeMonthKey).toArray();
        return rows.sort((a, b) => b.createdAt - a.createdAt);
      },
      [activeMonthKey],
      []
    ) ?? [];

  // All distinct monthKeys that have expenses (for the cross-month hint)
  const allMonthKeys =
    useLiveQuery(
      async () => {
        const all = await db.expenses.orderBy("monthKey").uniqueKeys();
        return all as string[];
      },
      [],
      []
    ) ?? [];

  const otherMonths = useMemo(
    () => allMonthKeys.filter((m) => m !== activeMonthKey),
    [allMonthKeys, activeMonthKey]
  );

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) => e.title.toLowerCase().includes(q));
  }, [expenses, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAdd(expense: NewExpense) {
    const targetMonth = resolveMonthKey(expense, activeMonthKey);
    const isDifferentMonth = targetMonth !== activeMonthKey;
    await db.expenses.add({ ...expense, monthKey: targetMonth, createdAt: Date.now() });

    if (isDifferentMonth) {
      toast.success(`"${expense.title}" added to ${formatMonthKey(targetMonth)}`, {
        description: "Due date is in a different month — filed there automatically.",
        action: {
          label: "Go there",
          onClick: () => setActiveMonthKey(targetMonth),
        },
      });
    } else {
      toast.success(`"${expense.title}" added`);
    }
  }

  async function handlePayment(id: number, amount: number) {
    // F6: wrap in a Dexie transaction to prevent read-modify-write race
    await db.transaction("rw", db.expenses, async () => {
      const expense = await db.expenses.get(id);
      if (!expense) return;
      const update = applyPayment(expense, amount);
      await db.expenses.update(id, update);
      const newPaid = expense.amountPaid + amount;
      const isNowPaid = newPaid >= expense.totalAmount;
      if (isNowPaid) {
        toast.success(`"${expense.title}" fully paid! 🎉`);
      } else {
        toast.success(`Payment recorded for "${expense.title}"`);
      }
    });
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    await db.expenses.update(id, { priority });
  }

  async function handleDelete(id: number) {
    const expense = await db.expenses.get(id);
    await db.expenses.delete(id);
    toast.error(`"${expense?.title ?? "Expense"}" deleted`, {
      description: "",
    });
  }

  async function handleMarkPaid(id: number) {
    const expense = await db.expenses.get(id);
    if (!expense || expense.status === "paid") return;
    await db.expenses.update(id, {
      amountPaid: expense.totalAmount,
      status: "paid",
    });
    toast.success(`"${expense.title}" marked as paid ✓`);
  }

  async function handleBulkDelete(ids: number[]) {
    await db.expenses.bulkDelete(ids);
    toast.error(`${ids.length} expense${ids.length !== 1 ? "s" : ""} deleted`);
  }

  async function handleEdit(id: number, updates: Partial<Expense>) {
    // If due date changed to a different month, update monthKey too
    let finalUpdates = { ...updates };
    if (updates.dueDate) {
      const newMonth = new Date(updates.dueDate).toISOString().slice(0, 7);
      const expense = await db.expenses.get(id);
      if (expense && newMonth !== expense.monthKey) {
        finalUpdates = { ...finalUpdates, monthKey: newMonth };
      }
    }
    await db.expenses.update(id, finalUpdates);
    toast.success("Changes saved");
  }

  async function handleRollover() {
    const targetMonth = nextMonthKey(activeMonthKey);
    const unpaid = await db.expenses
      .where("monthKey")
      .equals(activeMonthKey)
      .filter((e) => e.status === "unpaid")
      .toArray();
    const existing = await db.expenses.where("monthKey").equals(targetMonth).toArray();
    const existingTitles = new Set(existing.map((e) => e.title.toLowerCase()));
    const copies = buildRolloverCopies(
      unpaid.filter((e) => !existingTitles.has(e.title.toLowerCase())),
      targetMonth
    );
    if (copies.length === 0) {
      toast.info("Nothing new to roll over — all unpaid expenses already exist in the next month.");
      return;
    }
    await db.expenses.bulkAdd(copies.map((c) => ({ ...c, createdAt: Date.now() })));
    toast.success(
      `${copies.length} expense${copies.length !== 1 ? "s" : ""} rolled over to ${formatMonthKey(targetMonth)}`,
      {
        action: {
          label: "Go there",
          onClick: () => setActiveMonthKey(targetMonth),
        },
      }
    );
  }

  function handleTourDone() {
    setShowTour(false);
    localStorage.setItem(TOUR_KEY, "1");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {showTour && <AppTour onDone={handleTourDone} />}
      <AppSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <EditExpenseModal
        expense={editingExpense}
        open={editingExpense !== null}
        onClose={() => setEditingExpense(null)}
        onSave={handleEdit}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {dbUnavailable && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-amber-50 px-5 py-3 text-sm text-amber-800 border-b border-amber-200"
          >
            <span aria-hidden="true">⚠️</span>
            Storage unavailable — expenses won&apos;t persist between sessions.
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-1 md:gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:hidden"
            >
              <Menu size={17} />
            </button>

            <h1 className="shrink-0 text-base font-bold tracking-tight text-zinc-900">Expenses</h1>

            {/* Desktop search */}
            <div id="tour-search" className="relative flex-1 hidden sm:block">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                aria-label="Search expenses"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-7 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:bg-white"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-zinc-400 hover:text-zinc-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Mobile search icon */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => mobileSearchRef.current?.focus(), 50);
              }}
              aria-label="Search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 sm:hidden"
            >
              <Search size={16} />
            </button>

            {/* Currency switcher */}
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 shrink-0">
              {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => {
                const { symbol, flag } = CURRENCY_CONFIG[c];
                return (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    aria-label={`Switch to ${c}`}
                    title={c}
                    className={[
                      "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                      currency === c
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-600",
                    ].join(" ")}
                  >
                    <span>{flag}</span>
                    <span>{symbol}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowTour(true)}
              aria-label="Take a tour"
              title="Take a tour"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <HelpCircle size={15} />
            </button>

            <div id="tour-rollover" className="shrink-0">
              <RolloverButton
                expenses={expenses}
                activeMonthKey={activeMonthKey}
                onRollover={handleRollover}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile search overlay ── */}
        {searchOpen && (
          <>
            <div
              className="fixed inset-0 z-30 sm:hidden"
              onClick={() => setSearchOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-2 bg-white px-4 py-3 shadow-lg sm:hidden">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  ref={mobileSearchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses…"
                  aria-label="Search expenses"
                  className="w-full rounded-xl border border-violet-300 bg-white py-2.5 pl-8 pr-7 text-sm text-zinc-900 placeholder:text-zinc-400 ring-2 ring-violet-400 focus-visible:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="shrink-0 text-sm font-medium text-violet-600 hover:text-violet-800"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── Page body ── */}
        <div className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 pb-16">
          <div id="tour-quick-add" className="pt-5">
            <QuickAddInput onAdd={handleAdd} activeMonthKey={activeMonthKey} />
          </div>

          <div id="tour-month-nav" className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <MonthNavigator activeMonthKey={activeMonthKey} onNavigate={setActiveMonthKey} />
              <div id="tour-stats" className="hidden sm:block shrink-0">
                <StatsBar expenses={expenses} />
              </div>
            </div>
            <div className="mt-2 sm:hidden overflow-x-auto pb-0.5">
              <StatsBar expenses={expenses} />
            </div>
          </div>

          {/* ── Cross-month hint ── */}
          {otherMonths.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <CalendarDays size={11} />
                Also in:
              </span>
              {otherMonths.slice(0, 6).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMonthKey(m)}
                  className="shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  {formatMonthKey(m)}
                </button>
              ))}
              {otherMonths.length > 6 && (
                <span className="shrink-0 text-[10px] text-zinc-400">
                  +{otherMonths.length - 6} more
                </span>
              )}
            </div>
          )}

          <div id="tour-summary" className="mt-4">
            <MonthlySummary expenses={expenses} />
          </div>

          <div className="mt-5">
            <ExpenseList
              expenses={filteredExpenses}
              onPaymentSubmit={handlePayment}
              onPriorityChange={handlePriorityChange}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onMarkPaid={handleMarkPaid}
              onEdit={setEditingExpense}
              openPaymentFormId={openPaymentFormId}
              onOpenPaymentForm={setOpenPaymentFormId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
