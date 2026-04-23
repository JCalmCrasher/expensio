import type { NewExpense, Priority, Status } from "@/types/expense";

export type ParseSuccess = {
  ok: true;
  expense: NewExpense;
};

export type ParseFailure = {
  ok: false;
  error: string;
};

export type ParseResult = ParseSuccess | ParseFailure;

// Priority keyword aliases — case-insensitive
const PRIORITY_MAP: Record<string, Priority> = {
  high: "High",
  urgent: "High",
  asap: "High",
  medium: "Medium",
  normal: "Medium",
  mid: "Medium",
  low: "Low",
  later: "Low",
  minor: "Low",
};

export function parseQuickAdd(input: string): ParseResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  let amount: number | null = null;
  let status: Status = "unpaid";
  let priority: Priority = "Medium";
  const titleTokens: string[] = [];

  for (const token of tokens) {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      // Numeric → amount (last-wins)
      amount = parseFloat(token);
    } else if (/^paid$/i.test(token)) {
      status = "paid";
    } else if (/^unpaid$/i.test(token)) {
      status = "unpaid";
    } else if (PRIORITY_MAP[token.toLowerCase()]) {
      // Priority keyword (last-wins)
      priority = PRIORITY_MAP[token.toLowerCase()];
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
      priority,
      category: "",
      monthKey: "",
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
  if (expense.priority !== "Medium") {
    parts.push(expense.priority.toLowerCase());
  }
  return parts.join(" ");
}
