"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, HelpCircle, X, CalendarDays, Settings, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { applyPayment, buildRolloverCopies } from "@/lib/expenseLogic";
import { templatesToExpenses } from "@/lib/templateLogic";
import { filterRecentExpenses } from "@/lib/expenseMemory";
import { nextMonthKey, formatMonthKey } from "@/lib/monthKey";
import { useExpenseStore, CURRENCY_CONFIG } from "@/store/useExpenseStore";
import type { Currency } from "@/store/useExpenseStore";
import { QuickAddInput } from "@/components/QuickAddInput";
import { MonthNavigator } from "@/components/MonthNavigator";
import { MonthlySummary } from "@/components/MonthlySummary";
import { RolloverButton } from "@/components/RolloverButton";
import { ExpenseList } from "@/components/ExpenseList";
import { DataMenu } from "@/components/DataMenu";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { InsightsDashboard } from "@/components/InsightsDashboard";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Expense, NewExpense, Priority } from "@/types/expense";
import { notifyAfterExpenseChange } from "@/components/NotificationManager";
import dynamic from "next/dynamic";

const AppTour = dynamic(() => import("@/components/AppTour").then((m) => m.AppTour), {
  ssr: false,
});

const TOUR_KEY = "expensio-tour-done-v1"; // F8: versioned to avoid cross-deployment collision
const TEMPLATE_PROMPT_KEY = "expensio-template-prompt";

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
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const templatePromptedRef = useRef<string | null>(null);

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

  const allExpenses =
    useLiveQuery(
      async () => {
        const rows = await db.expenses.toArray();
        return rows.sort((a, b) => b.createdAt - a.createdAt);
      },
      [],
      [],
    ) ?? [];

  const recentExpenses = useMemo(
    () => filterRecentExpenses(allExpenses),
    [allExpenses],
  );

  const categories =
    useLiveQuery(async () => db.categories.toArray(), [], []) ?? [];

  const templates =
    useLiveQuery(async () => db.templates.toArray(), [], []) ?? [];

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

  useEffect(() => {
    if (expenses.length > 0 || templates.length === 0) return;
    if (templatePromptedRef.current === activeMonthKey) return;
    const dismissed = sessionStorage.getItem(`${TEMPLATE_PROMPT_KEY}-${activeMonthKey}`);
    if (dismissed) return;

    templatePromptedRef.current = activeMonthKey;
    const monthLabel = formatMonthKey(activeMonthKey);
    toast(`Add ${templates.length} recurring expense${templates.length === 1 ? "" : "s"} for ${monthLabel}?`, {
      action: {
        label: "Add all",
        onClick: async () => {
          const rows = templatesToExpenses(templates, activeMonthKey);
          const now = Date.now();
          await db.expenses.bulkAdd(rows.map((e) => ({ ...e, createdAt: now })));
          toast.success(`Added ${rows.length} recurring expenses`);
          notifyAfterExpenseChange();
        },
      },
      onDismiss: () => {
        sessionStorage.setItem(`${TEMPLATE_PROMPT_KEY}-${activeMonthKey}`, "1");
      },
      onAutoClose: () => {
        sessionStorage.setItem(`${TEMPLATE_PROMPT_KEY}-${activeMonthKey}`, "1");
      },
    });
  }, [activeMonthKey, expenses.length, templates]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function ensureCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await db.categories.add({ name: trimmed, maxAmount: 0 });
    } catch {
      // category already exists
    }
  }

  async function handleAdd(expense: NewExpense) {
    await ensureCategory(expense.category);
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
    notifyAfterExpenseChange();
  }

  async function handleAddMultiple(expenses: NewExpense[]) {
    if (expenses.length === 0) return;
    const now = Date.now();
    await db.expenses.bulkAdd(
      expenses.map((e) => ({
        ...e,
        monthKey: resolveMonthKey(e, activeMonthKey),
        createdAt: now,
      })),
    );
    toast.success(
      `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} imported from scan`,
    );
    notifyAfterExpenseChange();
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
    if (!expense) return;
    const snapshot = { ...expense };
    await db.expenses.delete(id);
    toast.error(`"${expense.title}" deleted`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const { id: _id, ...rest } = snapshot;
          await db.expenses.add(rest);
          toast.success(`"${expense.title}" restored`);
        },
      },
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
    const snapshots = (
      await Promise.all(ids.map((id) => db.expenses.get(id)))
    ).filter((e): e is Expense => e != null);
    await db.expenses.bulkDelete(ids);
    const count = snapshots.length;
    toast.error(`${count} expense${count !== 1 ? "s" : ""} deleted`, {
      action: {
        label: "Undo",
        onClick: async () => {
          await db.expenses.bulkAdd(
            snapshots.map(({ id: _id, ...rest }) => rest)
          );
          toast.success(
            `${count} expense${count !== 1 ? "s" : ""} restored`
          );
        },
      },
    });
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
    notifyAfterExpenseChange();
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
    <div className="min-h-screen bg-background">
      {showTour && <AppTour onDone={handleTourDone} />}
      <EditExpenseModal
        expense={editingExpense}
        open={editingExpense !== null}
        onClose={() => setEditingExpense(null)}
        onSave={handleEdit}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <InsightsDashboard
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        expenses={expenses}
      />

      <div className="flex min-h-screen flex-col">
        {dbUnavailable && (
          <div
            role="alert"
            className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
          >
            <span aria-hidden="true">⚠️</span>
            Storage unavailable — expenses won&apos;t persist between sessions.
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3">
            <h1 className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
              Expensio
            </h1>

            <div className="ml-auto flex min-w-0 items-center gap-1.5">
              <div
                id="tour-search"
                className="relative hidden min-w-0 flex-1 sm:block sm:max-w-44"
              >
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                />
                <Input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  aria-label="Search expenses"
                  className="bg-card py-2 pl-8 pr-7 focus-visible:border-ring focus-visible:ring-ring/20"
                />
                {search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setSearch("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    <X size={13} />
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => mobileSearchRef.current?.focus(), 50);
                }}
                aria-label="Search"
                className="text-muted-foreground sm:hidden"
              >
                <Search size={16} />
              </Button>

              <div className="flex shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
                {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => {
                  const { symbol, flag } = CURRENCY_CONFIG[c];
                  return (
                    <Button
                      key={c}
                      type="button"
                      variant={currency === c ? "pill-active" : "pill"}
                      onClick={() => setCurrency(c)}
                      aria-label={`Switch to ${c}`}
                      title={c}
                      className="px-1.5 sm:px-2"
                    >
                      <span className="hidden sm:inline">{flag}</span>
                      <span>{symbol}</span>
                    </Button>
                  );
                })}
              </div>

              <DataMenu
                importOpen={importOpen}
                onImportOpenChange={setImportOpen}
                activeMonthKey={activeMonthKey}
                onImportComplete={notifyAfterExpenseChange}
                onNavigateMonth={(monthKey) => {
                  setActiveMonthKey(monthKey);
                  setImportOpen(false);
                }}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                title="Settings"
                className="text-muted-foreground"
              >
                <Settings size={15} />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowTour(true)}
                aria-label="Take a tour"
                title="Take a tour"
                className="text-muted-foreground"
              >
                <HelpCircle size={15} />
              </Button>

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

        {/* ── Mobile search overlay ── */}
        {searchOpen && (
          <>
            <div
              className="fixed inset-0 z-30 sm:hidden"
              onClick={() => setSearchOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-2 bg-card px-4 py-3 shadow-lg sm:hidden">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ref={mobileSearchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses…"
                  aria-label="Search expenses"
                  className="border-green-600/40 bg-card py-2.5 pl-8 pr-7 ring-2 ring-green-600/30 focus-visible:outline-none dark:border-green-500/40 dark:ring-green-500/30"
                />
                {search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearch("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={13} />
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="link-brand"
                size="sm"
                onClick={() => setSearchOpen(false)}
                className="shrink-0 font-medium"
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* ── Page body ── */}
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-6">
          <div id="tour-quick-add">
            <QuickAddInput
              onAdd={handleAdd}
              onAddMultiple={handleAddMultiple}
              activeMonthKey={activeMonthKey}
              recentExpenses={recentExpenses}
            />
          </div>

          <div className="mt-6">
            <MonthNavigator activeMonthKey={activeMonthKey} onNavigate={setActiveMonthKey} />
          </div>

          {otherMonths.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-0.5">
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <CalendarDays size={11} />
                Also in:
              </span>
              {otherMonths.slice(0, 6).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant="chip"
                  onClick={() => setActiveMonthKey(m)}
                >
                  {formatMonthKey(m)}
                </Button>
              ))}
              {otherMonths.length > 6 && (
                <span className="shrink-0 text-[10px] text-muted-foreground/70">
                  +{otherMonths.length - 6} more
                </span>
              )}
            </div>
          )}

          <div className="mt-6">
            <MonthlySummary
              expenses={expenses}
              allExpenses={allExpenses}
              categories={categories}
            />
          </div>

          <section className="mt-8" aria-labelledby="expenses-heading">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <h2 id="expenses-heading" className="text-sm font-semibold text-foreground">
                  Expenses
                </h2>
                {search.trim() && (
                  <span className="text-[11px] text-muted-foreground">
                    {filteredExpenses.length} match{filteredExpenses.length === 1 ? "" : "es"}
                  </span>
                )}
              </div>
              <Button
                id="tour-insights"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInsightsOpen(true)}
                className="shrink-0 gap-1 border-[#e5e5e3] bg-white text-[#6b6b68] hover:bg-[#f5f5f4]"
              >
                <LayoutDashboard size={14} aria-hidden />
                <span className="text-xs font-medium">Insights</span>
              </Button>
            </div>
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
          </section>
        </div>
      </div>
    </div>
  );
}
