"use client";

import { useRef, useState } from "react";
import { Trash2, AlertTriangle, CheckCircle2, CalendarClock, Pencil } from "lucide-react";
import { ExpenseRow } from "@/components/ExpenseCard";
import { getCategoryColor } from "@/lib/categoryColor";
import { useCurrency } from "@/lib/useCurrency";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
  onPaymentSubmit: (id: number, amount: number) => Promise<void>;
  onPriorityChange: (id: number, priority: Priority) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBulkDelete: (ids: number[]) => Promise<void>;
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

// ── Mobile card with swipe-to-delete ─────────────────────────────────────────

const SWIPE_THRESHOLD = 100;  // px to reveal the delete zone
const SWIPE_COMMIT   = 220;  // px to auto-trigger delete
const REVEAL_WIDTH   = 180;  // width of the revealed red zone

function MobileCard({
  expense,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onOpenPaymentForm,
  openPaymentFormId,
}: {
  expense: Expense;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
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

  const [offsetX, setOffsetX] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const startX = useRef(0);
  const isDragging = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const dx = startX.current - e.touches[0].clientX;
    if (dx < 0) { setOffsetX(0); return; }
    setOffsetX(Math.min(dx, SWIPE_COMMIT + 20));
  }

  function onTouchEnd() {
    isDragging.current = false;
    if (offsetX >= SWIPE_COMMIT) {
      setConfirming(true);
      setOffsetX(REVEAL_WIDTH);
    } else if (offsetX >= SWIPE_THRESHOLD) {
      setOffsetX(REVEAL_WIDTH);
    } else {
      setOffsetX(0);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirming(false);
      setOffsetX(0);
    }
  }

  const isRevealed = offsetX >= SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Red delete zone behind the card */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end rounded-2xl bg-red-500 px-5"
        style={{ width: REVEAL_WIDTH }}
        aria-hidden="true"
      >
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-60"
            >
              {deleting ? "…" : "Delete"}
            </button>
            <button
              onClick={() => { setConfirming(false); setOffsetX(0); }}
              className="rounded-lg bg-red-400 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Trash2 size={20} className="text-white" />
        )}
      </div>

      {/* Card content — slides left on swipe */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(-${offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 0.25s ease",
        }}
        className={[
          "relative border bg-white p-4 shadow-sm rounded-2xl",
          isPaid ? "border-zinc-100 opacity-60" : "border-zinc-200",
          selected ? "ring-2 ring-violet-400 ring-offset-1" : "",
          isRevealed && !confirming ? "shadow-md" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-zinc-300 accent-violet-600 cursor-pointer"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isPaid && <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />}
              <span className={`text-sm font-semibold ${isPaid ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                {expense.title}
              </span>
              {expense.rolledOver && (
                <span className="rounded-full bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-500">
                  rolled
                </span>
              )}
              {expense.category && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getCategoryColor(expense.category)}`}>
                  {expense.category}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-zinc-800 tabular-nums">{fmt(expense.totalAmount)}</span>
              {expense.amountPaid > 0 && !isPaid && (
                <span className="text-xs text-zinc-400 tabular-nums">{fmt(expense.amountPaid)} paid</span>
              )}
              {due && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-red-500" : "text-zinc-400"}`}>
                  <CalendarClock size={10} />
                  {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {overdue && " · late"}
                </span>
              )}
            </div>

            <div className="mt-2.5">
              <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${isPaid ? "bg-emerald-500" : "bg-violet-500"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-400">{percent}%</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isPaid && (
              <button
                onClick={() => onOpenPaymentForm(openPaymentFormId === expense.id ? null : (expense.id ?? null))}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-violet-600 hover:bg-violet-50"
              >
                + Pay
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-violet-50 hover:text-violet-500"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => { setConfirming(true); setOffsetX(REVEAL_WIDTH); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
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

  // Bulk toolbar — shared between mobile and desktop
  const bulkToolbar = someSelected && (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
      <span className="text-xs font-semibold text-zinc-600">{selected.size} selected</span>
      {confirmBulk ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
            <AlertTriangle size={11} />
            Delete {selected.size} expense{selected.size !== 1 ? "s" : ""}?
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => setConfirmBulk(false)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmBulk(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Trash2 size={11} />
          Delete selected
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile: card list (hidden on md+) ── */}
      <div className="md:hidden space-y-3">
        {someSelected && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {bulkToolbar}
          </div>
        )}
        {expenses.map((expense) => (
          <MobileCard
            key={expense.id}
            expense={expense}
            selected={selected.has(expense.id!)}
            onToggleSelect={() => toggleOne(expense.id!)}
            onEdit={() => onEdit(expense)}
            onDelete={() => onDelete(expense.id!)}
            onOpenPaymentForm={onOpenPaymentForm}
            openPaymentFormId={openPaymentFormId}
          />
        ))}
      </div>

      {/* ── Desktop: table (hidden below md) ── */}
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
                    className="h-3.5 w-3.5 rounded border-zinc-300 accent-violet-600 cursor-pointer"
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
                  onPaymentSubmit={(amount) => onPaymentSubmit(expense.id!, amount)}
                  onPriorityChange={(priority) => onPriorityChange(expense.id!, priority)}
                  onDelete={() => onDelete(expense.id!)}
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
