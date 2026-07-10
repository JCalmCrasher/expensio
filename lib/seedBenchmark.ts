import { db } from "@/lib/db";
import { currentMonthKey, parseMonthLabels, prevMonthKey } from "@/lib/monthKey";
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

export type SeedMonthInput = string | string[];

export type SeedBenchmarkOptions = {
  /** Spread expenses across this many months (default 12). Ignored when `months` is set. */
  monthSpread?: number;
  /** Anchor month for distribution (default current month). Ignored when `months` is set. */
  baseMonthKey?: string;
  /** Pin rows to specific month(s), e.g. "july 2026" or ["june 2026", "july 2026"]. */
  months?: SeedMonthInput;
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
  monthKeys: string[];
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

function createdAtInMonth(monthKey: string, index: number): number {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = (index % daysInMonth) + 1;
  const hour = index % 24;
  const minute = index % 60;
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function resolveSeedOptions(
  monthsOrOptions?: SeedMonthInput | SeedBenchmarkOptions,
  options?: SeedBenchmarkOptions,
): SeedBenchmarkOptions {
  if (monthsOrOptions == null) return options ?? {};
  if (typeof monthsOrOptions === "string" || Array.isArray(monthsOrOptions)) {
    return { ...options, months: monthsOrOptions };
  }
  return { ...monthsOrOptions, ...options };
}

function resolveTargetMonthKeys(options: SeedBenchmarkOptions): string[] | undefined {
  if (!options.months) return undefined;
  return parseMonthLabels(options.months);
}

/** Build fake expense rows without touching the database. */
export function generateFakeExpenses(
  count: number,
  options: Pick<SeedBenchmarkOptions, "monthSpread" | "baseMonthKey" | "months"> = {},
): NewExpense[] {
  const monthSpread = options.monthSpread ?? 12;
  const baseMonthKey = options.baseMonthKey ?? currentMonthKey();
  const targetMonthKeys = resolveTargetMonthKeys(options);
  const now = Date.now();
  const dayMs = 86_400_000;

  const expenses: NewExpense[] = [];

  for (let i = 0; i < count; i++) {
    const totalAmount = roundMoney(5 + ((i * 17) % 4995) + (i % 7) * 0.13);
    const paidFraction = (i % 10) / 10;
    const amountPaid =
      paidFraction >= 1 ? totalAmount : roundMoney(totalAmount * paidFraction);
    const status: Status = amountPaid >= totalAmount ? "paid" : "unpaid";

    const monthKey = targetMonthKeys
      ? pick(targetMonthKeys, i)
      : monthKeyOffset(baseMonthKey, i % monthSpread);

    expenses.push({
      title: `${pick(TITLES, i)} ${i + 1}`,
      totalAmount,
      amountPaid,
      status,
      priority: pick(PRIORITIES, i),
      category: pick(CATEGORIES, i + 3),
      monthKey,
      rolledOver: i % 23 === 0,
      dueDate: targetMonthKeys
        ? createdAtInMonth(monthKey, i)
        : now + ((i % 30) - 15) * dayMs,
      note: i % 5 === 0 ? `Benchmark seed #${i + 1}` : undefined,
    });
  }

  return expenses;
}

/**
 * Insert fake expenses in chunked transactions and return timing stats.
 *
 * @example
 * await seedBenchmarkExpenses(10_000)
 * await seedBenchmarkExpenses(10_000, "july 2026")
 * await seedBenchmarkExpenses(10_000, ["june 2026", "july 2026"])
 * await seedBenchmarkExpenses(10_000, { clearFirst: true })
 * await seedBenchmarkExpenses(10_000, "july 2026", { clearFirst: true })
 */
export async function seedBenchmarkExpenses(
  count = 10_000,
  monthsOrOptions?: SeedMonthInput | SeedBenchmarkOptions,
  options?: SeedBenchmarkOptions,
): Promise<SeedBenchmarkResult> {
  const resolved = resolveSeedOptions(monthsOrOptions, options);
  const records = generateFakeExpenses(count, resolved);
  const targetMonthKeys = resolveTargetMonthKeys(resolved);
  const start = performance.now();

  await db.transaction("rw", db.expenses, async () => {
    if (resolved.clearFirst) {
      await db.expenses.clear();
    }

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE).map((expense, offset) => {
        const index = i + offset;
        return {
          ...expense,
          createdAt: targetMonthKeys
            ? createdAtInMonth(expense.monthKey, index)
            : Date.now() - index,
        };
      });
      await db.expenses.bulkAdd(chunk);
      resolved.onProgress?.(Math.min(i + chunk.length, records.length), records.length);
    }
  });

  const elapsedMs = Math.round(performance.now() - start);
  const totalInDb = await db.expenses.count();
  const monthKeys = [...new Set(records.map((e) => e.monthKey))].sort();

  return {
    inserted: records.length,
    elapsedMs,
    totalInDb,
    monthsUsed: monthKeys.length,
    monthKeys,
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
