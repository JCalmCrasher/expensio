import { db } from "@/lib/db";
import type { Expense } from "@/types/expense";

export async function exportJSON(): Promise<string> {
  const expenses = await db.expenses.toArray();
  return JSON.stringify({ version: 1, expenses, exportedAt: Date.now() }, null, 2);
}

const CSV_HEADERS = [
  "title",
  "totalAmount",
  "amountPaid",
  "status",
  "priority",
  "category",
  "monthKey",
  "dueDate",
  "rolledOver",
];

function escapeCSV(val: unknown): string {
  const s = val == null ? "" : String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCSV(): Promise<string> {
  const expenses = await db.expenses.toArray();
  const rows = expenses.map((e) =>
    CSV_HEADERS.map((h) => {
      if (h === "dueDate")
        return escapeCSV(e.dueDate ? new Date(e.dueDate).toISOString().slice(0, 10) : "");
      return escapeCSV((e as unknown as Record<string, unknown>)[h]);
    }).join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export async function importJSON(
  jsonString: string
): Promise<{ imported: number; errors: string[] }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.expenses || !Array.isArray(data.expenses)) {
      return { imported: 0, errors: ["Invalid format: missing expenses array"] };
    }
    return bulkInsert(data.expenses as Expense[]);
  } catch (err) {
    return { imported: 0, errors: [`Parse error: ${String(err)}`] };
  }
}

export async function importCSV(
  csvString: string
): Promise<{ imported: number; errors: string[] }> {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) return { imported: 0, errors: ["CSV is empty or has no data rows"] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const expenses: Partial<Expense>[] = [];
  const parseErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length !== headers.length) {
      parseErrors.push(`Row ${i + 1}: column count mismatch`);
      continue;
    }
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx];
    });

    const totalAmount = parseFloat(row.totalAmount);
    const amountPaid = parseFloat(row.amountPaid ?? "0");

    if (!row.title?.trim()) {
      parseErrors.push(`Row ${i + 1}: missing title`);
      continue;
    }
    if (isNaN(totalAmount) || totalAmount <= 0) {
      parseErrors.push(`Row ${i + 1}: invalid totalAmount`);
      continue;
    }

    expenses.push({
      title: row.title.trim(),
      totalAmount,
      amountPaid: isNaN(amountPaid) ? 0 : amountPaid,
      status: row.status === "paid" ? "paid" : "unpaid",
      priority: ["High", "Medium", "Low"].includes(row.priority)
        ? (row.priority as Expense["priority"])
        : "Medium",
      category: row.category ?? "",
      monthKey: row.monthKey ?? new Date().toISOString().slice(0, 7),
      rolledOver: row.rolledOver === "true",
      dueDate: row.dueDate ? new Date(row.dueDate).getTime() : null,
      createdAt: Date.now(),
    });
  }

  const { imported, errors } = await bulkInsert(expenses as Expense[]);
  return { imported, errors: [...parseErrors, ...errors] };
}

async function bulkInsert(expenses: Expense[]): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  for (const expense of expenses) {
    try {
      const { id: _id, ...rest } = expense;
      if (!rest.createdAt) rest.createdAt = Date.now();
      await db.expenses.add(rest);
      imported++;
    } catch (err) {
      errors.push(`Failed to import "${expense.title}": ${String(err)}`);
    }
  }
  return { imported, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// Keep old name for any existing callers
export const exportData = exportJSON;
export const importData = importJSON;
