import { db } from "@/lib/db";
import type { Expense, NewExpense } from "@/types/expense";

// ── Security limits ───────────────────────────────────────────────────────────
export const MAX_IMPORT_RECORDS = 10_000;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FIELD_LENGTH = 500;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
const PREVIEW_CAP = 50;

export const CSV_HEADERS = [
  "title",
  "totalAmount",
  "amountPaid",
  "status",
  "priority",
  "category",
  "monthKey",
  "dueDate",
  "rolledOver",
  "note",
] as const;

export type ImportFormat = "json" | "csv" | "tsv";
export type ImportMode = "append" | "replace-month" | "replace-all";

export interface ImportError {
  row: number;
  message: string;
}

export interface ParsePreviewRow {
  row: number;
  title: string;
  totalAmount: number;
  status: string;
  category: string;
  monthKey: string;
  valid: boolean;
  error?: string;
}

export interface ParseImportOptions {
  defaultMonthKey: string;
}

export interface ParseImportResult {
  valid: NewExpense[];
  preview: ParsePreviewRow[];
  errors: ImportError[];
}

export interface CommitImportResult {
  imported: number;
  errors: string[];
  otherMonthKeys: string[];
}

// ── Sanitization helpers ──────────────────────────────────────────────────────

/** Strip HTML-dangerous characters and truncate */
function sanitizeString(s: unknown, maxLen = MAX_FIELD_LENGTH): string {
  if (s == null) return "";
  return String(s)
    .replace(/[<>"'`]/g, "")
    .trim()
    .slice(0, maxLen);
}

/** Safely parse JSON without prototype pollution */
function safeParseJSON(text: string): unknown {
  const parsed = JSON.parse(text);
  return JSON.parse(JSON.stringify(parsed));
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportJSON(): Promise<string> {
  const expenses = await db.expenses.toArray();
  return JSON.stringify({ version: 1, expenses, exportedAt: Date.now() }, null, 2);
}

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
    }).join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function csvTemplateRow(): string {
  return "Rent,1200,0,unpaid,High,Housing,2026-04,2026-04-30,false,Monthly rent";
}

// ── Parse (no DB writes) ──────────────────────────────────────────────────────

export function detectDelimiter(text: string): "," | "\t" {
  const headerLine = splitImportLines(text)[0] ?? "";
  if (headerLine.includes("\t") && !headerLine.includes(",")) return "\t";
  const tabCols = headerLine.split("\t").length;
  const commaCols = parseDelimitedLine(headerLine, ",").length;
  return tabCols > commaCols ? "\t" : ",";
}

export function resolveImportFormat(
  format: ImportFormat | "auto",
  text: string,
): ImportFormat {
  if (format !== "auto") return format;
  const trimmed = text.replace(/^\uFEFF/, "").replace(/^[ \r\n]+/, "").replace(/[ \r\n]+$/, "");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  return detectDelimiter(text) === "\t" ? "tsv" : "csv";
}

export function parseImportFile(
  text: string,
  format: ImportFormat | "auto",
  options: ParseImportOptions,
): ParseImportResult {
  if (text.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: [],
      preview: [],
      errors: [{ row: 0, message: "File too large (max 5 MB)" }],
    };
  }

  const resolved = resolveImportFormat(format, text);
  if (resolved === "json") return parseJSONImport(text, options);
  return parseDelimitedImport(text, options);
}

function splitImportLines(text: string): string[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.replace(/\r$/, ""));
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start] === "") start++;
  while (end > start && lines[end - 1] === "") end--;
  return lines.slice(start, end);
}

function parseJSONImport(text: string, options: ParseImportOptions): ParseImportResult {
  try {
    const data = safeParseJSON(text) as Record<string, unknown>;
    if (!data.expenses || !Array.isArray(data.expenses)) {
      return {
        valid: [],
        preview: [],
        errors: [{ row: 0, message: "Invalid format: missing expenses array" }],
      };
    }
    if (data.expenses.length > MAX_IMPORT_RECORDS) {
      return {
        valid: [],
        preview: [],
        errors: [{ row: 0, message: `Too many records: max ${MAX_IMPORT_RECORDS} per import` }],
      };
    }

    return collectRows(
      (data.expenses as Partial<Expense>[]).map((row, i) => ({ row: i + 1, data: row })),
      options,
      (row) => normalizeFromObject(row.data as Partial<Expense>, options.defaultMonthKey),
    );
  } catch (err) {
    return {
      valid: [],
      preview: [],
      errors: [{ row: 0, message: `Parse error: ${String(err)}` }],
    };
  }
}

function parseDelimitedImport(
  text: string,
  options: ParseImportOptions,
): ParseImportResult {
  const delimiter =
    resolveImportFormat("auto", text) === "tsv" ? "\t" : detectDelimiter(text);
  const lines = splitImportLines(text);
  if (lines.length < 2) {
    return {
      valid: [],
      preview: [],
      errors: [{ row: 0, message: "File is empty or has no data rows" }],
    };
  }
  if (lines.length - 1 > MAX_IMPORT_RECORDS) {
    return {
      valid: [],
      preview: [],
      errors: [{ row: 0, message: `Too many rows: max ${MAX_IMPORT_RECORDS} per import` }],
    };
  }

  const headers = parseDelimitedLine(lines[0], delimiter).map((h) =>
    h.trim().replace(/^"|"$/g, ""),
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseDelimitedLine(lines[i], delimiter);
    if (cols.length !== headers.length) {
      rows.push({
        row: i + 1,
        error: "column count mismatch",
        data: null as Record<string, string> | null,
      });
      continue;
    }
    const data: Record<string, string> = {};
    headers.forEach((h, idx) => {
      data[h] = cols[idx];
    });
    rows.push({ row: i + 1, error: null as string | null, data });
  }

  return collectRows(
    rows,
    options,
    (item) => {
      if (item.error) return { ok: false as const, error: item.error };
      if (!item.data) return { ok: false as const, error: "invalid row" };
      return normalizeFromDelimitedRow(item.data, options.defaultMonthKey);
    },
  );
}

function collectRows<T>(
  items: T[],
  options: ParseImportOptions,
  normalize: (item: T) => { ok: true; expense: NewExpense } | { ok: false; error: string },
): ParseImportResult {
  const valid: NewExpense[] = [];
  const errors: ImportError[] = [];
  const preview: ParsePreviewRow[] = [];

  for (const item of items) {
    const rowNum = (item as { row: number }).row;
    const result = normalize(item);
    if (result.ok) {
      valid.push(result.expense);
      preview.push({
        row: rowNum,
        title: result.expense.title,
        totalAmount: result.expense.totalAmount,
        status: result.expense.status,
        category: result.expense.category,
        monthKey: result.expense.monthKey,
        valid: true,
      });
    } else {
      errors.push({ row: rowNum, message: result.error });
      preview.push({
        row: rowNum,
        title: "",
        totalAmount: 0,
        status: "",
        category: "",
        monthKey: options.defaultMonthKey,
        valid: false,
        error: result.error,
      });
    }
  }

  return { valid, preview: preview.slice(0, PREVIEW_CAP), errors };
}

function normalizeFromDelimitedRow(
  row: Record<string, string>,
  defaultMonthKey: string,
): { ok: true; expense: NewExpense } | { ok: false; error: string } {
  const totalAmount = parseFloat(row.totalAmount);
  const rawPaid = parseFloat(row.amountPaid ?? "0");

  if (!row.title?.trim()) return { ok: false, error: "missing title" };
  if (isNaN(totalAmount) || totalAmount <= 0) return { ok: false, error: "invalid totalAmount" };

  const amountPaid = Math.max(0, Math.min(isNaN(rawPaid) ? 0 : rawPaid, totalAmount));
  const rawMonthKey = row.monthKey ?? "";
  const monthKey = MONTH_KEY_RE.test(rawMonthKey) ? rawMonthKey : defaultMonthKey;

  return {
    ok: true,
    expense: {
      title: sanitizeString(row.title, 200),
      category: sanitizeString(row.category, 100),
      totalAmount,
      amountPaid,
      status: row.status === "paid" ? "paid" : "unpaid",
      priority: ["High", "Medium", "Low"].includes(row.priority)
        ? (row.priority as Expense["priority"])
        : "Medium",
      monthKey,
      rolledOver: row.rolledOver === "true",
      dueDate: row.dueDate ? new Date(row.dueDate).getTime() : null,
      note: sanitizeString(row.note, 500),
    },
  };
}

function normalizeFromObject(
  expense: Partial<Expense>,
  defaultMonthKey: string,
): { ok: true; expense: NewExpense } | { ok: false; error: string } {
  const totalAmount = Number(expense.totalAmount);
  if (!expense.title?.toString().trim()) return { ok: false, error: "missing title" };
  if (isNaN(totalAmount) || totalAmount <= 0) return { ok: false, error: "invalid totalAmount" };

  const amountPaid = Math.max(0, Math.min(Number(expense.amountPaid ?? 0), totalAmount));
  const monthKey = MONTH_KEY_RE.test(expense.monthKey ?? "")
    ? expense.monthKey!
    : defaultMonthKey;

  return {
    ok: true,
    expense: {
      title: sanitizeString(expense.title, 200) || "Untitled",
      category: sanitizeString(expense.category, 100),
      totalAmount,
      amountPaid,
      status: expense.status === "paid" ? "paid" : "unpaid",
      priority: ["High", "Medium", "Low"].includes(expense.priority ?? "")
        ? expense.priority!
        : "Medium",
      monthKey,
      rolledOver: Boolean(expense.rolledOver),
      dueDate: expense.dueDate ? new Date(expense.dueDate).getTime() : null,
      note: sanitizeString(expense.note, 500),
    },
  };
}

// ── Commit (DB writes) ────────────────────────────────────────────────────────

const COMMIT_CHUNK = 500;

async function ensureCategories(expenses: NewExpense[]): Promise<void> {
  const names = [
    ...new Set(
      expenses.map((e) => e.category.trim()).filter(Boolean),
    ),
  ];
  if (names.length === 0) return;

  const existing = await db.categories.toArray();
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

  for (const name of names) {
    if (existingNames.has(name.toLowerCase())) continue;
    try {
      await db.categories.add({ name, maxAmount: 0 });
      existingNames.add(name.toLowerCase());
    } catch {
      // duplicate name race — ignore
    }
  }
}

export async function commitImport(
  valid: NewExpense[],
  mode: ImportMode,
  options?: {
    activeMonthKey?: string;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<CommitImportResult> {
  if (valid.length === 0) {
    return { imported: 0, errors: [], otherMonthKeys: [] };
  }

  const errors: string[] = [];
  const now = Date.now();
  const records = valid.map((e) => ({ ...e, createdAt: now }));
  const otherMonthKeys = [
    ...new Set(
      valid
        .map((e) => e.monthKey)
        .filter((m) => m !== options?.activeMonthKey),
    ),
  ];

  try {
    await db.transaction("rw", db.expenses, db.categories, async () => {
      if (mode === "replace-all") {
        await db.expenses.clear();
      } else if (mode === "replace-month") {
        const months = [...new Set(valid.map((e) => e.monthKey))];
        for (const monthKey of months) {
          await db.expenses.where("monthKey").equals(monthKey).delete();
        }
      }

      await ensureCategories(valid);

      for (let i = 0; i < records.length; i += COMMIT_CHUNK) {
        const chunk = records.slice(i, i + COMMIT_CHUNK);
        await db.expenses.bulkAdd(chunk);
        options?.onProgress?.(Math.min(i + chunk.length, records.length), records.length);
      }
    });
  } catch (err) {
    errors.push(`Import failed: ${String(err)}`);
    return { imported: 0, errors, otherMonthKeys };
  }

  return { imported: records.length, errors, otherMonthKeys };
}

// ── Legacy one-shot import API ────────────────────────────────────────────────

export async function importJSON(
  jsonString: string,
  defaultMonthKey?: string,
): Promise<{ imported: number; errors: string[] }> {
  const parsed = parseImportFile(jsonString, "json", {
    defaultMonthKey: defaultMonthKey ?? new Date().toISOString().slice(0, 7),
  });
  if (parsed.errors.length > 0 && parsed.valid.length === 0) {
    return { imported: 0, errors: parsed.errors.map((e) => formatError(e)) };
  }
  const result = await commitImport(parsed.valid, "append", { activeMonthKey: defaultMonthKey });
  return {
    imported: result.imported,
    errors: [
      ...parsed.errors.map((e) => formatError(e)),
      ...result.errors,
    ],
  };
}

export async function importCSV(
  csvString: string,
  defaultMonthKey?: string,
): Promise<{ imported: number; errors: string[] }> {
  const parsed = parseImportFile(csvString, "auto", {
    defaultMonthKey: defaultMonthKey ?? new Date().toISOString().slice(0, 7),
  });
  if (parsed.errors.length > 0 && parsed.valid.length === 0) {
    return { imported: 0, errors: parsed.errors.map((e) => formatError(e)) };
  }
  const result = await commitImport(parsed.valid, "append", { activeMonthKey: defaultMonthKey });
  return {
    imported: result.imported,
    errors: [
      ...parsed.errors.map((e) => formatError(e)),
      ...result.errors,
    ],
  };
}

function formatError(err: ImportError): string {
  return err.row > 0 ? `Row ${err.row}: ${err.message}` : err.message;
}

// ── Delimited line parser ─────────────────────────────────────────────────────

function parseDelimitedLine(line: string, delimiter: "," | "\t"): string[] {
  if (delimiter === "\t") return line.split("\t");

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

export const exportData = exportJSON;
export const importData = importJSON;
