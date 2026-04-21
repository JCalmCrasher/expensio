import { describe, it, expect } from "vitest";
import {
  toMonthKey,
  currentMonthKey,
  nextMonthKey,
  prevMonthKey,
  formatMonthKey,
} from "../monthKey";

describe("nextMonthKey", () => {
  it("wraps December to January of the next year", () => {
    expect(nextMonthKey("2025-12")).toBe("2026-01");
  });

  it("advances a mid-year month by one", () => {
    expect(nextMonthKey("2025-06")).toBe("2025-07");
  });
});

describe("prevMonthKey", () => {
  it("wraps January to December of the previous year", () => {
    expect(prevMonthKey("2025-01")).toBe("2024-12");
  });

  it("goes back one month in the middle of the year", () => {
    expect(prevMonthKey("2025-06")).toBe("2025-05");
  });
});

describe("toMonthKey", () => {
  it("round-trips a known date to the correct key", () => {
    // June 15 2025 — month index 5 in JS Date
    expect(toMonthKey(new Date(2025, 5, 15))).toBe("2025-06");
  });

  it("pads single-digit months with a leading zero", () => {
    expect(toMonthKey(new Date(2025, 0, 1))).toBe("2025-01");
  });
});

describe("formatMonthKey", () => {
  it("returns a string containing the full month name and year", () => {
    const result = formatMonthKey("2025-06");
    expect(result).toContain("June");
    expect(result).toContain("2025");
  });
});

describe("currentMonthKey", () => {
  it("returns a string matching YYYY-MM format", () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });
});
