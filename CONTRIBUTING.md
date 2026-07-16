# Contributing to Expensio

Thanks for helping improve Expensio. This guide covers how to set up the project, the conventions we follow, and how to open a useful pull request.

## Before you start

- Read [README.md](README.md) for product overview and scripts.
- Skim [ARCHITECTURE.md](ARCHITECTURE.md) if your change touches data flow, IndexedDB, or the expense list.
- Prefer small, focused PRs over large mixed ones.

## Requirements

- **Node.js** 20+ (22+ recommended)
- **pnpm** (this repo uses `pnpm-lock.yaml`)

```bash
pnpm install
pnpm dev
```

App: [http://localhost:3000/app](http://localhost:3000/app)

## Development workflow

1. Fork and clone the repo (or create a branch if you have write access).
2. Create a branch from `main`: `git checkout -b feat/short-description`.
3. Make your change.
4. Run checks locally (see below).
5. Open a pull request with a short summary and test notes.

### Useful commands

| Command | Purpose |
| ------- | ------- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm lint` | ESLint |
| `pnpm format` | Format with Biome |
| `pnpm check` | Biome check + auto-fix |
| `pnpm build` | Production build |

Before opening a PR, at least run:

```bash
pnpm test
pnpm lint
pnpm build
```

## Project conventions

### Architecture

- **Local-first** — no backend/auth required for core tracking. Prefer IndexedDB (Dexie) over introducing a server unless the change is explicitly about optional sync/hosting.
- **Logic in `lib/`** — parsing, payments, month keys, import/export, and queries should be testable without React.
- **UI in `components/`** — keep orchestration in `ExpenseApp`; extract leaf UI when a section grows (e.g. `AppTopBar`).
- **Next.js** — this project may differ from older Next.js docs. Check `node_modules/next/dist/docs/` when using unfamiliar APIs.

### Code style

- TypeScript; match existing naming and file layout.
- Use existing UI primitives in `components/ui/` (shadcn / Base UI) before adding new ones.
- Prefer semantic theme tokens (`bg-card`, `text-muted-foreground`, etc.) so light/dark mode keep working.
- Don’t commit secrets, `.env` files with credentials, or large generated dumps.
- Don’t commit `.next/` or other build artifacts.

### Tests

- Add or update Vitest tests under `lib/__tests__/` (or colocated `*.test.ts`) when changing pure logic.
- UI-only tweaks don’t always need tests; behavior changes in `lib/` usually do.

### Product UX notes

- **Onboarding tour** (`AppTour` / driver.js) and **What’s new** (`WhatsNewDialog`) are separate. Don’t auto-open both at once.
- When shipping user-facing changes for returning users, update `lib/whatsNew.ts` (`WHATS_NEW_VERSION`, `WHATS_NEW_RELEASED_AT`, `WHATS_NEW_ITEMS`).
- Keyboard shortcuts live in `hooks/useAppShortcuts.ts`; mirror labels in `AppCommandMenu` when you add one.

### Dev seeding

In development only, `window.expensio` can seed large datasets for list performance testing. See README → Dev benchmark. Don’t rely on seed data in unit tests unless the test sets up its own DB fixtures.

## Pull requests

A good PR description includes:

1. **What** changed (1–3 bullets).
2. **Why** (bug, UX, perf, docs).
3. **How to test** (steps, shortcuts, mobile/desktop if relevant).

Keep the PR scoped. Doc-only and code changes can be separate when that makes review easier.

## Reporting issues

Include:

- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors if any
- Whether it happens with a fresh profile / empty IndexedDB

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
