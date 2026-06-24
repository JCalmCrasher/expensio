import { describe, expect, it } from "vitest";
import { buildSummaryInsight } from "@/lib/summaryInsight";
import type { Category, Expense } from "@/types/expense";

function expense(partial: Partial<Expense> & Pick<Expense, "title" | "totalAmount">): Expense {
  return {
    id: 1,
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

describe("buildSummaryInsight", () => {
  it("returns null for empty month", () => {
    expect(buildSummaryInsight([], [], [], "₦")).toBeNull();
  });

  it("mentions remaining amount", () => {
    const text = buildSummaryInsight(
      [expense({ title: "Rent", totalAmount: 1000, amountPaid: 400 })],
      [],
      [],
      "₦",
    );
    expect(text).toContain("left this month");
  });

  it("mentions over-budget category", () => {
    const categories: Category[] = [{ name: "Food", maxAmount: 100 }];
    const month = [
      expense({ title: "Groceries", totalAmount: 150, category: "Food" }),
    ];
    const text = buildSummaryInsight(month, month, categories, "₦");
    expect(text).toContain("over budget");
  });
});
