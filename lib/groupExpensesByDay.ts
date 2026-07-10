import { startOfDay } from "@/lib/notifications/dueDates";
import type { Expense } from "@/types/expense";

export type ExpenseDayGroup = {
  label: string;
  expenses: Expense[];
};

function dayLabel(ms: number, now = Date.now()): string {
  const dayStart = startOfDay(ms);
  const today = startOfDay(now);
  const yesterday = today - 86_400_000;

  if (dayStart === today) return "Today";
  if (dayStart === yesterday) return "Yesterday";

  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Group expenses by createdAt day, newest groups first. */
export function groupExpensesByDay(expenses: Expense[]): ExpenseDayGroup[] {
  const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
  const groups = new Map<string, ExpenseDayGroup>();

  for (const expense of sorted) {
    const key = String(startOfDay(expense.createdAt));
    const existing = groups.get(key);
    if (existing) {
      existing.expenses.push(expense);
    } else {
      groups.set(key, {
        label: dayLabel(expense.createdAt),
        expenses: [expense],
      });
    }
  }

  return [...groups.values()];
}
