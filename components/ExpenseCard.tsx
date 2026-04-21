"use client";

import { KeyboardEvent } from "react";
import { ArrowUp, Minus, ArrowDown, CheckCircle2 } from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColor";
import { PartialPaymentForm } from "@/components/PartialPaymentForm";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseCardProps {
  expense: Expense;
  onPaymentSubmit: (amount: number) => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  openPaymentFormId: number | null;
  onOpenPaymentForm: (id: number | null) => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; className: string; Icon: typeof ArrowUp }
> = {
  High:   { label: "High",   className: "text-red-600 bg-red-50 border-red-100",     Icon: ArrowUp },
  Medium: { label: "Medium", className: "text-amber-600 bg-amber-50 border-amber-100", Icon: Minus },
  Low:    { label: "Low",    className: "text-zinc-500 bg-zinc-100 border-zinc-200",  Icon: ArrowDown },
};

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export function ExpenseCard({
  expense,
  onPaymentSubmit,
  onPriorityChange,
  openPaymentFormId,
  onOpenPaymentForm,
}: ExpenseCardProps) {
  const isPaid = expense.status === "paid";
  const isPaymentOpen = openPaymentFormId === expense.id;
  const percent =
    expense.totalAmount > 0
      ? Math.min(100, Math.round((expense.amountPaid / expense.totalAmount) * 100))
      : 0;

  const { label: priorityLabel, className: priorityClass, Icon: PriorityIcon } =
    PRIORITY_CONFIG[expense.priority];

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.key === "P" || e.key === "p" || e.key === "Enter") && !isPaymentOpen && !isPaid) {
      e.preventDefault();
      onOpenPaymentForm(expense.id ?? null);
    } else if (e.key === "Escape" && isPaymentOpen) {
      e.preventDefault();
      onOpenPaymentForm(null);
    }
  }

  function cyclePriority() {
    const idx = PRIORITIES.indexOf(expense.priority);
    onPriorityChange(PRIORITIES[(idx + 1) % PRIORITIES.length]);
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
      {/* Top row: title + priority */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isPaid && (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            )}
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

          {/* Amount + category */}
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
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryColor(expense.category)}`}
              >
                {expense.category}
              </span>
            )}
          </div>
        </div>

        {/* Priority badge — click to cycle */}
        <button
          onClick={cyclePriority}
          aria-label={`Priority: ${priorityLabel}. Click to change.`}
          className={[
            "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
            priorityClass,
          ].join(" ")}
        >
          <PriorityIcon size={10} strokeWidth={3} />
          {priorityLabel}
        </button>
      </div>

      {/* Progress bar + pay button */}
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
              onClick={() =>
                onOpenPaymentForm(isPaymentOpen ? null : (expense.id ?? null))
              }
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
