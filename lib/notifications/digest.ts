import type { Expense } from "@/types/expense";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatMoney(symbol: string, amount: number): string {
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function buildWeeklyDigest(
  expenses: Expense[],
  symbol: string,
): { title: string; body: string } {
  const since = Date.now() - WEEK_MS;
  const recent = expenses.filter((e) => e.createdAt >= since);

  const totalTracked = recent.reduce((s, e) => s + e.totalAmount, 0);
  const totalPaid = recent.reduce((s, e) => s + e.amountPaid, 0);
  const remaining = Math.max(0, totalTracked - totalPaid);
  const unpaidCount = recent.filter((e) => e.amountPaid < e.totalAmount).length;

  const body = [
    `${formatMoney(symbol, totalPaid)} paid`,
    `${formatMoney(symbol, remaining)} remaining`,
    `${recent.length} expense${recent.length === 1 ? "" : "s"}`,
    unpaidCount > 0 ? `${unpaidCount} still open` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: "Your weekly summary",
    body: body || "No expenses logged this week — add one to start tracking.",
  };
}
