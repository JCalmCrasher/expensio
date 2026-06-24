import { startOfDay } from "@/lib/notifications/dueDates";
import type { Expense, NewExpense } from "@/types/expense";

export function filterRecentExpenses(expenses: Expense[], days = 90): Expense[] {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return expenses.filter((e) => e.createdAt >= since);
}

/** Unique titles from recent expenses, most recent first. */
export function getRecentTitles(expenses: Expense[], limit = 6): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];
  const sorted = [...filterRecentExpenses(expenses)].sort((a, b) => b.createdAt - a.createdAt);

  for (const e of sorted) {
    const key = e.title.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    titles.push(e.title);
    if (titles.length >= limit) break;
  }
  return titles;
}

export function matchTitleSuggestions(query: string, expenses: Expense[], limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getRecentTitles(expenses, 50)
    .filter((t) => t.toLowerCase().includes(q))
    .slice(0, limit);
}

export function getLastCategoryForTitle(expenses: Expense[], title: string): string | null {
  const key = title.trim().toLowerCase();
  if (!key) return null;

  const match = [...filterRecentExpenses(expenses)]
    .sort((a, b) => b.createdAt - a.createdAt)
    .find((e) => e.title.toLowerCase() === key && e.category.trim());

  return match?.category ?? null;
}

export function getRecentCategories(expenses: Expense[], limit = 5): string[] {
  const seen = new Set<string>();
  const cats: string[] = [];
  const sorted = [...filterRecentExpenses(expenses)].sort((a, b) => b.createdAt - a.createdAt);

  for (const e of sorted) {
    const c = e.category.trim();
    if (!c) continue;
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cats.push(c);
    if (cats.length >= limit) break;
  }
  return cats;
}

export function hasDuplicateToday(
  expenses: Expense[],
  title: string,
  totalAmount: number,
): boolean {
  const dayStart = startOfDay(Date.now());
  const dayEnd = dayStart + 86_400_000 - 1;
  const key = title.trim().toLowerCase();

  return expenses.some(
    (e) =>
      e.title.toLowerCase() === key &&
      e.totalAmount === totalAmount &&
      e.createdAt >= dayStart &&
      e.createdAt <= dayEnd,
  );
}

export function buildRepeatExpense(source: Expense, activeMonthKey: string): NewExpense {
  const { id: _id, createdAt: _c, amountPaid: _p, status: _s, ...rest } = source;
  return {
    ...rest,
    monthKey: activeMonthKey,
    amountPaid: 0,
    status: "unpaid",
    rolledOver: false,
  };
}

export function getLastExpense(expenses: Expense[], activeMonthKey?: string): Expense | null {
  const pool = activeMonthKey
    ? expenses.filter((e) => e.monthKey === activeMonthKey)
    : expenses;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => b.createdAt - a.createdAt)[0];
}
