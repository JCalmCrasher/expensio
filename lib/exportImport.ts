import { db } from "@/lib/db";
import type { Expense } from "@/types/expense";

// ── Security limits ───────────────────────────────────────────────────────────
const MAX_IMPORT_RECORDS = 10_000;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FIELD_LENGTH = 500;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

// ── Sanitization helpers ──────────────────────────────────────────────────────

/** Strip HTML-dangerous characters and truncate */
function sanitizeString(s: unknown, maxLen = MAX_FIELD_LENGTH): string {
  if (s == null) return "";
  return String(s)
    .replace(/[<>"'`]/g, "") // strip XSS-relevant chars
    .trim()
    .slice(0, maxLen);
}

/** Safely parse JSON without prototype pollution */
function safeParseJSON(text: string): unknown {
  const parsed = JSON.parse(text);
  // Re-serialize to strip __proto__ / constructor keys
  return JSON.parse(JSON.stringify(parsed));
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportJSON(): Promise<string> {
  const expenses = await db.expenses.toArray();
  return JSON.stringify({ version: 1, expenses, exportedAt: Date.now() }, null, 2);
}

const CSV_HEADERS = [
  "title", "totalAmount", "amountPaid", "status",
  "priority", "category", "monthKey", "dueDate", "rolledOver", "note",
];

function escapeCSV(val: unknown): string {
  const s = val == null ? "" : String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
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

// ── Import ────────────────────────────────────────────────────────────────────

export async function importJSON(
  jsonString: string
): Promise<{ imported: number; errors: string[] }> {
  // F1: file size guard (caller should also check, but belt-and-suspenders)
  if (jsonString.length > MAX_FILE_SIZE_BYTES) {
    return { imported: 0, errors: ["File too large (max 5 MB)"] };
  }

  try {
    // F3: prototype-pollution-safe parse
    const data = safeParseJSON(jsonString) as Record<string, unknown>;
    if (!data.expenses || !Array.isArray(data.expenses)) {
      return { imported: 0, errors: ["Invalid format: missing expenses array"] };
    }

    // F1: record count limit
    if ((data.expenses as unknown[]).length > MAX_IMPORT_RECORDS) {
      return {
        imported: 0,
        errors: [`Too many records: max ${MAX_IMPORT_RECORDS} per import`],
      };
    }

    return bulkInsert(data.expenses as Expense[]);
  } catch (err) {
    return { imported: 0, errors: [`Parse error: ${String(err)}`] };
  }
}

export async function importCSV(
  csvString: string
): Promise<{ imported: number; errors: string[] }> {
  // F1: size guard
  if (csvString.length > MAX_FILE_SIZE_BYTES) {
    return { imported: 0, errors: ["File too large (max 5 MB)"] };
  }

  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) return { imported: 0, errors: ["CSV is empty or has no data rows"] };

  // F1: record count limit
  if (lines.length - 1 > MAX_IMPORT_RECORDS) {
    return {
      imported: 0,
      errors: [`Too many rows: max ${MAX_IMPORT_RECORDS} per import`],
    };
  }

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
    headers.forEach((h, idx) => { row[h] = cols[idx]; });

    const totalAmount = parseFloat(row.totalAmount);
    const rawPaid    = parseFloat(row.amountPaid ?? "0");

    if (!row.title?.trim()) { parseErrors.push(`Row ${i + 1}: missing title`); continue; }
    if (isNaN(totalAmount) || totalAmount <= 0) { parseErrors.push(`Row ${i + 1}: invalid totalAmount`); continue; }

    // F5: cap amountPaid between 0 and totalAmount
    const amountPaid = Math.max(0, Math.min(isNaN(rawPaid) ? 0 : rawPaid, totalAmount));

    // F4: validate monthKey format
    const rawMonthKey = row.monthKey ?? "";
    const monthKey = MONTH_KEY_RE.test(rawMonthKey)
      ? rawMonthKey
      : new Date().toISOString().slice(0, 7);

    expenses.push({
      // F2: sanitize free-text fields
      title:      sanitizeString(row.title, 200),
      category:   sanitizeString(row.category, 100),
      totalAmount,
      amountPaid,
      status:     row.status === "paid" ? "paid" : "unpaid",
      priority:   ["High", "Medium", "Low"].includes(row.priority)
                    ? (row.priority as Expense["priority"])
                    : "Medium",
      monthKey,
      rolledOver: row.rolledOver === "true",
      dueDate:    row.dueDate ? new Date(row.dueDate).getTime() : null,
      note:       sanitizeString(row.note, 500),
      createdAt:  Date.now(),
    });
  }

  const { imported, errors } = await bulkInsert(expenses as Expense[]);
  return { imported, errors: [...parseErrors, ...errors] };
}

// ── Shared bulk insert ────────────────────────────────────────────────────────

async function bulkInsert(
  expenses: Expense[]
): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  for (const expense of expenses) {
    try {
      const { id: _id, ...rest } = expense;
      if (!rest.createdAt) rest.createdAt = Date.now();

      // F2: sanitize free-text fields from JSON imports too
      rest.title    = sanitizeString(rest.title, 200) || "Untitled";
      rest.category = sanitizeString(rest.category, 100);
      rest.note     = sanitizeString(rest.note, 500);

      // F4: validate monthKey
      if (!MONTH_KEY_RE.test(rest.monthKey)) {
        rest.monthKey = new Date().toISOString().slice(0, 7);
      }

      // F5: cap amountPaid
      rest.amountPaid = Math.max(0, Math.min(rest.amountPaid ?? 0, rest.totalAmount));

      await db.expenses.add(rest);
      imported++;
    } catch (err) {
      errors.push(`Failed to import "${expense.title}": ${String(err)}`);
    }
  }
  return { imported, errors };
}

// ── CSV line parser ───────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// Keep old names for existing callers
export const exportData = exportJSON;
export const importData = importJSON;
