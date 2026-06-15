# Bulk import of expenses

## Prompt

Add and polish **bulk import of expenses** in Expensio so users can bring in many records at once from JSON, CSV, or spreadsheet paste — reliably, safely, and with clear feedback.

### Context

Expensio is a Next.js PWA expense tracker. Data lives in **IndexedDB via Dexie** (`lib/db.ts`). The `Expense` shape is defined in `types/expense.ts`:

| Field | Notes |
|---|---|
| `title` | Required |
| `totalAmount` | Required, > 0 |
| `amountPaid` | 0 ≤ amountPaid ≤ totalAmount |
| `status` | `"paid"` \| `"unpaid"` |
| `priority` | `"High"` \| `"Medium"` \| `"Low"` |
| `category` | Free-text; empty string if unset |
| `monthKey` | `"YYYY-MM"` — month the expense belongs to |
| `rolledOver` | Boolean |
| `createdAt` | Unix ms; set on write |
| `dueDate` | Optional Unix ms |
| `note` | Optional free text |

A **partial implementation already exists**:

- `lib/exportImport.ts` — `importJSON`, `importCSV`, `bulkInsert`, export helpers, sanitization, and limits (10k records, 5 MB)
- `components/ImportModal.tsx` — format toggle, file upload, paste area, template download, result summary
- `components/AppSidebar.tsx` — sidebar entry point ("Import expenses")

Single-expense creation in `ExpenseApp.tsx` also calls `notifyAfterExpenseChange()` after writes; bulk import currently does **not**.

Read `AGENTS.md` before changing Next.js code. Match existing UI patterns (`ResponsiveModal`, `Button` variants, sidebar styling, `sonner` toasts).

### Goals

1. **Complete the bulk-import flow** so it feels first-class, not a side feature.
2. **Keep all processing client-side** (offline-first PWA; no server upload).
3. **Preserve data integrity** — validate, sanitize, and never corrupt existing data on partial failure.
4. **Integrate with the rest of the app** — live queries, notifications, categories, and month navigation should behave correctly after import.

### Requirements

#### Import formats

Support these input methods (extend existing code; do not duplicate):

1. **JSON** — `{ "version": 1, "expenses": [ … ] }` (current format)
2. **CSV** — header row + data rows (current format)
3. **TSV / spreadsheet paste** — tab-separated rows pasted from Excel or Google Sheets; auto-detect tabs vs commas when pasted content has no header commas but has tabs

Default missing `monthKey` to the user's **active month** (`useExpenseStore().activeMonthKey`) instead of always using the current calendar month.

#### Pre-import preview (new)

Add a **review step** between parsing and committing:

- Show a compact table: row number, title, amount, status, category, monthKey, and validation status
- Cap preview at ~50 rows with "and N more…" for large files
- Let the user **confirm** or **go back** to fix the file/paste
- Rows with validation errors appear in the preview as skipped (with reason); only valid rows are imported on confirm

Extract parsing from `bulkInsert` into something like `parseImportFile(text, format, options)` that returns `{ valid: NewExpense[], errors: ImportError[] }` without writing to the DB.

#### Import modes (new)

On confirm, offer (simple radio or segment control, default **Append**):

- **Append** — add new records (current behavior)
- **Replace month** — delete all expenses for each `monthKey` present in the import payload, then insert (scoped per month, not a full DB wipe)
- **Replace all** — clear `db.expenses` then insert (require an explicit confirmation checkbox: "This will delete all existing expenses")

Use a Dexie transaction for replace modes so delete + insert is atomic per operation.

#### Performance

Replace row-by-row `db.expenses.add` in `bulkInsert` with `db.expenses.bulkAdd` inside a transaction where possible. Keep per-row error collection for rows that fail validation before insert.

#### Categories

When an imported row has a non-empty `category` that does not exist in `db.categories`, **auto-create** it with `maxAmount: 0` (same as `CategoryCombobox`). Ignore duplicate-name constraint errors.

#### Post-import integration

After a successful import:

- Call `notifyAfterExpenseChange()` from `components/NotificationManager.tsx`
- Show a `sonner` toast with imported count (and skipped count if any)
- If imported rows span months other than the active month, suggest navigating to those months (toast action or inline hint on the result step)

#### UX polish (`ImportModal.tsx`)

- Keep entry point in sidebar; consider also a subtle "Import" link near Quick Add if it fits without clutter
- Show import progress for large files (spinner + "Importing X of Y…" or indeterminate state)
- Expand error list: "Show all" toggle when > 4 errors
- Ensure mobile layout works (`ResponsiveModal` drawer on small screens)
- Downloadable templates stay in sync with `CSV_HEADERS` in `exportImport.ts`

#### Security & validation (keep and extend existing guards)

- Max 10,000 records, 5 MB file size
- Sanitize free-text fields (`title`, `category`, `note`) — strip XSS-relevant chars, enforce max lengths
- Validate `monthKey` with `/^\d{4}-\d{2}$/`; fall back to active month
- Cap `amountPaid` to `[0, totalAmount]`
- Safe JSON parse (no prototype pollution) — keep `safeParseJSON`
- Reject negative or zero `totalAmount`

#### Tests

Add `lib/__tests__/exportImport.test.ts` with Vitest covering:

- Valid JSON and CSV imports
- Row-level validation errors (missing title, bad amount)
- `monthKey` fallback to provided default
- TSV / tab paste detection
- Replace-month and replace-all behavior (use fake-indexeddb or Dexie in-memory if already set up; otherwise test pure parse/validate functions)

### Files likely to change

| File | Change |
|---|---|
| `lib/exportImport.ts` | Parse/preview API, bulk transaction, import modes, TSV support |
| `components/ImportModal.tsx` | Preview step, import mode UI, progress, toasts |
| `components/AppSidebar.tsx` | Wire `onImportComplete` callback if needed |
| `components/ExpenseApp.tsx` | Optional: pass `activeMonthKey` into import flow |
| `lib/__tests__/exportImport.test.ts` | New tests |

### Out of scope

- Server-side import or cloud sync
- Importing categories with custom `maxAmount` (categories get `maxAmount: 0`)
- Excel `.xlsx` binary upload (CSV/TSV paste is enough for v1)
- Duplicate detection / merge by title+amount (future enhancement)

### Acceptance criteria

- [ ] User can import 100+ expenses from CSV or JSON in under a few seconds
- [ ] Preview shows parsed rows before anything is written to IndexedDB
- [ ] Append / replace-month / replace-all modes work and are transactional
- [ ] Invalid rows are skipped with clear row-level error messages
- [ ] Pasting tab-separated spreadsheet data imports correctly
- [ ] Missing `monthKey` defaults to the active month in the UI
- [ ] New categories from import appear in the category combobox
- [ ] Expense list and monthly summary update immediately after import (Dexie live query)
- [ ] Notification engine re-runs after import
- [ ] Vitest tests pass for core import parsing and validation
- [ ] `npm run lint` and `npm run build` succeed

### Implementation notes

- Prefer extending `lib/exportImport.ts` over new modules unless the file becomes unwieldy (> ~350 lines)
- Do not change the `Expense` schema or Dexie version unless strictly necessary
- Follow existing export column order: `title, totalAmount, amountPaid, status, priority, category, monthKey, dueDate, rolledOver, note`
- When editing UI, mirror patterns from `EditExpenseModal.tsx` and `SettingsDialog.tsx`
