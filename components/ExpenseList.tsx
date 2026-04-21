"use client";

import { ExpenseRow } from "@/components/ExpenseCard";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
  onPaymentSubmit: (id: number, amount: number) => Promise<void>;
  onPriorityChange: (id: number, priority: Priority) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
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

export function ExpenseList({
  expenses,
  onPaymentSubmit,
  onPriorityChange,
  onDelete,
  onEdit,
  openPaymentFormId,
  onOpenPaymentForm,
}: ExpenseListProps) {
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/80">
            <TH className="pl-4">Expense</TH>
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
  );
}
