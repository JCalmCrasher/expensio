"use client";

import { ExpenseCard } from "@/components/ExpenseCard";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
  onPaymentSubmit: (id: number, amount: number) => Promise<void>;
  onPriorityChange: (id: number, priority: Priority) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  openPaymentFormId: number | null;
  onOpenPaymentForm: (id: number | null) => void;
}

export function ExpenseList({
  expenses,
  onPaymentSubmit,
  onPriorityChange,
  onDelete,
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
    <ul role="list" className="flex flex-col gap-3">
      {expenses.map((expense) => (
        <li key={expense.id} className="list-none">
          <ExpenseCard
            expense={expense}
            openPaymentFormId={openPaymentFormId}
            onOpenPaymentForm={onOpenPaymentForm}
            onPaymentSubmit={(amount) => onPaymentSubmit(expense.id!, amount)}
            onPriorityChange={(priority) => onPriorityChange(expense.id!, priority)}
            onDelete={() => onDelete(expense.id!)}
          />
        </li>
      ))}
    </ul>
  );
}
