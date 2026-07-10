"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { groupExpensesByDay } from "@/lib/groupExpensesByDay";
import { getCategoryColor } from "@/lib/categoryColor";
import { useCurrency } from "@/lib/useCurrency";
import { useIsMobile } from "@/lib/useIsMobile";
import { PartialPaymentForm } from "@/components/PartialPaymentForm";
import { Button } from "@/components/ui/button";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
  onPaymentSubmit: (id: number, amount: number) => Promise<void>;
  onPriorityChange: (id: number, priority: Priority) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBulkDelete: (ids: number[]) => Promise<void>;
  onMarkPaid: (id: number) => Promise<void>;
  onEdit: (expense: Expense) => void;
  openPaymentFormId: number | null;
  onOpenPaymentForm: (id: number | null) => void;
}

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const SWIPE_COMMIT = 220;

function ExpenseRow({
  expense,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onMarkPaid,
  onPaymentSubmit,
  onPriorityChange,
  onOpenPaymentForm,
  openPaymentFormId,
}: {
  expense: Expense;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onPaymentSubmit: (amount: number) => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  onOpenPaymentForm: (id: number | null) => void;
  openPaymentFormId: number | null;
}) {
  const { fmt } = useCurrency();
  const isMobile = useIsMobile();
  const isPaid = expense.status === "paid";
  const isPaymentOpen = openPaymentFormId === expense.id;

  const [offsetX, setOffsetX] = useState(0);
  const [acting, setActing] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef<boolean | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isScrolling.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isMobile || !isDragging.current) return;
    const dx = startX.current - e.touches[0].clientX;
    const dy = startY.current - e.touches[0].clientY;

    if (isScrolling.current === null) {
      if (Math.abs(dy) > Math.abs(dx) * 0.7) isScrolling.current = true;
      else if (Math.abs(dx) > 8) isScrolling.current = false;
      else return;
    }
    if (isScrolling.current) {
      setOffsetX(0);
      return;
    }

    if (dx > 0) setOffsetX(Math.min(dx, SWIPE_COMMIT + 20));
    else if (!isPaid) setOffsetX(Math.max(dx, -(SWIPE_COMMIT + 20)));
  }

  async function onTouchEnd() {
    if (!isMobile) return;
    isDragging.current = false;
    if (offsetX >= SWIPE_COMMIT) {
      setActing(true);
      try {
        await onDelete();
      } finally {
        setActing(false);
        setOffsetX(0);
      }
    } else if (offsetX <= -SWIPE_COMMIT && !isPaid) {
      setActing(true);
      try {
        await onMarkPaid();
      } finally {
        setActing(false);
        setOffsetX(0);
      }
    } else {
      setOffsetX(0);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl">
        {!isPaid && isMobile && (
          <div
            className={`absolute inset-0 flex items-center justify-start rounded-2xl bg-[#16a34a] px-5 ${offsetX < 0 ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          >
            <CheckCircle2 size={20} className="text-white" />
          </div>
        )}
        {isMobile && (
          <div
            className={`absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500 px-5 ${offsetX > 0 ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          >
            <Trash2 size={20} className="text-white" />
          </div>
        )}

        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: isMobile ? `translateX(${-offsetX}px)` : undefined,
            transition: isDragging.current ? "none" : "transform 0.25s ease",
            opacity: acting ? 0.5 : 1,
          }}
          className={[
            "rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm",
            isPaid ? "opacity-70" : "",
            selected ? "ring-2 ring-green-600/30 dark:ring-green-500/30" : "",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select ${expense.title}`}
              className="mt-1 h-3.5 w-3.5 rounded border-border accent-green-600 dark:accent-green-500"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${isPaid ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {expense.title}
                    </span>
                    {expense.category && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(expense.category)}`}
                      >
                        {expense.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {fmt(expense.totalAmount)}
                  </p>
                  <span
                    className={[
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      isPaid
                        ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={expense.priority}
                  onChange={(e) => void onPriorityChange(e.target.value as Priority)}
                  aria-label={`Priority for ${expense.title}`}
                  className="h-7 rounded-lg border border-border bg-muted px-2 text-[11px] font-medium text-muted-foreground"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {!isPaid && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    onClick={() => onOpenPaymentForm(isPaymentOpen ? null : (expense.id ?? null))}
                    className="h-7 px-2.5 text-[11px] font-medium text-green-600 hover:bg-accent dark:text-green-400"
                  >
                    {isPaymentOpen ? "Cancel" : "+ Pay"}
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onEdit}
                    aria-label="Edit"
                    className="text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void onDelete()}
                    aria-label="Delete"
                    className="text-muted-foreground/50 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPaymentOpen && (
        <div className="rounded-2xl border border-border bg-muted px-4 py-3">
          <PartialPaymentForm
            expense={expense}
            onSubmit={async (amount) => {
              await onPaymentSubmit(amount);
              onOpenPaymentForm(null);
            }}
            onCancel={() => onOpenPaymentForm(null)}
          />
        </div>
      )}
    </div>
  );
}

export function ExpenseList({
  expenses,
  onPaymentSubmit,
  onPriorityChange,
  onDelete,
  onBulkDelete,
  onMarkPaid,
  onEdit,
  openPaymentFormId,
  onOpenPaymentForm,
}: ExpenseListProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const groups = groupExpensesByDay(expenses);
  const ids = expenses.map((e) => e.id!);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      await onBulkDelete([...selected]);
      setSelected(new Set());
      setConfirmBulk(false);
    } finally {
      setDeleting(false);
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">No expenses yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Type above and press Enter to add your first one.</p>
      </div>
    );
  }

  return (
    <div id="tour-expenses" className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all expenses"
            className="h-3.5 w-3.5 rounded border-border accent-green-600 dark:accent-green-500"
          />
          {allSelected ? "Deselect all" : "Select all"}
        </label>

        {someSelected && !confirmBulk && (
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setConfirmBulk(true)}
            className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Delete {selected.size} selected
          </Button>
        )}
        {someSelected && confirmBulk && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive-solid"
              size="compact"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Confirm"}
            </Button>
            <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmBulk(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h3 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          <div className="space-y-2.5">
            {group.expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                selected={selected.has(expense.id!)}
                onToggleSelect={() => toggleOne(expense.id!)}
                onEdit={() => onEdit(expense)}
                onDelete={() => (expense.id ? onDelete(expense.id) : Promise.resolve())}
                onMarkPaid={() => (expense.id ? onMarkPaid(expense.id) : Promise.resolve())}
                onPaymentSubmit={(amount) =>
                  expense.id ? onPaymentSubmit(expense.id, amount) : Promise.resolve()
                }
                onPriorityChange={(priority) =>
                  expense.id ? onPriorityChange(expense.id, priority) : Promise.resolve()
                }
                onOpenPaymentForm={onOpenPaymentForm}
                openPaymentFormId={openPaymentFormId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
