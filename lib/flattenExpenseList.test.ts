import { describe, expect, it } from "vitest";
import { flattenExpenseList } from "@/lib/flattenExpenseList";
import type { ExpenseDayGroup } from "@/lib/groupExpensesByDay";
import type { Expense } from "@/types/expense";

function expense(id: number): Expense {
  return {
    id,
    title: `Item ${id}`,
    totalAmount: 10,
    amountPaid: 0,
    status: "unpaid",
    priority: "Medium",
    category: "food",
    monthKey: "2026-06",
    rolledOver: false,
    createdAt: id,
  };
}

describe("flattenExpenseList", () => {
  it("flattens headers and expenses, marking the open payment row", () => {
    const groups: ExpenseDayGroup[] = [
      {
        dayKey: "1",
        label: "Today",
        expenses: [expense(1), expense(2)],
      },
      {
        dayKey: "2",
        label: "Yesterday",
        expenses: [expense(3)],
      },
    ];

    const rows = flattenExpenseList(groups, 2);

    expect(rows.map((r) => r.kind)).toEqual([
      "header",
      "expense",
      "expense",
      "header",
      "expense",
    ]);
    expect(rows.filter((r) => r.kind === "expense").map((r) => r.paymentOpen)).toEqual([
      false,
      true,
      false,
    ]);
  });
});
