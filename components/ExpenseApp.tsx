"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarDays, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { applyPayment, buildRolloverCopies } from "@/lib/expenseLogic";
import { templatesToExpenses } from "@/lib/templateLogic";
import { nextMonthKey, formatMonthKey } from "@/lib/monthKey";
import { useExpenseStore, CURRENCY_CONFIG } from "@/store/useExpenseStore";
import { QuickAddInput } from "@/components/QuickAddInput";
import { MonthNavigator } from "@/components/MonthNavigator";
import { MonthlySummary } from "@/components/MonthlySummary";
import { ExpenseList } from "@/components/ExpenseList";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { InsightsDashboard } from "@/components/InsightsDashboard";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Button } from "@/components/ui/button";
import type { Expense, NewExpense, Priority } from "@/types/expense";
import { notifyAfterExpenseChange } from "@/components/NotificationManager";
import { usePaginatedMonthExpenses } from "@/hooks/usePaginatedMonthExpenses";
import {
  buildMonthInsight,
  computeMonthTotals,
  monthHasUnpaid,
} from "@/lib/monthExpenseQueries";
import { AppCommandMenu } from "@/components/AppCommandMenu";
import { AppTour } from "@/components/AppTour";
import { AppTopBar, type AppTopBarHandle } from "@/components/AppTopBar";
import { useAppShortcuts } from "@/hooks/useAppShortcuts";

const TOUR_KEY = "expensio-tour-done-v2";
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
  } = useExpenseStore();

  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [search, setSearch] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const topBarRef = useRef<AppTopBarHandle>(null);
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

  const monthLiveVersion =
    useLiveQuery(
      () => db.expenses.where("monthKey").equals(activeMonthKey).count(),
      [activeMonthKey],
      0,
    ) ?? 0;

  const {
    expenses: listExpenses,
    totalCount,
    hasMore,
    loading: listLoading,
    loadingMore,
    loadMore,
    isSearching,
    patchExpense,
    removeExpenses,
  } = usePaginatedMonthExpenses(activeMonthKey, search, monthLiveVersion);

  const monthTotals =
    useLiveQuery(() => computeMonthTotals(activeMonthKey), [activeMonthKey, monthLiveVersion], null);

  const hasUnpaid =
    useLiveQuery(() => monthHasUnpaid(activeMonthKey), [activeMonthKey, monthLiveVersion], false) ??
    false;

  const insightExpenses =
    useLiveQuery(
      async () => {
        if (!insightsOpen) return [];
        const rows = await db.expenses.where("monthKey").equals(activeMonthKey).toArray();
        return rows.sort((a, b) => b.createdAt - a.createdAt);
      },
      [insightsOpen, activeMonthKey, monthLiveVersion],
      [],
    ) ?? [];

  const recentExpenses =
    useLiveQuery(async () => {
      return db.expenses.orderBy("id").reverse().limit(250).toArray();
    }, []) ?? [];

  const dueThisWeekCount =
    useLiveQuery(async () => {
      const now = Date.now();
      const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
      return db.expenses
        .filter(
          (e) =>
            e.dueDate != null &&
            e.amountPaid < e.totalAmount &&
            e.dueDate >= now &&
            e.dueDate <= weekEnd,
        )
        .count();
    }, []) ?? 0;

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

  const monthInsight = useMemo(() => {
    if (!monthTotals) return null;
    const { symbol } = CURRENCY_CONFIG[currency];
    return buildMonthInsight(monthTotals, categories, symbol, dueThisWeekCount);
  }, [monthTotals, categories, currency, dueThisWeekCount]);

  useEffect(() => {
    if (monthLiveVersion === 0 || templates.length === 0) return;
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
  }, [activeMonthKey, monthLiveVersion, templates]);

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
    const expense = listExpenses.find((e) => e.id === id) ?? (await db.expenses.get(id));
    if (!expense) return;

    const update = applyPayment(expense, amount);
    patchExpense(id, update);

    await db.transaction("rw", db.expenses, async () => {
      const current = await db.expenses.get(id);
      if (!current) return;
      const persisted = applyPayment(current, amount);
      await db.expenses.update(id, persisted);
      const newPaid = current.amountPaid + amount;
      const isNowPaid = newPaid >= current.totalAmount;
      if (isNowPaid) {
        toast.success(`"${current.title}" fully paid! 🎉`);
      } else {
        toast.success(`Payment recorded for "${current.title}"`);
      }
    });
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    patchExpense(id, { priority });
    await db.expenses.update(id, { priority });
  }

  async function handleDelete(id: number) {
    const expense = listExpenses.find((e) => e.id === id) ?? (await db.expenses.get(id));
    if (!expense) return;
    const snapshot = { ...expense };
    removeExpenses([id]);
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
    const expense = listExpenses.find((e) => e.id === id) ?? (await db.expenses.get(id));
    if (!expense || expense.status === "paid") return;
    patchExpense(id, { amountPaid: expense.totalAmount, status: "paid" });
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
    removeExpenses(ids);
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
    patchExpense(id, finalUpdates);
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

  function focusQuickAdd() {
    document.getElementById("quick-add-input")?.focus();
    document.getElementById("quick-add-input")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusSearchField() {
    topBarRef.current?.focusSearch();
  }

  useAppShortcuts({
    enabled: true,
    activeMonthKey,
    onNavigateMonth: setActiveMonthKey,
    onFocusQuickAdd: focusQuickAdd,
    onFocusSearch: focusSearchField,
  });

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
        expenses={insightExpenses}
      />
      <AppCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        activeMonthKey={activeMonthKey}
        otherMonthKeys={otherMonths}
        currency={currency}
        onNavigateMonth={setActiveMonthKey}
        onEditExpense={setEditingExpense}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenInsights={() => setInsightsOpen(true)}
        onOpenImport={() => setImportOpen(true)}
        onStartTour={() => setShowTour(true)}
        onFocusQuickAdd={focusQuickAdd}
        onFocusSearch={focusSearchField}
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

        <AppTopBar
          ref={topBarRef}
          search={search}
          onSearchChange={setSearch}
          onOpenCommand={() => setCommandOpen(true)}
          importOpen={importOpen}
          onImportOpenChange={setImportOpen}
          activeMonthKey={activeMonthKey}
          onNavigateMonth={(monthKey) => {
            setActiveMonthKey(monthKey);
            setImportOpen(false);
          }}
          onImportComplete={notifyAfterExpenseChange}
          hasUnpaid={hasUnpaid}
          onRollover={handleRollover}
          onOpenSettings={() => setSettingsOpen(true)}
          onStartTour={() => setShowTour(true)}
        />

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
              totalOwed={monthTotals?.totalOwed ?? 0}
              totalPaid={monthTotals?.totalPaid ?? 0}
              insight={monthInsight}
              loading={monthTotals == null}
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
                    {listExpenses.length} match{listExpenses.length === 1 ? "" : "es"}
                    {isSearching && totalCount > listExpenses.length
                      ? ` (showing first ${listExpenses.length})`
                      : ""}
                  </span>
                )}
                {!search.trim() && totalCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {listExpenses.length} of {totalCount}
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
              expenses={listExpenses}
              loading={listLoading}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
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
