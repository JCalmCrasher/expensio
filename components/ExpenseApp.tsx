"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { applyPayment, buildRolloverCopies } from "@/lib/expenseLogic";
import { nextMonthKey } from "@/lib/monthKey";
import { useExpenseStore } from "@/store/useExpenseStore";
import { QuickAddInput } from "@/components/QuickAddInput";
import { MonthNavigator } from "@/components/MonthNavigator";
import { MonthlySummary } from "@/components/MonthlySummary";
import { RolloverButton } from "@/components/RolloverButton";
import { ExpenseList } from "@/components/ExpenseList";
import type { NewExpense, Priority } from "@/types/expense";

export default function ExpenseApp() {
  const {
    activeMonthKey,
    setActiveMonthKey,
    openPaymentFormId,
    setOpenPaymentFormId,
  } = useExpenseStore();

  const [dbUnavailable, setDbUnavailable] = useState(false);

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

  async function handleRollover() {
    const unpaid = await db.expenses
      .where("monthKey")
      .equals(activeMonthKey)
      .filter((e) => e.status === "unpaid")
      .toArray();
    const copies = buildRolloverCopies(unpaid, nextMonthKey(activeMonthKey));
    await db.expenses.bulkAdd(copies.map((c) => ({ ...c, createdAt: Date.now() })));
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-[var(--font-sans),ui-sans-serif,system-ui,sans-serif]">
      {dbUnavailable && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-amber-50 px-5 py-3 text-sm text-amber-800 border-b border-amber-200"
        >
          <span aria-hidden="true">⚠️</span>
          Storage unavailable — expenses won&apos;t persist between sessions.
        </div>
      )}

      {/* Page wrapper — centered, max-width, white card feel */}
      <div className="mx-auto w-full max-w-xl px-4 pb-16">
        {/* App header */}
        <div className="pt-10 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Expenses</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Track what you owe, pay it down.</p>
        </div>

        {/* Quick-add */}
        <QuickAddInput onAdd={handleAdd} activeMonthKey={activeMonthKey} />

        {/* Month bar */}
        <div className="mt-6 flex items-center justify-between">
          <MonthNavigator
            activeMonthKey={activeMonthKey}
            onNavigate={setActiveMonthKey}
          />
          <RolloverButton
            expenses={expenses}
            activeMonthKey={activeMonthKey}
            onRollover={handleRollover}
          />
        </div>

        {/* Summary card */}
        <div className="mt-4">
          <MonthlySummary expenses={expenses} />
        </div>

        {/* Expense list */}
        <div className="mt-6">
          <ExpenseList
            expenses={expenses}
            onPaymentSubmit={handlePayment}
            onPriorityChange={handlePriorityChange}
            openPaymentFormId={openPaymentFormId}
            onOpenPaymentForm={setOpenPaymentFormId}
          />
        </div>
      </div>
    </div>
  );
}
