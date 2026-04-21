"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Minus, ArrowDown, CheckCircle2, Trash2, ChevronDown } from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColor";
import { PartialPaymentForm } from "@/components/PartialPaymentForm";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseCardProps {
  expense: Expense;
  onPaymentSubmit: (amount: number) => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  onDelete: () => Promise<void>;
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
  const containerRef = useRef<HTMLDivElement>(null);

  const { label, badgeClass, Icon } = PRIORITY_CONFIG[current];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function select(p: Priority) {
    setOpen(false);
    if (p === current) return;
    setAnimating(true);
    onChange(p);
    setTimeout(() => setAnimating(false), 350);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Priority: ${label}. Click to change.`}
        className={[
          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          animating ? "scale-110" : "scale-100",
          badgeClass,
        ].join(" ")}
      >
        <Icon size={10} strokeWidth={3} />
        {label}
        <ChevronDown size={9} strokeWidth={3} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select priority"
          className="absolute right-0 top-full z-50 mt-1.5 w-36 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-200/60"
        >
          {PRIORITIES.map((p) => {
            const { label: pLabel, rowClass, Icon: PIcon } = PRIORITY_CONFIG[p];
            const isActive = p === current;
            return (
              <button
                key={p}
                role="option"
                aria-selected={isActive}
                onClick={() => select(p)}
                className={[
                  "flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors duration-100",
                  rowClass,
                  isActive ? "opacity-100" : "opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                <PIcon size={11} strokeWidth={3} />
                {pLabel}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ExpenseCard({
  expense,
  onPaymentSubmit,
  onPriorityChange,
  onDelete,
  openPaymentFormId,
  onOpenPaymentForm,
}: ExpenseCardProps) {
  const isPaid = expense.status === "paid";
  const isPaymentOpen = openPaymentFormId === expense.id;
  const percent =
    expense.totalAmount > 0
      ? Math.min(100, Math.round((expense.amountPaid / expense.totalAmount) * 100))
      : 0;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.key === "P" || e.key === "p" || e.key === "Enter") && !isPaymentOpen && !isPaid) {
      e.preventDefault();
      onOpenPaymentForm(expense.id ?? null);
    } else if (e.key === "Escape" && isPaymentOpen) {
      e.preventDefault();
      onOpenPaymentForm(null);
    }
  }

  return (
    <div
      role="listitem"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={[
        "group rounded-2xl border bg-white p-4 shadow-sm transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        isPaid
          ? "border-zinc-100 opacity-60"
          : "border-zinc-200 hover:border-zinc-300 hover:shadow-md",
      ].join(" ")}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isPaid && <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />}
            <span
              className={[
                "text-[15px] font-semibold leading-snug",
                isPaid ? "line-through text-zinc-400" : "text-zinc-900",
              ].join(" ")}
            >
              {expense.title}
            </span>
            {expense.rolledOver && (
              <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                rolled over
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-zinc-800">
              ${expense.totalAmount.toFixed(2)}
            </span>
            {expense.amountPaid > 0 && !isPaid && (
              <span className="text-xs text-zinc-400">
                ${expense.amountPaid.toFixed(2)} paid
              </span>
            )}
            {expense.category && (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryColor(expense.category)}`}>
                {expense.category}
              </span>
            )}
          </div>

          {/* Date added */}
          <p className="mt-1 text-[11px] text-zinc-400">
            Added{" "}
            {new Date(expense.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Priority picker + delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PriorityPicker current={expense.priority} onChange={onPriorityChange} />
          <button
            onClick={onDelete}
            aria-label="Delete expense"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-300 opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3.5">
        <div
          className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent}% paid`}
        >
          <div
            className={[
              "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
              isPaid ? "bg-emerald-500" : "bg-violet-500",
            ].join(" ")}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400">{percent}%</span>
          {!isPaid && (
            <button
              onClick={() => onOpenPaymentForm(isPaymentOpen ? null : (expense.id ?? null))}
              aria-label="Record payment"
              className="rounded-lg px-2 py-0.5 text-[11px] font-semibold text-violet-600 transition-colors duration-150 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              + Pay
            </button>
          )}
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
  );
}
