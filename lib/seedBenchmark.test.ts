import { describe, expect, it } from "vitest";
import { generateFakeExpenses } from "@/lib/seedBenchmark";

describe("generateFakeExpenses", () => {
  it("creates the requested number of valid rows", () => {
    const rows = generateFakeExpenses(100, {
      baseMonthKey: "2026-06",
      monthSpread: 6,
    });

    expect(rows).toHaveLength(100);
    expect(rows.every((e) => e.totalAmount > 0)).toBe(true);
    expect(rows.every((e) => e.amountPaid >= 0 && e.amountPaid <= e.totalAmount)).toBe(true);
    expect(new Set(rows.map((e) => e.monthKey)).size).toBeLessThanOrEqual(6);
  });
});
