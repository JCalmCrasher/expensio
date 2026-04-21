// lib/expenseLogic.ts
import type { Expense, NewExpense, MonthlySummary } from "@/types/expense";

/**
 * Applies a payment to an expense.
 * - Caps amountPaid at totalAmount
 * - Sets status to "paid" when amountPaid >= totalAmount
 * - Throws if payment <= 0
 */
export function applyPayment(expense: Expense, payment: number): Partial<Expense> {
  if (payment <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  const newAmountPaid = Math.min(expense.amountPaid + payment, expense.totalAmount);
  const newStatus = newAmountPaid >= expense.totalAmount ? "paid" : "unpaid";
  return { amountPaid: newAmountPaid, status: newStatus };
}

/**
 * Builds rollover copies of all unpaid expenses for a target month.
 * - Filters to unpaid only
 * - Sets rolledOver: true and new monthKey
 * - Strips id and createdAt
 */
export function buildRolloverCopies(expenses: Expense[], targetMonthKey: string): NewExpense[] {
  return expenses
    .filter((e) => e.status === "unpaid")
    .map(({ id: _id, createdAt: _c, ...rest }) => ({
      ...rest,
      monthKey: targetMonthKey,
      rolledOver: true,
    }));
}

/**
 * Computes the monthly summary for a set of expenses.
 * - Returns progress = 0 when totalOwed === 0
 */
export function computeMonthlySummary(expenses: Expense[]): MonthlySummary {
  const totalOwed = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalPaid = expenses.reduce((sum, e) => sum + e.amountPaid, 0);
  const progress = totalOwed === 0 ? 0 : totalPaid / totalOwed;
  return { totalOwed, totalPaid, progress };
}
