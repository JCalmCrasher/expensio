"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Menu, Search, HelpCircle, X } from "lucide-react";
import { db } from "@/lib/db";
import { applyPayment, buildRolloverCopies } from "@/lib/expenseLogic";
import { nextMonthKey } from "@/lib/monthKey";
import { useExpenseStore } from "@/store/useExpenseStore";
import { QuickAddInput } from "@/components/QuickAddInput";
import { MonthNavigator } from "@/components/MonthNavigator";
import { MonthlySummary } from "@/components/MonthlySummary";
import { RolloverButton } from "@/components/RolloverButton";
import { ExpenseList } from "@/components/ExpenseList";
import { AppSidebar } from "@/components/AppSidebar";
import { StatsBar } from "@/components/StatsBar";
import type { NewExpense, Priority } from "@/types/expense";
import dynamic from "next/dynamic";

const AppTour = dynamic(
  () => import("@/components/AppTour").then((m) => m.AppTour),
  { ssr: false }
);

const TOUR_KEY = "expensio-tour-done";

export default function ExpenseApp() {
  const {
    activeMonthKey,
    setActiveMonthKey,
    openPaymentFormId,
    setOpenPaymentFormId,
  } = useExpenseStore();

  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showTour, setShowTour] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-start tour on first visit
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
    return () => { cancelled = true; };
  }, []);

  const expenses =
    useLiveQuery(
      () => db.expenses.where("monthKey").equals(activeMonthKey).toArray(),
      [activeMonthKey],
      []
    ) ?? [];

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) => e.title.toLowerCase().includes(q));
  }, [expenses, search]);

  async function handleAdd(expense: NewExpense) {
    await db.expenses.add({
      ...expense,
      monthKey: activeMonthKey,
      createdAt: Date.now(),
    });
  }

  async function handlePayment(id: number, amount: number) {
    const expense = await db.expenses.get(id);
    if (!expense) return;
    const update = applyPayment(expense, amount);
    await db.expenses.update(id, update);
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    await db.expenses.update(id, { priority });
  }

  async function handleDelete(id: number) {
    await db.expenses.delete(id);
  }

  async function handleRollover() {
    const targetMonth = nextMonthKey(activeMonthKey);
    const unpaid = await db.expenses
      .where("monthKey")
      .equals(activeMonthKey)
      .filter((e) => e.status === "unpaid")
      .toArray();

    // Deduplicate: skip titles already present in the target month
    const existing = await db.expenses
      .where("monthKey")
      .equals(targetMonth)
      .toArray();
    const existingTitles = new Set(existing.map((e) => e.title.toLowerCase()));

    const copies = buildRolloverCopies(
      unpaid.filter((e) => !existingTitles.has(e.title.toLowerCase())),
      targetMonth
    );
    if (copies.length === 0) return;
    await db.expenses.bulkAdd(copies.map((c) => ({ ...c, createdAt: Date.now() })));
  }

  function handleTourDone() {
    setShowTour(false);
    localStorage.setItem(TOUR_KEY, "1");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {showTour && <AppTour onDone={handleTourDone} />}

      {/* Sidebar */}
      <AppSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex-1 min-w-0">
        {dbUnavailable && (
          <div role="alert" className="flex items-center gap-2 bg-amber-50 px-5 py-3 text-sm text-amber-800 border-b border-amber-200">
            <span aria-hidden="true">⚠️</span>
            Storage unavailable — expenses won&apos;t persist between sessions.
          </div>
        )}

        {/* Top bar */}
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:hidden"
              >
                <Menu size={17} />
              </button>
              <h1 className="text-base font-bold tracking-tight text-zinc-900">Expenses</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Tour trigger */}
              <button
                onClick={() => setShowTour(true)}
                aria-label="Start tour"
                title="Take a tour"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <HelpCircle size={16} />
              </button>

              <div id="tour-rollover">
                <RolloverButton
                  expenses={expenses}
                  activeMonthKey={activeMonthKey}
                  onRollover={handleRollover}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 space-y-4">
          {/* Quick-add */}
          <div id="tour-quick-add" className="pt-5">
            <QuickAddInput onAdd={handleAdd} activeMonthKey={activeMonthKey} />
          </div>

          {/* Month nav */}
          <div id="tour-month-nav">
            <MonthNavigator activeMonthKey={activeMonthKey} onNavigate={setActiveMonthKey} />
          </div>

          {/* Summary */}
          <div id="tour-summary">
            <MonthlySummary expenses={expenses} />
          </div>

          {/* Stats */}
          <div id="tour-stats">
            <StatsBar expenses={expenses} />
          </div>

          {/* Search */}
          <div id="tour-search" className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              aria-label="Search expenses"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-9 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-400"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Expense list */}
          <ExpenseList
            expenses={filteredExpenses}
            onPaymentSubmit={handlePayment}
            onPriorityChange={handlePriorityChange}
            onDelete={handleDelete}
            openPaymentFormId={openPaymentFormId}
            onOpenPaymentForm={setOpenPaymentFormId}
          />
        </div>
      </div>
    </div>
  );
}
