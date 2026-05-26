# Expensio

Local-first personal expense tracker. No account, no backend, your data stays in the browser via IndexedDB.

- **Landing:** [(/)](http://localhost:3000)
- **App:** [(/app)](http://localhost:3000/app)

## Preview
https://github.com/user-attachments/assets/d2cf4fb6-6369-4412-a663-e0394049ec2c

## Features
- **Quick add** - type expenses in plain text and press Enter (see [Quick add syntax](#quick-add-syntax))
- **Monthly view** - navigate by month; expenses can file to another month when the due date differs
- **Partial payments** - record payments; progress bars and status update automatically
- **Categories & budgets** - optional categories with per-month spending limits and warnings
- **Priority & status** - High / Medium / Low; paid / unpaid with amount-paid tracking
- **Notes** - optional notes via `note: …` in quick add or the edit modal
- **Dashboard charts** - category breakdown and paid vs unpaid by priority (filterable)
- **Rollover** - copy unpaid expenses into the next month
- **Import / export** - JSON and CSV from the sidebar
- **Multi-currency display** - switch symbol in the app bar (stored in local state)
- **PWA** - installable; offline-friendly in production (service worker disabled in dev)
- **Undo delete** - restore a deleted expense from the toast action

## Tech stack


| Layer     | Choice                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router)                                                                                       |
| UI        | React 19, [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (base-nova), [Base UI](https://base-ui.com) |
| Storage   | [Dexie](https://dexie.org) (IndexedDB)                                                                                              |
| State     | [Zustand](https://zustand.docs.pmnd.rs)                                                                                             |
| Charts    | [Recharts](https://recharts.org)                                                                                                    |
| Toasts    | [Sonner](https://sonner.emilkowal.ski)                                                                                              |
| PWA       | [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)                                                                        |
| Tooling   | TypeScript, ESLint, [Biome](https://biomejs.dev), [Vitest](https://vitest.dev)                                                      |


## Requirements

- **Node.js** 20+ (22+ recommended for `NODE_OPTIONS=--use-system-ca` if you hit npm TLS issues on Windows)
- **pnpm** (lockfile is `pnpm-lock.yaml`)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and use **Open app** to reach the tracker.

### Scripts

From `[package.json](package.json)`:


| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Start dev server (Turbopack)                   |
| `pnpm build`        | Production build                               |
| `pnpm start`        | Run production server                          |
| `pnpm lint`         | ESLint                                         |
| `pnpm test`         | Vitest (e.g. `lib/__tests__/monthKey.test.ts`) |
| `pnpm format`       | Biome format (write)                           |
| `pnpm format:check` | Biome format (check only)                      |
| `pnpm check`        | Biome check + auto-fix                         |


## Quick add syntax

Type in the quick-add field and press **Enter**. Tokens are space-separated.


| Input                              | Effect                                   |
| ---------------------------------- | ---------------------------------------- |
| `Coffee 4.50`                      | Title + amount (unpaid, Medium priority) |
| `Rent 1200 paid`                   | Marked paid; `amountPaid` = total        |
| `Gym 50 high`                      | High priority                            |
| `Netflix 15 low`                   | Low priority                             |
| `Coffee 4.50 note: oat milk latte` | Optional note (everything after `note:`) |


Priority aliases include `urgent`, `asap` → High; `normal`, `mid` → Medium; `later`, `minor` → Low.

Parsing lives in `[lib/parser.ts](lib/parser.ts)`.

## Data model

Defined in `[types/expense.ts](types/expense.ts)`. Core fields:

- `title`, `totalAmount`, `amountPaid`, `status`, `priority`
- `category`, `monthKey` (`YYYY-MM`), `dueDate`, `note`
- `rolledOver`, `createdAt`

IndexedDB schema: `[lib/db.ts](lib/db.ts)` - tables `expenses` and `categories`.

Business rules (payments, rollover, summaries): `[lib/expenseLogic.ts](lib/expenseLogic.ts)`.

## Import & export

Sidebar → **Export as JSON/CSV** or **Import expenses**.

1. Export/import logic: `[lib/exportImport.ts](lib/exportImport.ts)`
2. UI: `[components/ImportModal.tsx](components/ImportModal.tsx)`
3. CSV columns include `note`; JSON uses `{ version: 1, expenses: [...] }`
4. Limits: 10k records per import, 5 MB file size (sanitized fields)

## Project structure

```
app/
  page.tsx          # Landing (Expensio marketing)
  app/page.tsx      # Main expense app shell
  layout.tsx        # Root layout, fonts, analytics
  manifest.ts       # PWA manifest
components/
  ExpenseApp.tsx    # Main app layout & handlers
  QuickAddInput.tsx
  ExpenseList.tsx / ExpenseCard.tsx
  EditExpenseModal.tsx
  ExpenseCharts.tsx
  AppSidebar.tsx    # Nav, import/export
  ui/               # shadcn components
lib/
  db.ts             # Dexie database
  parser.ts         # Quick-add parser
  exportImport.ts
  expenseLogic.ts
  monthKey.ts
store/
  useExpenseStore.ts  # Month, currency, UI state
types/
  expense.ts
```

UI components are added via [shadcn CLI](https://ui.shadcn.com/docs/cli) (`components.json` → style **base-nova**).

## Configuration

- **Next.js:** `[next.config.ts](next.config.ts)` - PWA wrapper; Turbopack in dev
- **TypeScript:** `[tsconfig.json](tsconfig.json)` - path alias `@/`*
- **Lint/format:** `[eslint.config.mjs](eslint.config.mjs)`, `[biome.json](biome.json)`

### npm / pnpm on Windows

If `pnpm install` or `pnpm dlx` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, this repo includes `[.npmrc](.npmrc)` with TLS workarounds. Prefer setting `NODE_OPTIONS=--use-system-ca` in your user environment (Node 22+) and removing `strict-ssl=false` when possible.

## Deploy

Standard Next.js deployment (e.g. [Vercel](https://vercel.com)). The app is client-heavy; persistence is per-browser IndexedDB - not shared across devices unless the user exports/imports data.

Build:

```bash
pnpm build
pnpm start
```

PWA assets are generated into `public/` on production build (disabled when `NODE_ENV=development`).

## License

[MIT](LICENSE)
