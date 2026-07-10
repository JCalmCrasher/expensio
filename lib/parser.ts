import { parseDatePhrase } from "@/lib/parseDatePhrase";
import type { NewExpense, Priority, Status } from "@/types/expense";

export type ParseSuccess = {
  ok: true;
  expense: NewExpense;
  categoryFromParser: string;
};

export type ParseFailure = {
  ok: false;
  error: string;
};

export type ParseResult = ParseSuccess | ParseFailure;

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

function isKeyword(token: string): boolean {
  const lower = token.toLowerCase();
  return (
    /^paid$/i.test(token) ||
    /^unpaid$/i.test(token) ||
    PRIORITY_MAP[lower] != null ||
    /^due$/i.test(token)
  );
}

function extractNote(input: string): { text: string; note: string } {
  const match = input.match(/\bnote:\s*(.+)$/i);
  if (!match || match.index == null) return { text: input.trim(), note: "" };
  const note = match[1].trim().slice(0, 500);
  const text = input.slice(0, match.index).trim();
  return { text, note };
}

function extractDue(text: string): { text: string; dueDate: number | null } {
  const match = text.match(/\bdue\s+(.+)$/i);
  if (!match || match.index == null) return { text: text.trim(), dueDate: null };
  const phrase = match[1].trim();
  const dueDate = parseDatePhrase(phrase);
  const stripped = text.slice(0, match.index).trim();
  return { text: stripped, dueDate };
}

function extractBareCategory(text: string): { text: string; category: string } {
  const match = text.match(/^(.+?)\s+(-?\d+(?:\.\d+)?)\s+(\S+)$/);
  if (!match) return { text, category: "" };
  const candidate = match[3];
  if (isKeyword(candidate) || /^[#@]/.test(candidate)) {
    return { text, category: "" };
  }
  return { text: `${match[1]} ${match[2]}`.trim(), category: candidate };
}

export function parseQuickAdd(input: string): ParseResult {
  const { text: afterNote, note } = extractNote(input);
  const { text: afterDue, dueDate } = extractDue(afterNote);
  const { text, category: bareCategory } = extractBareCategory(afterDue);
  const tokens = text.split(/\s+/).filter(Boolean);

  let amount: number | null = null;
  let status: Status = "unpaid";
  let priority: Priority = "Medium";
  let categoryFromParser = bareCategory;
  const titleTokens: string[] = [];

  for (const token of tokens) {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      amount = parseFloat(token);
    } else if (/^paid$/i.test(token)) {
      status = "paid";
    } else if (/^unpaid$/i.test(token)) {
      status = "unpaid";
    } else if (PRIORITY_MAP[token.toLowerCase()]) {
      priority = PRIORITY_MAP[token.toLowerCase()];
    } else if (/^#(.+)$/.test(token) || /^@(.+)$/.test(token)) {
      categoryFromParser = token.slice(1);
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
    categoryFromParser: categoryFromParser.trim(),
    expense: {
      title,
      totalAmount: Math.abs(amount),
      amountPaid: status === "paid" ? Math.abs(amount) : 0,
      status,
      priority,
      category: "",
      monthKey: "",
      rolledOver: false,
      dueDate: dueDate ?? undefined,
      note,
    },
  };
}

export function serializeExpense(expense: NewExpense): string {
  const parts: string[] = [];
  if (expense.title && expense.title !== "Untitled") {
    parts.push(expense.title);
  }
  parts.push(String(expense.totalAmount));
  if (expense.category?.trim()) {
    parts.push(`#${expense.category.trim()}`);
  }
  if (expense.status !== "unpaid") {
    parts.push(expense.status);
  }
  if (expense.priority !== "Medium") {
    parts.push(expense.priority.toLowerCase());
  }
  if (expense.dueDate) {
    const iso = new Date(expense.dueDate).toISOString().slice(0, 10);
    parts.push(`due ${iso}`);
  }
  if (expense.note?.trim()) {
    parts.push(`note: ${expense.note.trim()}`);
  }
  return parts.join(" ");
}
