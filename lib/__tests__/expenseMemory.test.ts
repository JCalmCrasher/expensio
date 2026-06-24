import { describe, expect, it } from "vitest";
import {
  buildRepeatExpense,
  getLastCategoryForTitle,
  getRecentCategories,
  getRecentTitles,
  hasDuplicateToday,
  matchTitleSuggestions,
} from "@/lib/expenseMemory";
import type { Expense } from "@/types/expense";

function expense(partial: Partial<Expense> & Pick<Expense, "title" | "totalAmount">): Expense {
  return {
    id: partial.id ?? 1,
    amountPaid: 0,
    status: "unpaid",
    priority: "Medium",
    category: "",
    monthKey: "2026-06",
    rolledOver: false,
    createdAt: Date.now(),
    ...partial,
  };
}

describe("expenseMemory", () => {
  const now = Date.now();
  const list = [
    expense({ id: 1, title: "Coffee", totalAmount: 4.5, category: "Food", createdAt: now - 3_000 }),
    expense({ id: 2, title: "Coffee", totalAmount: 5, category: "Cafe", createdAt: now - 2_000 }),
    expense({ id: 3, title: "Rent", totalAmount: 1200, category: "Bills", createdAt: now - 1_000 }),
  ];

  it("dedupes recent titles", () => {
    expect(getRecentTitles(list)).toEqual(["Rent", "Coffee"]);
  });

  it("filters title suggestions", () => {
    expect(matchTitleSuggestions("co", list)).toEqual(["Coffee"]);
  });

  it("returns last category for title", () => {
    expect(getLastCategoryForTitle(list, "Coffee")).toBe("Cafe");
  });

  it("returns recent categories", () => {
    expect(getRecentCategories(list)).toEqual(["Bills", "Cafe", "Food"]);
  });

  it("detects duplicate today", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayExpense = expense({
      title: "Coffee",
      totalAmount: 4.5,
      createdAt: today.getTime(),
    });
    expect(hasDuplicateToday([todayExpense], "Coffee", 4.5)).toBe(true);
    expect(hasDuplicateToday([todayExpense], "Coffee", 5)).toBe(false);
  });

  it("builds repeat expense as unpaid", () => {
    const src = expense({ title: "Rent", totalAmount: 1200, status: "paid", amountPaid: 1200 });
    const copy = buildRepeatExpense(src, "2026-07");
    expect(copy.status).toBe("unpaid");
    expect(copy.amountPaid).toBe(0);
    expect(copy.monthKey).toBe("2026-07");
  });
});
