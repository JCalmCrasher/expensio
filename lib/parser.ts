import type { NewExpense, Status } from "@/types/expense";

export type ParseSuccess = {
  ok: true;
  expense: NewExpense;
};

export type ParseFailure = {
  ok: false;
  error: string;
};

export type ParseResult = ParseSuccess | ParseFailure;

export function parseQuickAdd(input: string): ParseResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  let amount: number | null = null;
  let status: Status = "unpaid";
  const titleTokens: string[] = [];

  for (const token of tokens) {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      amount = parseFloat(token);
    } else if (/^paid$/i.test(token)) {
      status = "paid";
    } else if (/^unpaid$/i.test(token)) {
      status = "unpaid";
    } else {
      titleTokens.push(token);
    }
  }

  if (amount === null) {
    return { ok: false, error: "Amount is required. Try: 'Coffee 4.50'" };
  }

  const title = titleTokens.join(" ").trim() || "Untitled";

  return {
    ok: true,
    expense: {
      title,
      totalAmount: Math.abs(amount),
      amountPaid: status === "paid" ? Math.abs(amount) : 0,
      status,
      priority: "Medium",
      category: "",
      monthKey: "", // assigned by caller from active month context
      rolledOver: false,
    },
  };
}

export function serializeExpense(expense: NewExpense): string {
  const parts: string[] = [];
  if (expense.title && expense.title !== "Untitled") {
    parts.push(expense.title);
  }
  parts.push(String(expense.totalAmount));
  if (expense.status !== "unpaid") {
    parts.push(expense.status);
  }
  return parts.join(" ");
}
