import type { ExpenseDayGroup } from "@/lib/groupExpensesByDay";
import type { Expense } from "@/types/expense";

export type VirtualListRow =
  | { kind: "header"; id: string; label: string }
  | { kind: "expense"; id: string; expense: Expense }
  | { kind: "payment"; id: string; expense: Expense };

export function flattenExpenseList(
  groups: ExpenseDayGroup[],
  openPaymentFormId: number | null,
): VirtualListRow[] {
  const rows: VirtualListRow[] = [];

  for (const group of groups) {
    rows.push({ kind: "header", id: `h-${group.dayKey}`, label: group.label });

    for (const expense of group.expenses) {
      rows.push({ kind: "expense", id: `e-${expense.id}`, expense });

      if (expense.id === openPaymentFormId) {
        rows.push({ kind: "payment", id: `p-${expense.id}`, expense });
      }
    }
  }

  return rows;
}

export function estimateVirtualRowSize(row: VirtualListRow): number {
  switch (row.kind) {
    case "header":
      return 36;
    case "expense":
      return 118;
    case "payment":
      return 168;
  }
}
