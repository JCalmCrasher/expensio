"use client";

import { KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp,
  Minus,
  ArrowDown,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Pencil,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColor";
import { useCurrency } from "@/lib/useCurrency";
import { PartialPaymentForm } from "@/components/PartialPaymentForm";
import type { Expense, Priority } from "@/types/expense";

export interface ExpenseRowProps {
  expense: Expense;
  selected: boolean;
  onToggleSelect: () => void;
  onPaymentSubmit: (amount: number) => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  openPaymentFormId: number | null;
  onOpenPaymentForm: (id: number | null) => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badgeClass: string; rowClass: string; Icon: typeof ArrowUp }
> = {
  High: {
    label: "High",
    badgeClass: "text-red-600 bg-red-50 border-red-100",
    rowClass: "text-red-600 hover:bg-red-50",
    Icon: ArrowUp,
  },
  Medium: {
    label: "Medium",
    badgeClass: "text-amber-600 bg-amber-50 border-amber-100",
    rowClass: "text-amber-600 hover:bg-amber-50",
    Icon: Minus,
  },
  Low: {
    label: "Low",
    badgeClass: "text-zinc-500 bg-zinc-100 border-zinc-200",
    rowClass: "text-zinc-500 hover:bg-zinc-100",
    Icon: ArrowDown,
  },
};
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

function PriorityPicker({
  current,
  onChange,
}: {
  current: Priority;
  onChange: (p: Priority) => void;
}) {
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const { label, badgeClass, Icon } = PRIORITY_CONFIG[current];

  // Position the portal dropdown under the button
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(t) &&
        dropRef.current &&
        !dropRef.current.contains(t)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function select(p: Priority) {
    setOpen(false);
    if (p === current) return;
    setAnimating(true);
    onChange(p);
    setTimeout(() => setAnimating(false), 300);
  }

  const dropdown = open
    ? createPortal(
        <div
          ref={dropRef}
          role="listbox"
          style={{ position: "absolute", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-32 rounded-xl border border-zinc-200 bg-white py-1 shadow-xl shadow-zinc-200/60"
        >
          {PRIORITIES.map((p) => {
            const { label: pl, rowClass, Icon: PI } = PRIORITY_CONFIG[p];
            return (
              <button
                key={p}
                role="option"
                aria-selected={p === current}
                onClick={() => select(p)}
                className={[
                  "flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors",
                  rowClass,
                  p === current ? "opacity-100" : "opacity-60 hover:opacity-100",
                ].join(" ")}
              >
                <PI size={10} strokeWidth={3} />
                {pl}
                {p === current && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Priority: ${label}`}
        className={[
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
          "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          animating ? "scale-110" : "scale-100",
          badgeClass,
        ].join(" ")}
      >
        <Icon size={9} strokeWidth={3} />
        {label}
        <ChevronDown
          size={8}
          strokeWidth={3}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {dropdown}
    </>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
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
      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-150">
        <span className="text-[10px] font-semibold text-red-500 whitespace-nowrap inline-flex items-center gap-1">
          <AlertTriangle size={10} /> Delete?
        </span>
        <button
          onClick={confirm}
          disabled={deleting}
          className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete"
      className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 group-hover:opacity-100"
    >
      <Trash2 size={11} />
    </button>
  );
}

export function ExpenseRow({
  expense,
  selected,
  onToggleSelect,
  onPaymentSubmit,
  onPriorityChange,
  onDelete,
  onEdit,
  openPaymentFormId,
  onOpenPaymentForm,
}: ExpenseRowProps) {
  const isPaid = expense.status === "paid";
  const isPaymentOpen = openPaymentFormId === expense.id;
  const { fmt } = useCurrency();
  const percent =
    expense.totalAmount > 0
      ? Math.min(100, Math.round((expense.amountPaid / expense.totalAmount) * 100))
      : 0;

  const due = expense.dueDate ? new Date(expense.dueDate) : null;
  const overdue = due && !isPaid && due < new Date();

  function handleKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if ((e.key === "p" || e.key === "P" || e.key === "Enter") && !isPaymentOpen && !isPaid) {
      e.preventDefault();
      onOpenPaymentForm(expense.id ?? null);
    } else if (e.key === "Escape" && isPaymentOpen) {
      e.preventDefault();
      onOpenPaymentForm(null);
    }
  }

  return (
    <>
      <tr
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={[
          "group border-b border-zinc-100 transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500",
          isPaid ? "opacity-50" : "hover:bg-zinc-50/60",
        ].join(" ")}
      >
        {/* Checkbox */}
        <td className="w-10 pl-4 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${expense.title}`}
            className="h-3.5 w-3.5 rounded border-zinc-300 accent-violet-600 cursor-pointer"
          />
        </td>

        {/* Title + badges */}
        <td className="py-3 pl-4 pr-3">
          <div className="flex items-center gap-2 min-w-0">
            {isPaid ? (
              <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0" />
            )}
            <span
              className={[
                "truncate text-sm font-semibold",
                isPaid ? "line-through text-zinc-400" : "text-zinc-900",
              ].join(" ")}
            >
              {expense.title}
            </span>
            {expense.rolledOver && (
              <span className="shrink-0 rounded-full bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-500">
                rolled
              </span>
            )}
            {expense.category && (
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getCategoryColor(expense.category)}`}
              >
                {expense.category}
              </span>
            )}
          </div>
        </td>

        {/* Amount */}
        <td className="py-3 px-3 text-right">
          <span className="text-sm font-bold text-zinc-800 tabular-nums">
            {fmt(expense.totalAmount)}
          </span>
          {expense.amountPaid > 0 && !isPaid && (
            <p className="text-[10px] text-zinc-400 tabular-nums">{fmt(expense.amountPaid)} paid</p>
          )}
        </td>

        {/* Progress */}
        <td className="py-3 px-3 w-28">
          <div
            className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${isPaid ? "bg-emerald-500" : "bg-violet-500"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400 tabular-nums">{percent}%</p>
        </td>

        {/* Due date */}
        <td className="py-3 px-3">
          {due ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-red-500" : "text-zinc-400"}`}
            >
              <CalendarClock size={10} />
              {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              {overdue && <span className="text-[9px]">· late</span>}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-300">—</span>
          )}
        </td>

        {/* Priority */}
        <td className="py-3 px-3">
          <PriorityPicker current={expense.priority} onChange={onPriorityChange} />
        </td>

        {/* Actions */}
        <td className="py-3 pl-3 pr-4">
          <div className="flex items-center justify-end gap-1">
            {!isPaid && (
              <button
                onClick={() => onOpenPaymentForm(isPaymentOpen ? null : (expense.id ?? null))}
                aria-label="Record payment"
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-violet-600 transition-colors hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                + Pay
              </button>
            )}
            <button
              onClick={onEdit}
              aria-label="Edit"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-300 opacity-0 transition-all hover:bg-violet-50 hover:text-violet-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 group-hover:opacity-100"
            >
              <Pencil size={11} />
            </button>
            <DeleteButton onDelete={onDelete} />
          </div>
        </td>
      </tr>

      {/* Inline payment form */}
      {isPaymentOpen && (
        <tr className="border-b border-zinc-100 bg-zinc-50/80">
          <td colSpan={7} className="px-4 py-3">
            <PartialPaymentForm
              expense={expense}
              onSubmit={async (amount) => {
                await onPaymentSubmit(amount);
                onOpenPaymentForm(null);
              }}
              onCancel={() => onOpenPaymentForm(null)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export { ExpenseRow as ExpenseCard };
