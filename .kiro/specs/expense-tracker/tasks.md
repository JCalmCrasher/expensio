# Implementation Plan: Expense Tracker

## Overview

Implement a local-first expense tracker using Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Dexie.js, Zustand, and fast-check. Tasks are ordered by dependency: types → database → utilities → parser → store → SSR boundary → components → wiring. Each step builds on the previous and ends with all pieces integrated into a working application.

## Tasks

- [x] 1. Install dependencies and configure project
  - Install runtime dependencies: `dexie`, `dexie-react-hooks`, `zustand`
  - Install dev dependency: `fast-check`
  - Verify shadcn/ui is configured (check for `components/ui/` directory and `components.json`); initialise it if absent
  - Read `node_modules/next/dist/docs/` for any App Router breaking changes before writing any Next.js code
  - _Requirements: 9.1, 9.4_

- [x] 2. Define core TypeScript types
  - [x] 2.1 Create `types/expense.ts` with `Priority`, `Status`, `Expense`, `NewExpense`, and `MonthlySummary` types exactly as specified in the design
    - `Priority = "High" | "Medium" | "Low"`
    - `Status = "paid" | "unpaid"`
    - `Expense` interface with all fields (`id?`, `title`, `totalAmount`, `amountPaid`, `status`, `priority`, `category`, `monthKey`, `rolledOver`, `createdAt`)
    - `NewExpense = Omit<Expense, "id" | "createdAt">`
    - `MonthlySummary` interface with `totalOwed`, `totalPaid`, `progress`
    - _Requirements: 1.2, 1.5, 1.8, 4.1, 5.1_

- [x] 3. Implement the database layer
  - [x] 3.1 Create `lib/db.ts` with `ExpenseDatabase` class extending `Dexie`
    - Define `expenses` table with schema `"++id, monthKey, status, priority"`
    - Export singleton `db` instance
    - _Requirements: 9.1, 9.3_

- [x] 4. Implement month key utilities
  - [x] 4.1 Create `lib/monthKey.ts` with all five utility functions
    - `toMonthKey(date: Date): string` — formats as `"YYYY-MM"`
    - `currentMonthKey(): string`
    - `nextMonthKey(key: string): string` — handles December → January wrap
    - `prevMonthKey(key: string): string` — handles January → December wrap
    - `formatMonthKey(key: string): string` — returns locale display string (e.g. "June 2025")
    - _Requirements: 6.1, 6.3, 7.2_

  - [x] 4.2 Write unit tests for month key utilities
    - Test `nextMonthKey("2025-12")` → `"2026-01"` (December wrap)
    - Test `prevMonthKey("2025-01")` → `"2024-12"` (January wrap)
    - Test `toMonthKey` round-trips with known dates
    - _Requirements: 6.5_

- [x] 5. Implement the Quick Add parser
  - [x] 5.1 Create `lib/parser.ts` with `parseQuickAdd` and `serializeExpense` pure functions
    - Tokenize on whitespace; classify each token as amount, status, or title
    - Amount: matches `/^-?\d+(\.\d+)?$/`; use absolute value; last-wins on duplicates
    - Status: matches `paid`/`unpaid` case-insensitively; last-wins; defaults to `"unpaid"`
    - Title: remaining tokens joined with space; defaults to `"Untitled"` when empty
    - Return `ParseSuccess` or `ParseFailure` discriminated union
    - `serializeExpense` produces canonical string for round-trip testing
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.11_

  - [x] 5.2 Write property test — Property 1: Parser round-trip
    - **Property 1: For any valid Quick Add input string (containing at least one numeric token), parse → serialize → parse SHALL produce an equivalent `NewExpense`**
    - **Validates: Requirements 1.11**
    - Use `fc.array(fc.string())` assembled into valid input strings with at least one numeric token
    - Tag: `// Feature: expense-tracker, Property 1: Parser round-trip`

  - [x] 5.3 Write property test — Property 2: Parser always extracts a valid amount
    - **Property 2: For any input string containing exactly one numeric token, the parser SHALL return success with `totalAmount` equal to the absolute value of that token**
    - **Validates: Requirements 1.5**
    - Use `fc.float({ min: 0.01 })` embedded in random non-numeric strings
    - Tag: `// Feature: expense-tracker, Property 2: Parser always extracts a valid amount`

  - [x] 5.4 Write property test — Property 3: Parser rejects inputs with no numeric token
    - **Property 3: For any input string containing no numeric tokens, the parser SHALL return `ok: false`**
    - **Validates: Requirements 1.6**
    - Use `fc.array(fc.string())` filtered to exclude tokens matching `/^-?\d+(\.\d+)?$/`
    - Tag: `// Feature: expense-tracker, Property 3: Parser rejects inputs with no numeric token`

  - [x] 5.5 Write property test — Property 4: Parser status extraction
    - **Property 4: For any input containing "paid"/"unpaid" (any casing), the parser SHALL set `status` to the matched keyword; for inputs with no status keyword, `status` SHALL default to `"unpaid"`**
    - **Validates: Requirements 1.3, 1.4**
    - Use `fc.constantFrom("paid", "PAID", "Paid", "unpaid", "UNPAID")` combined with a numeric token
    - Tag: `// Feature: expense-tracker, Property 4: Parser status extraction`

  - [x] 5.6 Write property test — Property 5: Parser default priority
    - **Property 5: For any valid input string, the parser SHALL always produce a `NewExpense` with `priority === "Medium"`**
    - **Validates: Requirements 1.8, 4.2**
    - Use any valid input string (with at least one numeric token)
    - Tag: `// Feature: expense-tracker, Property 5: Parser default priority`

  - [x] 5.7 Write property test — Property 6: Parser title construction
    - **Property 6: The parser's title SHALL be the space-joined concatenation of all non-amount, non-status tokens; if none exist, title SHALL be `"Untitled"`**
    - **Validates: Requirements 1.7**
    - Use `fc.array(fc.string())` with known title tokens alongside a numeric token
    - Tag: `// Feature: expense-tracker, Property 6: Parser title construction`

- [x] 6. Implement category color utility
  - [x] 6.1 Create `lib/categoryColor.ts` with `getCategoryColor(label: string): string`
    - Define `CATEGORY_PALETTE` array of 8 Tailwind class strings
    - Implement `hashString` using `Math.imul(31, h)` accumulator
    - Return `"bg-zinc-100 text-zinc-500"` for empty label
    - Return `CATEGORY_PALETTE[hashString(label) % CATEGORY_PALETTE.length]` for non-empty label
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 6.2 Write property test — Property 7: Category color consistency
    - **Property 7: For any non-empty category label string, `getCategoryColor(label)` SHALL always return the same color class string regardless of call order or frequency**
    - **Validates: Requirements 5.3, 5.4**
    - Use `fc.string({ minLength: 1 })` and assert two calls with the same label return identical results
    - Tag: `// Feature: expense-tracker, Property 7: Category color consistency`

- [x] 7. Implement Zustand store
  - [x] 7.1 Create `store/useExpenseStore.ts` with `useExpenseStore` hook
    - State: `activeMonthKey: string` (initialised to `currentMonthKey()`)
    - State: `openPaymentFormId: number | null` (initialised to `null`)
    - Actions: `setActiveMonthKey`, `setOpenPaymentFormId`
    - Do NOT store the expense list in Zustand — it is derived from Dexie via `useLiveQuery`
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 8. Implement business logic helpers (payment and rollover)
  - [x] 8.1 Create `lib/expenseLogic.ts` with pure helper functions for payment and rollover calculations
    - `applyPayment(expense: Expense, payment: number): Partial<Expense>` — returns updated `amountPaid` and `status`; caps at `totalAmount`; rejects `payment <= 0` by throwing
    - `buildRolloverCopies(expenses: Expense[], targetMonthKey: string): NewExpense[]` — filters to unpaid, maps to copies with `rolledOver: true` and new `monthKey`, strips `id` and `createdAt`
    - `computeMonthlySummary(expenses: Expense[]): MonthlySummary` — sums `totalAmount` and `amountPaid`; returns `progress = 0` when `totalOwed === 0`
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.5_

  - [x] 8.2 Write property test — Property 8: Partial payment accumulation and capping
    - **Property 8: For any expense with `totalAmount > 0` and payment `p > 0`, `applyPayment` SHALL set `newAmountPaid = min(oldAmountPaid + p, totalAmount)` and `status = "paid"` iff `newAmountPaid >= totalAmount`**
    - **Validates: Requirements 3.1, 3.3, 3.5**
    - Use `fc.record({ totalAmount: fc.float({ min: 0.01 }), amountPaid: fc.float({ min: 0 }) })` with `fc.float({ min: 0.01 })` for payment
    - Tag: `// Feature: expense-tracker, Property 8: Partial payment accumulation and capping`

  - [x] 8.3 Write property test — Property 9: Partial payment rejection
    - **Property 9: For any payment amount `p <= 0`, `applyPayment` SHALL throw and the expense SHALL remain unchanged**
    - **Validates: Requirements 3.4**
    - Use `fc.float({ max: 0 })` for payment amount
    - Tag: `// Feature: expense-tracker, Property 9: Partial payment rejection`

  - [x] 8.4 Write property test — Property 10: Rollover preserves fields and sets flag
    - **Property 10: For any set of unpaid expenses rolled over from month M to M+1, each copy SHALL have the same `title`, `totalAmount`, `amountPaid`, `priority`, `category`, `rolledOver = true`, and `monthKey` equal to the target month**
    - **Validates: Requirements 7.2, 7.3, 7.4**
    - Use `fc.array(fc.record({ title: fc.string(), totalAmount: fc.float({ min: 0.01 }), ... }))` of unpaid expenses
    - Tag: `// Feature: expense-tracker, Property 10: Rollover preserves fields and sets flag`

  - [x] 8.5 Write property test — Property 11: Rollover does not mutate originals
    - **Property 11: After `buildRolloverCopies`, the original expense objects SHALL remain unchanged**
    - **Validates: Requirements 7.5**
    - Deep-clone originals before calling helper; assert equality after
    - Tag: `// Feature: expense-tracker, Property 11: Rollover does not mutate originals`

  - [x] 8.6 Write property test — Property 12: Monthly summary calculation
    - **Property 12: For any non-empty set of expenses, `computeMonthlySummary` SHALL have `totalOwed = sum(totalAmount)`, `totalPaid = sum(amountPaid)`, and `progress = totalPaid / totalOwed`**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Use `fc.array(fc.record(...), { minLength: 1 })` of expense records
    - Tag: `// Feature: expense-tracker, Property 12: Monthly summary calculation`

  - [x] 8.7 Write property test — Property 13: Monthly summary empty state
    - **Property 13: For an empty expense array, `computeMonthlySummary` SHALL return `{ totalOwed: 0, totalPaid: 0, progress: 0 }`**
    - **Validates: Requirements 8.5**
    - Pass constant empty array `[]`
    - Tag: `// Feature: expense-tracker, Property 13: Monthly summary empty state`

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement SSR boundary components
  - [x] 10.1 Create `components/ExpenseAppShell.tsx` as a `'use client'` wrapper
    - Use `next/dynamic` to import `<ExpenseApp>` with `{ ssr: false }`
    - Include a loading fallback: centered `"Loading…"` text in `text-zinc-400`
    - This is the single SSR boundary; all Dexie/Zustand code lives inside it
    - _Requirements: 9.4_

  - [x] 10.2 Update `app/page.tsx` to render `<ExpenseAppShell />`
    - Keep `page.tsx` as a Server Component; import and render `<ExpenseAppShell />`
    - _Requirements: 9.4_

- [x] 11. Implement `<QuickAddInput>` component
  - [x] 11.1 Create `components/QuickAddInput.tsx`
    - Props: `onAdd: (expense: NewExpense) => Promise<void>`, `activeMonthKey: string`
    - Render a sticky input (`position: sticky, top-0, z-10`) with `autoFocus`
    - On Enter: call `parseQuickAdd(value)`; on success call `onAdd` then clear input and return focus; on failure display inline error below input
    - Use `focus-visible:ring-2 focus-visible:ring-green-500` focus ring
    - Apply `rounded-xl` to input; `transition-colors duration-150` on interactive elements
    - _Requirements: 1.1, 1.2, 1.6, 1.9, 1.10, 10.1, 10.2, 11.1, 11.9_

- [x] 12. Implement `<MonthNavigator>` component
  - [x] 12.1 Create `components/MonthNavigator.tsx`
    - Props: `activeMonthKey: string`, `onNavigate: (monthKey: string) => void`
    - Render prev (`←`) and next (`→`) buttons with `formatMonthKey` display label
    - Handle `ArrowLeft` / `ArrowRight` keyboard events on the navigator container
    - Apply `focus-visible` ring and `transition-colors duration-150` to buttons
    - _Requirements: 6.1, 6.2, 6.5, 10.3_

- [x] 13. Implement `<MonthlySummary>` component
  - [x] 13.1 Create `components/MonthlySummary.tsx`
    - Props: `expenses: Expense[]`
    - Compute `MonthlySummary` using `computeMonthlySummary` from `lib/expenseLogic.ts`
    - Display total owed, total paid, and an overall progress bar
    - Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`; fill with `bg-green-500`; `transition-[width] duration-300 ease-out motion-reduce:transition-none`
    - Show zero values and 0% bar when expenses array is empty
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.6_

- [x] 14. Implement `<RolloverButton>` component
  - [x] 14.1 Create `components/RolloverButton.tsx`
    - Props: `expenses: Expense[]`, `activeMonthKey: string`, `onRollover: () => Promise<void>`
    - Disable button and show tooltip/message when no unpaid expenses exist
    - Apply `focus-visible` ring and `transition-colors duration-150`
    - _Requirements: 7.1, 7.6_

- [x] 15. Implement `<PartialPaymentForm>` component
  - [x] 15.1 Create `components/PartialPaymentForm.tsx`
    - Props: `expense: Expense`, `onSubmit: (amount: number) => Promise<void>`, `onCancel: () => void`
    - Render inline number input; submit on Enter; cancel on Escape
    - Validate amount > 0; display inline error if not
    - Apply `focus-visible` ring; trap focus within form while open
    - _Requirements: 3.1, 3.4, 10.4, 10.5_

- [x] 16. Implement `<ExpenseCard>` component
  - [x] 16.1 Create `components/ExpenseCard.tsx`
    - Props: `expense: Expense`, `onPaymentSubmit: (amount: number) => Promise<void>`, `onPriorityChange: (priority: Priority) => Promise<void>`
    - Render card with `rounded-2xl`, `shadow-sm`, `border border-zinc-200`
    - Display title, total amount, progress bar (0–100%), priority badge (color + icon), category pill using `getCategoryColor`
    - Priority badges: High → `text-red-600 bg-red-50` + ArrowUp icon; Medium → `text-amber-600 bg-amber-50` + Minus icon; Low → `text-zinc-500 bg-zinc-100` + ArrowDown icon
    - Paid expenses: apply muted/strikethrough visual distinction
    - Rolled-over expenses: display "rolled over" badge
    - `tabIndex={0}`, `role="listitem"`; handle `onKeyDown` for `P` / `Enter` to open `<PartialPaymentForm>`, `Escape` to close
    - Show `<PartialPaymentForm>` inline when `openPaymentFormId === expense.id`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.4, 5.2, 10.3, 10.4, 10.5, 11.2, 11.3, 11.5, 11.6, 11.7, 11.8, 11.10_

- [x] 17. Implement `<ExpenseList>` component
  - [x] 17.1 Create `components/ExpenseList.tsx`
    - Props: `expenses: Expense[]`, `onPaymentSubmit: (id: number, amount: number) => Promise<void>`, `onPriorityChange: (id: number, priority: Priority) => Promise<void>`
    - Render `<ul role="list">` containing one `<ExpenseCard>` per expense
    - Pass per-card callbacks that bind the expense `id`
    - _Requirements: 2.1, 2.7_

- [x] 18. Implement `<ExpenseApp>` root component and wire everything together
  - [x] 18.1 Create `components/ExpenseApp.tsx` as a `'use client'` component
    - Import `db` from `lib/db.ts`; use `useLiveQuery` to reactively load expenses for `activeMonthKey`
    - Use `useExpenseStore` for `activeMonthKey`, `openPaymentFormId`, and their setters
    - Implement `handleAdd`: call `db.expenses.add({ ...expense, monthKey: activeMonthKey, createdAt: Date.now() })`
    - Implement `handlePayment(id, amount)`: read expense, call `applyPayment`, call `db.expenses.update(id, result)`
    - Implement `handlePriorityChange(id, priority)`: call `db.expenses.update(id, { priority })`
    - Implement `handleRollover`: query unpaid expenses for `activeMonthKey`, call `buildRolloverCopies`, call `db.expenses.bulkAdd`
    - Wrap Dexie instantiation in try/catch; render persistent warning banner if IndexedDB is unavailable
    - Compose `<QuickAddInput>`, `<MonthNavigator>`, `<MonthlySummary>`, `<RolloverButton>`, `<ExpenseList>` in layout order
    - Apply zinc/gray base palette; max two accent colors (violet-600, emerald-500)
    - _Requirements: 1.9, 6.2, 6.4, 7.2, 7.3, 7.4, 7.5, 8.4, 9.1, 9.2, 9.3, 9.5, 11.1, 11.4_

- [x] 19. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests (tasks 5.2–5.7, 6.2, 8.2–8.7) validate universal correctness properties using fast-check with a minimum of 100 iterations each
- Unit tests validate specific examples and edge cases
- The expense list is never stored in Zustand — always derived from Dexie via `useLiveQuery` to avoid double-source-of-truth bugs
- Read `node_modules/next/dist/docs/` before writing any Next.js code (see AGENTS.md)
