# Expensio

Local-first personal expense tracker. No account, no backend, your data stays in the browser via IndexedDB.

## Why this exists / How it's built differently

Most expense trackers require an account and sync to a server. 
Expensio runs entirely in the browser using IndexedDB via Dexie, 
with a virtualised list that handles 10k+ records at 60fps using 
TanStack Virtual's window virtualiser with dynamic row measurement 
and scroll margin correction.

- **Landing:** [(/)](http://localhost:3000)
- **App:** [(/app)](http://localhost:3000/app)

## Features

- **Quick add** - type expenses in plain text and press Enter (see [Quick add syntax](#quick-add-syntax))
- **Monthly view** - navigate by month; expenses can file to another month when the due date differs
- **Partial payments** - record payments inline on each expense card; list shows amount paid and remaining
- **Categories & budgets** - optional categories with per-month spending limits and warnings
- **Priority & status** - High / Medium / Low; paid / unpaid with amount-paid tracking
- **Notes** - optional notes via `note: …` in quick add or the edit modal
- **Dashboard charts** - category breakdown and paid vs unpaid by priority (filterable)
- **Rollover** - copy unpaid expenses into next month
- **Import / export** - JSON and CSV from the **⋯ data menu** (top bar)
- **Appearance** - light / dark / system theme and accent colors (⋯ menu → Appearance)
- **Search popout** - `/` or Search opens a soft-scrim search panel; the filtered list stays visible underneath
- **Command palette** - `⌘K` / `Ctrl+K` (or ⌘ button on mobile): search expenses, navigate months, settings, What's new
- **Keyboard shortcuts** - `N` quick-add, `/` search, `Alt+←/→` change month (desktop)
- **What's new** - changelog for returning users after a release (see [What's new](#whats-new))
- **Onboarding tour** - first-run guided tour (driver.js); help icon or command palette to replay
- **Notifications** - due-date reminders and weekly digest (Settings)
- **Recurring templates** - save monthly bills; one-tap add to a new month
- **Receipt scan** - OCR prefill via Tesseract.js (client-side)
- **Multi-currency display** - switch symbol in the app bar (stored in local state)
- **PWA** - installable; offline-friendly in production (service worker disabled in dev)
- **Undo delete** - restore a deleted expense from the toast action
- **Large months** - paginated Dexie reads + window virtualization (skeletons while loading)

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

IndexedDB schema: `[lib/db.ts](lib/db.ts)` — tables `expenses`, `categories`, `settings`, `templates` (Dexie v5).

Business rules (payments, rollover, summaries): `[lib/expenseLogic.ts](lib/expenseLogic.ts)`.

Large months use **paginated loading** (50 rows at a time) and **virtual scrolling** in the list — see [ARCHITECTURE.md](ARCHITECTURE.md#421-list-performance).

## Import & export

**⋯ menu** (top bar) → **Export JSON/CSV** or **Import expenses**.

1. Export/import logic: `[lib/exportImport.ts](lib/exportImport.ts)`
2. UI: `[components/ImportModal.tsx](components/ImportModal.tsx)`
3. CSV columns include `note`; JSON uses `{ version: 1, expenses: [...] }`
4. Limits: 10k records per import, 5 MB file size (sanitized fields)

UI components are added via [shadcn CLI](https://ui.shadcn.com/docs/cli) (`components.json` → style **base-nova**).

## Keyboard shortcuts (desktop)

| Shortcut | Action |
| -------- | ------ |
| `⌘K` / `Ctrl+K` | Open command palette |
| `N` | Focus quick-add |
| `/` | Open search popout |
| `Alt + ←` / `Alt + →` | Previous / next month |

On mobile, use the **⌘** button in the header for the same command palette (no hardware shortcuts). Search uses the search icon → same soft-scrim popout.

Handlers live in `[hooks/useAppShortcuts.ts](hooks/useAppShortcuts.ts)`; labels use `[lib/keyboard.ts](lib/keyboard.ts)`.

## What's new

Returning users may see a **What's new** changelog dialog after a release. It is **not** the driver.js onboarding tour.

| Rule | Detail |
| ---- | ------ |
| Audience | Returning users only (`expensio-first-open-at` **before** the release day) |
| Window | Auto-prompt for **`WHATS_NEW_WINDOW_DAYS`** (currently **7 days**) from `WHATS_NEW_RELEASED_AT` |
| Current ship | Released **2026-07-16** → auto-prompt through **2026-07-22** (expires local midnight **2026-07-23**) |
| Seen flag | `expensio-whats-new-seen` = `WHATS_NEW_VERSION` after dismiss |
| Conflicts | Never auto-opens while the onboarding tour is running |
| Manual | Command palette → **What's new** (anytime) |

Config and copy: `[lib/whatsNew.ts](lib/whatsNew.ts)`. UI: `[components/WhatsNewDialog.tsx](components/WhatsNewDialog.tsx)`.

When shipping again, bump `WHATS_NEW_VERSION`, `WHATS_NEW_RELEASED_AT`, and replace `WHATS_NEW_ITEMS`.

## Dev benchmark (local only)

In development, the app exposes `window.expensio` helpers:

```js
await expensio.seed(10000)                        // spread across 12 months
await expensio.seed(10000, "july 2026")           // one month only
await expensio.seed(10000, ["june 2026", "july 2026"])
await expensio.clear()
await expensio.count()
```

## Configuration

- **Next.js:** `[next.config.ts](next.config.ts)` - PWA wrapper; Turbopack in dev
- **TypeScript:** `[tsconfig.json](tsconfig.json)` - path alias `@/`\*
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

## Documentation

- [Architecture](ARCHITECTURE.md) — system design and data flows
- [Product Requirements](PRD.md) — features, goals, and roadmap

## License

[MIT](LICENSE)
