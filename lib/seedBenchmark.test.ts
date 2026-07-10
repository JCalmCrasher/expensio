import { describe, expect, it } from "vitest";
import { generateFakeExpenses } from "@/lib/seedBenchmark";
import { parseMonthLabel, parseMonthLabels } from "@/lib/monthKey";

describe("parseMonthLabel", () => {
  it("parses human-readable month labels", () => {
    expect(parseMonthLabel("july 2026")).toBe("2026-07");
    expect(parseMonthLabel("June 2026")).toBe("2026-06");
  });

  it("accepts month keys as-is", () => {
    expect(parseMonthLabel("2026-07")).toBe("2026-07");
  });

  it("parses arrays of labels", () => {
    expect(parseMonthLabels(["july 2026", "june 2026"])).toEqual(["2026-07", "2026-06"]);
  });
});

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

  it("pins all rows to a single target month", () => {
    const rows = generateFakeExpenses(50, { months: "july 2026" });
    expect(rows.every((e) => e.monthKey === "2026-07")).toBe(true);
  });

  it("distributes rows across specific target months", () => {
    const rows = generateFakeExpenses(100, { months: ["june 2026", "july 2026"] });
    const keys = new Set(rows.map((e) => e.monthKey));
    expect(keys).toEqual(new Set(["2026-06", "2026-07"]));
  });
});
