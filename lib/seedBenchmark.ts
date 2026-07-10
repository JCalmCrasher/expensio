import { db } from "@/lib/db";
import { currentMonthKey, prevMonthKey } from "@/lib/monthKey";
import type { NewExpense, Priority, Status } from "@/types/expense";

const CHUNK_SIZE = 500;

const TITLES = [
  "Coffee",
  "Rent",
  "Groceries",
  "Uber",
  "Netflix",
  "Gym",
  "Electricity",
  "Internet",
  "Lunch",
  "Dinner",
  "Fuel",
  "Pharmacy",
  "Haircut",
  "Books",
  "Spotify",
  "Water bill",
  "Phone bill",
  "Insurance",
  "Car repair",
  "Gift",
];

const CATEGORIES = [
  "food",
  "housing",
  "transport",
  "entertainment",
  "health",
  "utilities",
  "shopping",
  "subscriptions",
];

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export type SeedBenchmarkOptions = {
  /** Spread expenses across this many months (default 12). */
  monthSpread?: number;
  /** Anchor month for distribution (default current month). */
  baseMonthKey?: string;
  /** Clear all expenses before seeding. */
  clearFirst?: boolean;
  /** Called after each chunk is written. */
  onProgress?: (done: number, total: number) => void;
};

export type SeedBenchmarkResult = {
  inserted: number;
  elapsedMs: number;
  totalInDb: number;
  monthsUsed: number;
};

function monthKeyOffset(baseKey: string, monthsBack: number): string {
  let key = baseKey;
  for (let i = 0; i < monthsBack; i++) {
    key = prevMonthKey(key);
  }
  return key;
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Build fake expense rows without touching the database. */
export function generateFakeExpenses(
  count: number,
  options: Pick<SeedBenchmarkOptions, "monthSpread" | "baseMonthKey"> = {},
): NewExpense[] {
  const monthSpread = options.monthSpread ?? 12;
  const baseMonthKey = options.baseMonthKey ?? currentMonthKey();
  const now = Date.now();
  const dayMs = 86_400_000;

  const expenses: NewExpense[] = [];

  for (let i = 0; i < count; i++) {
    const totalAmount = roundMoney(5 + ((i * 17) % 4995) + (i % 7) * 0.13);
    const paidFraction = (i % 10) / 10;
    const amountPaid =
      paidFraction >= 1
        ? totalAmount
        : roundMoney(totalAmount * paidFraction);
    const status: Status = amountPaid >= totalAmount ? "paid" : "unpaid";
    const monthsBack = i % monthSpread;
    const monthKey = monthKeyOffset(baseMonthKey, monthsBack);
    const daysAgo = (i % 365) + monthsBack * 28;

    expenses.push({
      title: `${pick(TITLES, i)} ${i + 1}`,
      totalAmount,
      amountPaid,
      status,
      priority: pick(PRIORITIES, i),
      category: pick(CATEGORIES, i + 3),
      monthKey,
      rolledOver: i % 23 === 0,
      dueDate: now + ((i % 30) - 15) * dayMs,
      note: i % 5 === 0 ? `Benchmark seed #${i + 1}` : undefined,
    });
  }

  return expenses;
}

/** Insert fake expenses in chunked transactions and return timing stats. */
export async function seedBenchmarkExpenses(
  count = 10_000,
  options: SeedBenchmarkOptions = {},
): Promise<SeedBenchmarkResult> {
  const records = generateFakeExpenses(count, options);
  const now = Date.now();
  const start = performance.now();

  await db.transaction("rw", db.expenses, async () => {
    if (options.clearFirst) {
      await db.expenses.clear();
    }

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE).map((expense, offset) => ({
        ...expense,
        createdAt: now - (i + offset),
      }));
      await db.expenses.bulkAdd(chunk);
      options.onProgress?.(Math.min(i + chunk.length, records.length), records.length);
    }
  });

  const elapsedMs = Math.round(performance.now() - start);
  const totalInDb = await db.expenses.count();
  const monthsUsed = new Set(records.map((e) => e.monthKey)).size;

  return {
    inserted: records.length,
    elapsedMs,
    totalInDb,
    monthsUsed,
  };
}

export async function clearBenchmarkExpenses(): Promise<number> {
  const before = await db.expenses.count();
  await db.expenses.clear();
  return before;
}

export async function countBenchmarkExpenses(): Promise<number> {
  return db.expenses.count();
}
