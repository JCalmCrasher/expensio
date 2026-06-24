import type { ExpenseTemplate, NewExpense } from "@/types/expense";

export function dueDateFromDayOfMonth(day: number, monthKey: string): number {
  const clamped = Math.min(28, Math.max(1, day));
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, clamped).getTime();
}

export function templatesToExpenses(
  templates: ExpenseTemplate[],
  monthKey: string,
): NewExpense[] {
  return templates.map((t) => ({
    title: t.title,
    totalAmount: t.totalAmount,
    amountPaid: 0,
    status: "unpaid" as const,
    priority: t.priority,
    category: t.category,
    monthKey,
    rolledOver: false,
    dueDate: t.dueDayOfMonth ? dueDateFromDayOfMonth(t.dueDayOfMonth, monthKey) : undefined,
    note: "",
  }));
}
