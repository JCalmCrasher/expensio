import Dexie from "dexie";
import { db } from "@/lib/db";
import type { Category, Expense } from "@/types/expense";

export const EXPENSE_PAGE_SIZE = 50;

export type MonthTotals = {
  totalOwed: number;
  totalPaid: number;
  count: number;
  highUnpaid: number;
  categorySpend: Map<string, number>;
};

/** Fetch one page of month expenses (newest first) without loading the full month. */
export async function fetchMonthExpensePage(
  monthKey: string,
  offset: number,
  limit = EXPENSE_PAGE_SIZE,
): Promise<Expense[]> {
  return db.expenses
    .where("[monthKey+createdAt]")
    .between([monthKey, Dexie.minKey], [monthKey, Dexie.maxKey])
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
}

export async function countMonthExpenses(monthKey: string): Promise<number> {
  return db.expenses.where("monthKey").equals(monthKey).count();
}

export async function monthHasUnpaid(monthKey: string): Promise<boolean> {
  const row = await db.expenses
    .where("monthKey")
    .equals(monthKey)
    .filter((e) => e.status === "unpaid")
    .first();
  return row != null;
}

/** Aggregate month totals by iterating — no full array in memory. */
export async function computeMonthTotals(monthKey: string): Promise<MonthTotals> {
  let totalOwed = 0;
  let totalPaid = 0;
  let count = 0;
  let highUnpaid = 0;
  const categorySpend = new Map<string, number>();

  await db.expenses.where("monthKey").equals(monthKey).each((e) => {
    totalOwed += e.totalAmount;
    totalPaid += e.amountPaid;
    count += 1;
    if (e.priority === "High" && e.amountPaid < e.totalAmount) highUnpaid += 1;

    const cat = e.category.trim();
    if (cat) {
      const key = cat.toLowerCase();
      categorySpend.set(key, (categorySpend.get(key) ?? 0) + e.totalAmount);
    }
  });

  return { totalOwed, totalPaid, count, highUnpaid, categorySpend };
}

export function buildMonthInsight(
  totals: MonthTotals,
  categories: Category[],
  symbol: string,
  dueThisWeekCount: number,
): string | null {
  const remaining = Math.max(0, totals.totalOwed - totals.totalPaid);

  if (totals.count === 0) return null;

  const parts: string[] = [];
  if (remaining > 0) {
    parts.push(
      `${symbol}${remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} left this month`,
    );
  } else if (totals.totalOwed > 0) {
    parts.push("All caught up this month");
  }

  const budgetByName = new Map(
    categories.filter((c) => c.maxAmount > 0).map((c) => [c.name.toLowerCase(), c]),
  );
  if (budgetByName.size > 0) {
    let worst: { name: string; over: number } | null = null;
    for (const [key, spent] of totals.categorySpend) {
      const budget = budgetByName.get(key);
      if (!budget) continue;
      const over = spent - budget.maxAmount;
      if (over > 0 && (!worst || over > worst.over)) {
        worst = { name: budget.name, over };
      }
    }
    if (worst) {
      parts.push(
        `${worst.name} is ${symbol}${worst.over.toLocaleString("en-US", { maximumFractionDigits: 0 })} over budget`,
      );
    }
  }

  if (dueThisWeekCount > 0) {
    parts.push(`${dueThisWeekCount} bill${dueThisWeekCount === 1 ? "" : "s"} due this week`);
  }
  if (totals.highUnpaid > 0) {
    parts.push(
      `${totals.highUnpaid} high-priority item${totals.highUnpaid === 1 ? "" : "s"} unpaid`,
    );
  }

  if (parts.length === 0) return null;
  const text = `${parts.join(". ")}.`;
  return text.length <= 120 ? text : `${text.slice(0, 119)}…`;
}

/** Search within a month (caps results; may scan the month index). */
export async function searchMonthExpenses(
  monthKey: string,
  query: string,
  limit = 200,
): Promise<Expense[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const rows = await db.expenses
    .where("monthKey")
    .equals(monthKey)
    .filter((e) => e.title.toLowerCase().includes(q))
    .toArray();

  return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
