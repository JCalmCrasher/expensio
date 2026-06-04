import type { Expense } from "@/types/expense";

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dueNotificationKey(expenseId: number, dueDate: number): string {
  return `${expenseId}-${startOfDay(dueDate)}`;
}

export type DueReminder = {
  expense: Expense;
  overdue: boolean;
  remaining: number;
};

/** Unpaid expenses due today or already past due. */
export function findDueReminders(expenses: Expense[]): DueReminder[] {
  const todayStart = startOfDay(Date.now());
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

  return expenses
    .filter(
      (e) =>
        e.dueDate != null &&
        e.id != null &&
        e.amountPaid < e.totalAmount &&
        e.dueDate <= todayEnd,
    )
    .map((expense) => ({
      expense,
      overdue: expense.dueDate! < todayStart,
      remaining: expense.totalAmount - expense.amountPaid,
    }));
}
