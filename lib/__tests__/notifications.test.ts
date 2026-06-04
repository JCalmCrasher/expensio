import { describe, expect, it } from "vitest";
import { buildWeeklyDigest } from "@/lib/notifications/digest";
import { findDueReminders, startOfDay } from "@/lib/notifications/dueDates";
import type { Expense } from "@/types/expense";

function expense(partial: Partial<Expense> & Pick<Expense, "title" | "totalAmount">): Expense {
  return {
    id: 1,
    title: partial.title,
    totalAmount: partial.totalAmount,
    amountPaid: partial.amountPaid ?? 0,
    status: partial.status ?? "unpaid",
    priority: partial.priority ?? "Medium",
    category: "",
    monthKey: "2026-05",
    rolledOver: false,
    createdAt: Date.now(),
    ...partial,
  };
}

describe("buildWeeklyDigest", () => {
  it("summarizes last 7 days", () => {
    const { body } = buildWeeklyDigest(
      [
        expense({
          title: "A",
          totalAmount: 100,
          amountPaid: 40,
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        }),
      ],
      "₦",
    );
    expect(body).toContain("paid");
    expect(body).toContain("remaining");
  });
});

describe("findDueReminders", () => {
  it("finds expenses due today", () => {
    const today = startOfDay(Date.now());
    const list = findDueReminders([
      expense({
        title: "Rent",
        totalAmount: 50,
        dueDate: today + 12 * 60 * 60 * 1000,
      }),
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].overdue).toBe(false);
  });

  it("skips fully paid", () => {
    const today = startOfDay(Date.now());
    const list = findDueReminders([
      expense({
        title: "Done",
        totalAmount: 50,
        amountPaid: 50,
        status: "paid",
        dueDate: today,
      }),
    ]);
    expect(list).toHaveLength(0);
  });
});
