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
import { EditExpenseModal } from "@/components/EditExpenseModal";
import type { Expense, NewExpense, Priority } from "@/types/expense";
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
    await db.expenses.add({ ...expense, monthKey: activeMonthKey, createdAt: Date.now() });
  }

  async function handlePayment(id: number, amount: number) {
    const expense = await db.expenses.get(id);
    if (!expense) return;
    await db.expenses.update(id, applyPayment(expense, amount));
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    await db.expenses.update(id, { priority });
  }

  async function handleDelete(id: number) {
    await db.expenses.delete(id);
  }

  async function handleEdit(id: number, updates: Partial<Expense>) {
    await db.expenses.update(id, updates);
  }

  async function handleRollover() {
    const targetMonth = nextMonthKey(activeMonthKey);
    const unpaid = await db.expenses
      .where("monthKey").equals(activeMonthKey)
      .filter((e) => e.status === "unpaid")
      .toArray();
    const existing = await db.expenses.where("monthKey").equals(targetMonth).toArray();
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
      <AppSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <EditExpenseModal
        expense={editingExpense}
        open={editingExpense !== null}
        onClose={() => setEditingExpense(null)}
        onSave={handleEdit}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {dbUnavailable && (
          <div role="alert" className="flex items-center gap-2 bg-amber-50 px-5 py-3 text-sm text-amber-800 border-b border-amber-200">
            <span aria-hidden="true">⚠️</span>
            Storage unavailable — expenses won&apos;t persist between sessions.
          </div>
        )}

        {/* ── Top bar: title · search · actions ── */}
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:hidden"
            >
              <Menu size={17} />
            </button>

            {/* Title */}
            <h1 className="shrink-0 text-base font-bold tracking-tight text-zinc-900">
              Expenses
            </h1>

            {/* Search — grows to fill space */}
            <div id="tour-search" className="relative flex-1">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
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
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Tour */}
            <button
              onClick={() => setShowTour(true)}
              aria-label="Take a tour"
              title="Take a tour"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <HelpCircle size={15} />
            </button>

            {/* Rollover */}
            <div id="tour-rollover" className="shrink-0">
              <RolloverButton
                expenses={expenses}
                activeMonthKey={activeMonthKey}
                onRollover={handleRollover}
              />
            </div>
          </div>
        </div>

        {/* ── Page body ── */}
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">

          {/* Quick-add */}
          <div id="tour-quick-add" className="pt-5">
            <QuickAddInput onAdd={handleAdd} activeMonthKey={activeMonthKey} />
          </div>

          {/* Month nav + stats inline */}
          <div id="tour-month-nav" className="mt-5 flex items-center justify-between gap-4">
            <MonthNavigator activeMonthKey={activeMonthKey} onNavigate={setActiveMonthKey} />
            <div id="tour-stats">
              <StatsBar expenses={expenses} />
            </div>
          </div>

          {/* Summary card */}
          <div id="tour-summary" className="mt-4">
            <MonthlySummary expenses={expenses} />
          </div>

          {/* Expense list */}
          <div className="mt-5">
            <ExpenseList
              expenses={filteredExpenses}
              onPaymentSubmit={handlePayment}
              onPriorityChange={handlePriorityChange}
              onDelete={handleDelete}
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
