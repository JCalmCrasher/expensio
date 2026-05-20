"use client";

import { useRef, useState } from "react";
import { Trash2, AlertTriangle, CheckCircle2, CalendarClock, Pencil } from "lucide-react";
import { ExpenseRow } from "@/components/ExpenseCard";
import { PartialPaymentForm } from "@/components/PartialPaymentForm";
import { getCategoryColor } from "@/lib/categoryColor";
import { useCurrency } from "@/lib/useCurrency";
import type { Expense, Priority } from "@/types/expense";
import { Button } from "@/components/ui/button";

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

const TH = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th
    scope="col"
    className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400 ${className}`}
  >
    {children}
  </th>
);

// ── Swipe constants ───────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80; // px to start revealing an action zone
const SWIPE_COMMIT = 220; // px to auto-trigger the action (increased to prevent accidents)

function MobileDeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="destructive-solid"
          size="compact"
          onClick={confirm}
          disabled={deleting}
        >
          {deleting ? "…" : "Delete"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="compact"
          onClick={() => setConfirming(false)}
          className="text-zinc-500"
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost-danger"
      size="icon-sm"
      onClick={() => setConfirming(true)}
      aria-label="Delete"
    >
      <Trash2 size={12} />
    </Button>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────

function MobileCard({
  expense,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onMarkPaid,
  onPaymentSubmit,
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
  onOpenPaymentForm: (id: number | null) => void;
  openPaymentFormId: number | null;
}) {
  const { fmt } = useCurrency();
  const isPaid = expense.status === "paid";
  const percent =
    expense.totalAmount > 0
      ? Math.min(100, Math.round((expense.amountPaid / expense.totalAmount) * 100))
      : 0;
  const due = expense.dueDate ? new Date(expense.dueDate) : null;
  const overdue = due && !isPaid && due < new Date();

  // offsetX > 0 = swiped left (delete), offsetX < 0 = swiped right (complete)
  const [offsetX, setOffsetX] = useState(0);
  const [acting, setActing] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef<boolean | null>(null); // null = undecided

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isScrolling.current = null; // reset on each new touch
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const dx = startX.current - e.touches[0].clientX;
    const dy = startY.current - e.touches[0].clientY;

    // Decide once whether this gesture is a scroll or a swipe
    if (isScrolling.current === null) {
      // Require horizontal movement to be at least 1.5× the vertical movement
      // before treating it as a swipe — prevents accidental swipes while scrolling
      if (Math.abs(dy) > Math.abs(dx) * 0.7) {
        isScrolling.current = true;
      } else if (Math.abs(dx) > 8) {
        isScrolling.current = false;
      } else {
        return; // not enough movement yet to decide
      }
    }

    if (isScrolling.current) {
      // User is scrolling — snap back and ignore
      setOffsetX(0);
      return;
    }

    if (dx > 0) {
      // Swipe left — delete zone
      setOffsetX(Math.min(dx, SWIPE_COMMIT + 20));
    } else if (!isPaid) {
      // Swipe right — complete zone (only for unpaid)
      setOffsetX(Math.max(dx, -(SWIPE_COMMIT + 20)));
    }
  }

  async function onTouchEnd() {
    isDragging.current = false;
    if (offsetX >= SWIPE_COMMIT) {
      // Full left swipe → delete immediately
      setActing(true);
      try {
        await onDelete();
      } finally {
        setActing(false);
        setOffsetX(0);
      }
    } else if (offsetX <= -SWIPE_COMMIT && !isPaid) {
      // Full right swipe → mark as paid
      setActing(true);
      try {
        await onMarkPaid();
      } finally {
        setActing(false);
        setOffsetX(0);
      }
    } else {
      // Partial swipe → snap back
      setOffsetX(0);
    }
  }

  const isPaymentOpen = openPaymentFormId === expense.id;
  const swipingLeft = offsetX > SWIPE_THRESHOLD;
  const swipingRight = offsetX < -SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* ── Green complete zone (revealed on right swipe) ── */}
      {!isPaid && (
        <div
          className={`absolute inset-0 flex items-center justify-start rounded-2xl bg-emerald-500 px-5 ${
            offsetX < 0 ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <CheckCircle2 size={22} className="text-white" />
        </div>
      )}

      {/* ── Red delete zone (revealed on left swipe) ── */}
      <div
        className={`absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500 px-5 ${
          offsetX > 0 ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <Trash2 size={22} className="text-white" />
      </div>

      {/* ── Card content — slides on swipe ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${-offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 0.25s ease",
          opacity: acting ? 0.5 : 1,
        }}
        className={[
          "relative border bg-white p-4 shadow-sm rounded-2xl",
          isPaid ? "border-zinc-100 opacity-60" : "border-zinc-200",
          selected ? "ring-2 ring-green-400 ring-offset-1" : "",
          swipingLeft ? "border-red-200" : swipingRight ? "border-emerald-200" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-zinc-300 accent-green-600 cursor-pointer"
          />

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              {isPaid && <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />}
              <span
                className={`text-sm font-semibold ${isPaid ? "line-through text-zinc-400" : "text-zinc-900"}`}
              >
                {expense.title}
              </span>
              {expense.rolledOver && (
                <span className="rounded-full bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-500">
                  rolled
                </span>
              )}
              {expense.category && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getCategoryColor(expense.category)}`}
                >
                  {expense.category}
                </span>
              )}
            </div>

            {expense.note?.trim() && (
              <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{expense.note}</p>
            )}

            {/* Amount + due */}
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-zinc-800 tabular-nums">
                {fmt(expense.totalAmount)}
              </span>
              {expense.amountPaid > 0 && !isPaid && (
                <span className="text-xs text-zinc-400 tabular-nums">
                  {fmt(expense.amountPaid)} paid
                </span>
              )}
              {due && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-red-500" : "text-zinc-400"}`}
                >
                  <CalendarClock size={10} />
                  {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {overdue && " · late"}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2.5">
              <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${isPaid ? "bg-emerald-500" : "bg-green-500"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-400">{percent}%</p>
            </div>

            {/* Actions row */}
            <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-2.5">
              {!isPaid && (
                <Button
                  type="button"
                  variant={isPaymentOpen ? "pay-muted" : "pay"}
                  onClick={() => onOpenPaymentForm(isPaymentOpen ? null : (expense.id ?? null))}
                  className="px-3 py-1"
                >
                  {isPaymentOpen ? "Cancel" : "+ Pay"}
                </Button>
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost-edit"
                  size="icon-sm"
                  onClick={onEdit}
                  aria-label="Edit"
                >
                  <Pencil size={12} />
                </Button>
                <MobileDeleteButton onDelete={onDelete} />
              </div>
            </div>

            {/* Inline payment form */}
            {isPaymentOpen && (
              <PartialPaymentForm
                expense={expense}
                onSubmit={async (amount) => {
                  await onPaymentSubmit(amount);
                  onOpenPaymentForm(null);
                }}
                onCancel={() => onOpenPaymentForm(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-14 text-center">
        <p className="text-sm font-medium text-zinc-400">No expenses yet</p>
        <p className="mt-1 text-xs text-zinc-300">
          Type above and press Enter to add your first one.
        </p>
      </div>
    );
  }

  const bulkToolbar = someSelected && (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
      <span className="text-xs font-semibold text-zinc-600">{selected.size} selected</span>
      {confirmBulk ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
            <AlertTriangle size={11} />
            Delete {selected.size} expense{selected.size !== 1 ? "s" : ""}?
          </span>
          <Button
            type="button"
            variant="destructive-solid"
            size="compact"
            onClick={handleBulkDelete}
            disabled={deleting}
            className="px-2.5 py-1 text-[11px]"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setConfirmBulk(false)}
            className="px-2.5 py-1 text-[11px] text-zinc-500"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="destructive-outline"
          size="compact"
          onClick={() => setConfirmBulk(true)}
          className="gap-1.5 px-2.5 py-1 text-[11px]"
        >
          <Trash2 size={11} />
          Delete selected
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile: card list ── */}
      <div className="md:hidden">
        {/* Mobile select-all + bulk toolbar */}
        <div className="mb-2 flex items-center gap-2 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label="Select all expenses"
              className="h-3.5 w-3.5 rounded border-zinc-300 accent-green-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-zinc-500">
              {allSelected ? "Deselect all" : "Select all"}
            </span>
          </label>
          {someSelected && (
            <span className="ml-auto text-[11px] font-semibold text-zinc-500">
              {selected.size} selected
            </span>
          )}
        </div>

        {someSelected && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-3">
            {bulkToolbar}
          </div>
        )}

        <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-0.5">
          {expenses.map((expense) => (
            <MobileCard
              key={expense.id}
              expense={expense}
              selected={selected.has(expense.id!)}
              onToggleSelect={() => toggleOne(expense.id!)}
              onEdit={() => onEdit(expense)}
              onDelete={() => {
                if (!expense.id) return Promise.resolve(); // F13: guard null id
                return onDelete(expense.id);
              }}
              onMarkPaid={() => {
                if (!expense.id) return Promise.resolve(); // F13
                return onMarkPaid(expense.id);
              }}
              onPaymentSubmit={(amount) => {
                if (!expense.id) return Promise.resolve(); // F13
                return onPaymentSubmit(expense.id, amount);
              }}
              onOpenPaymentForm={onOpenPaymentForm}
              openPaymentFormId={openPaymentFormId}
            />
          ))}
        </div>

        {/* Swipe hint — shown once */}
        <p className="mt-2 text-center text-[10px] text-zinc-300">
          ← swipe left to delete · swipe right to complete →
        </p>
      </div>

      {/* ── Desktop: table ── */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {bulkToolbar}
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th scope="col" className="w-10 pl-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all expenses"
                    className="h-3.5 w-3.5 rounded border-zinc-300 accent-green-600 cursor-pointer"
                  />
                </th>
                <TH>Expense</TH>
                <TH className="text-right">Amount</TH>
                <TH className="w-28">Progress</TH>
                <TH>Due</TH>
                <TH>Priority</TH>
                <TH className="pr-4 text-right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  selected={selected.has(expense.id!)}
                  onToggleSelect={() => toggleOne(expense.id!)}
                  openPaymentFormId={openPaymentFormId}
                  onOpenPaymentForm={onOpenPaymentForm}
                  onPaymentSubmit={(amount) => {
                    if (!expense.id) return Promise.resolve(); // F13
                    return onPaymentSubmit(expense.id, amount);
                  }}
                  onPriorityChange={(priority) => {
                    if (!expense.id) return Promise.resolve(); // F13
                    return onPriorityChange(expense.id, priority);
                  }}
                  onDelete={() => {
                    if (!expense.id) return Promise.resolve(); // F13
                    return onDelete(expense.id);
                  }}
                  onEdit={() => onEdit(expense)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
