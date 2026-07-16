import type { ExpenseDayGroup } from "@/lib/groupExpensesByDay";
import type { Expense } from "@/types/expense";

export type VirtualListRow =
  | { kind: "header"; id: string; label: string }
  | { kind: "expense"; id: string; expense: Expense; paymentOpen?: boolean };

export function flattenExpenseList(
  groups: ExpenseDayGroup[],
  openPaymentFormId: number | null = null,
): VirtualListRow[] {
  const rows: VirtualListRow[] = [];

  for (const group of groups) {
    rows.push({ kind: "header", id: `h-${group.dayKey}`, label: group.label });

    for (const expense of group.expenses) {
      rows.push({
        kind: "expense",
        id: `e-${expense.id}`,
        expense,
        paymentOpen: expense.id === openPaymentFormId,
      });
    }
  }

  return rows;
}

export function estimateVirtualRowSize(row: VirtualListRow): number {
  switch (row.kind) {
    case "header":
      return 36;
    case "expense":
      return row.paymentOpen ? 220 : 124;
  }
}
