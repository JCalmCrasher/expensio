import type { Category, Expense } from "@/types/expense";

const MAX_LEN = 120;

function formatMoney(symbol: string, amount: number): string {
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function truncate(text: string): string {
  if (text.length <= MAX_LEN) return text;
  return `${text.slice(0, MAX_LEN - 1)}…`;
}

export function buildSummaryInsight(
  monthExpenses: Expense[],
  categories: Category[],
  symbol: string,
  dueThisWeekCount = 0,
): string | null {
  if (monthExpenses.length === 0) return null;

  const totalOwed = monthExpenses.reduce((s, e) => s + e.totalAmount, 0);
  const totalPaid = monthExpenses.reduce((s, e) => s + e.amountPaid, 0);
  const remaining = Math.max(0, totalOwed - totalPaid);

  const parts: string[] = [];

  if (remaining > 0) {
    parts.push(`${formatMoney(symbol, remaining)} left this month`);
  } else if (totalOwed > 0) {
    parts.push("All caught up this month");
  }

  const budgetByName = new Map(
    categories.filter((c) => c.maxAmount > 0).map((c) => [c.name.toLowerCase(), c]),
  );

  if (budgetByName.size > 0) {
    const spendByCat = new Map<string, number>();
    for (const e of monthExpenses) {
      const cat = e.category.trim();
      if (!cat) continue;
      const key = cat.toLowerCase();
      spendByCat.set(key, (spendByCat.get(key) ?? 0) + e.totalAmount);
    }

    let worst: { name: string; over: number } | null = null;
    for (const [key, spent] of spendByCat) {
      const budget = budgetByName.get(key);
      if (!budget) continue;
      const over = spent - budget.maxAmount;
      if (over > 0 && (!worst || over > worst.over)) {
        worst = { name: budget.name, over };
      }
    }
    if (worst) {
      parts.push(`${worst.name} is ${formatMoney(symbol, worst.over)} over budget`);
    }
  }

  const dueThisWeek = dueThisWeekCount;

  const highUnpaid = monthExpenses.filter(
    (e) => e.priority === "High" && e.amountPaid < e.totalAmount,
  ).length;

  if (dueThisWeek > 0) {
    parts.push(`${dueThisWeek} bill${dueThisWeek === 1 ? "" : "s"} due this week`);
  }
  if (highUnpaid > 0) {
    parts.push(`${highUnpaid} high-priority item${highUnpaid === 1 ? "" : "s"} unpaid`);
  }

  if (parts.length === 0) return null;
  return truncate(parts.join(". ") + ".");
}
