# Expensio — Product Requirements Document

> **Product:** Expensio  
> **Version:** 0.1.x (as-built)  
> **Status:** Live / actively developed  
> **Last updated:** June 2025

---

## 1. Executive Summary

**Expensio** is a local-first personal expense tracker delivered as a Progressive Web App (PWA). Users track monthly expenses, record partial payments, set priorities and due dates, and gain spending insights — all without creating an account or sending financial data to a server.

The product optimizes for **speed of entry** (quick-add text syntax, receipt scanning), **monthly budgeting workflows** (rollover, category limits, summaries), and **privacy** (data stays in the browser).

---

## 2. Problem Statement

Personal expense tracking tools often require:

- Account creation and cloud storage of sensitive financial data
- Slow, form-heavy data entry for everyday purchases
- Poor offline support on mobile
- Complex setup before capturing a single expense

**Expensio** solves this by offering a zero-signup, offline-capable tracker where a user can type `Coffee 4.50` and press Enter to log an expense in under two seconds.

---

## 3. Target Users

| Persona | Needs | How Expensio helps |
|---------|-------|-------------------|
| **Everyday budgeter** | Track daily spending by month | Quick add, monthly view, category breakdown |
| **Bill manager** | Track recurring bills with due dates | Due dates, partial payments, rollover, reminders |
| **Privacy-conscious user** | Keep finances off the cloud | Local-first IndexedDB, no backend |
| **Mobile user** | Log expenses on the go | PWA install, responsive UI, receipt scan |
| **Power user / migrator** | Import existing spreadsheets | JSON/CSV/TSV bulk import with preview |

### Non-target users (v1)

- Teams or shared household budgets
- Business accounting / tax reporting
- Multi-device real-time sync
- Investment or net-worth tracking

---

## 4. Product Goals

### Primary goals

1. **Fast expense capture** — minimize taps and form fields for common cases
2. **Monthly clarity** — show what is owed, paid, and remaining at a glance
3. **Data ownership** — user controls data via export; nothing leaves the device by default
4. **Reliable offline use** — core tracking works without network after initial load

### Secondary goals

5. **Actionable reminders** — due-date and weekly digest notifications (opt-in)
6. **Data portability** — import/export for backup and migration
7. **Discoverability** — onboarding tour for first-time users

### Non-goals (explicit)

- User authentication or cloud accounts
- Server-side storage or API
- Real-time multi-device sync
- Bank / card integrations
- Multi-currency conversion (display symbol only, no FX rates)
- Excel `.xlsx` binary import

---

## 5. Feature Inventory (Current)

### 5.1 Expense Management

| Feature | Description | Status |
|---------|-------------|--------|
| Quick add | Plain-text entry: `Title Amount [paid] [priority] [note: …]` | ✅ Shipped |
| Manual edit | Full modal: title, amounts, status, priority, category, due date, note | ✅ Shipped |
| Delete with undo | Toast action restores deleted expense | ✅ Shipped |
| Partial payments | Incremental payments update progress and status | ✅ Shipped |
| Search | Filter expenses in active month by title | ✅ Shipped |
| Priority | High / Medium / Low with keyword aliases | ✅ Shipped |
| Notes | Optional free-text notes | ✅ Shipped |
| Due dates | Optional; expense may file to due-date month | ✅ Shipped |

### 5.2 Monthly Workflow

| Feature | Description | Status |
|---------|-------------|--------|
| Month navigation | Browse expenses by `YYYY-MM` | ✅ Shipped |
| Monthly summary | Total owed, paid, progress bar | ✅ Shipped |
| Stats bar | Count of paid/unpaid, high-priority items | ✅ Shipped |
| Rollover | Copy unpaid expenses to next month | ✅ Shipped |
| Rolled-over indicator | Visual flag on copied expenses | ✅ Shipped |

### 5.3 Categories & Budgets

| Feature | Description | Status |
|---------|-------------|--------|
| Free-text categories | Combobox with create-on-type | ✅ Shipped |
| Category budget | Optional `maxAmount` per category per month | ✅ Shipped |
| Budget warning | Visual alert when category spend exceeds limit | ✅ Shipped |
| Auto-create on import | New categories from import get `maxAmount: 0` | ✅ Shipped |

### 5.4 Insights & Visualization

| Feature | Description | Status |
|---------|-------------|--------|
| Category breakdown chart | Pie/bar by category spend | ✅ Shipped |
| Priority chart | Paid vs unpaid by priority | ✅ Shipped |
| Filterable dashboard | Insights modal with chart filters | ✅ Shipped |

### 5.5 Data Portability

| Feature | Description | Status |
|---------|-------------|--------|
| Export JSON | Full expense dump with version header | ✅ Shipped |
| Export CSV | Standard column set | ✅ Shipped |
| Import JSON / CSV / TSV | File upload or paste | ✅ Shipped |
| Import preview | Review up to 50 rows before commit | ✅ Shipped |
| Import modes | Append, replace-month, replace-all | ✅ Shipped |
| Template download | CSV template from import modal | ✅ Shipped |

### 5.6 Receipt Scanning

| Feature | Description | Status |
|---------|-------------|--------|
| Image upload | Camera roll or file picker | ✅ Shipped |
| OCR (Tesseract.js) | Client-side text extraction | ✅ Shipped |
| Single-expense prefill | Amount + merchant → quick-add line | ✅ Shipped |
| Multi-line import | ≥ 2 line items → review modal → bulk add | ✅ Shipped |

### 5.7 Notifications (opt-in)

| Feature | Description | Status |
|---------|-------------|--------|
| Due-date reminders | Today and overdue alerts | ✅ Shipped |
| Weekly digest | Summary of unpaid expenses | ✅ Shipped |
| Permission flow | Request + settings toggle | ✅ Shipped |
| Background delivery | Service worker periodic sync | ✅ Shipped (browser-dependent) |
| Foreground fallback | 6-hour poll while app open | ✅ Shipped |

### 5.8 Platform & UX

| Feature | Description | Status |
|---------|-------------|--------|
| PWA install | Add to home screen | ✅ Shipped |
| Offline static assets | Service worker caching | ✅ Shipped (production) |
| Multi-currency display | USD / NGN symbol toggle | ✅ Shipped |
| Onboarding tour | First-run guided tour | ✅ Shipped |
| Landing page | Marketing site at `/` | ✅ Shipped |
| Dark/light theming | Via `next-themes` | ✅ Shipped |

---

## 6. User Stories

### Core tracking

> **As a** daily spender,  
> **I want to** type an expense in plain English and press Enter,  
> **So that** I can log purchases in seconds without opening a form.

> **As a** bill payer,  
> **I want to** record partial payments against an expense,  
> **So that** I can track progress toward fully paid status.

> **As a** monthly planner,  
> **I want to** see total owed vs paid for the current month,  
> **So that** I know how much budget remains.

### Monthly workflow

> **As a** user starting a new month,  
> **I want to** roll unpaid expenses into the next month,  
> **So that** I don't lose track of outstanding bills.

> **As a** user with a due date on an expense,  
> **I want** the expense filed to the correct month automatically,  
> **So that** my monthly view matches when bills are actually due.

### Data & privacy

> **As a** privacy-conscious user,  
> **I want** my data stored only in my browser,  
> **So that** no company has access to my spending history.

> **As a** user switching devices,  
> **I want to** export my data as JSON or CSV,  
> **So that** I can import it on another browser.

### Receipts & bulk data

> **As a** user with a paper receipt,  
> **I want to** photograph it and have the amount extracted,  
> **So that** I don't have to type the total manually.

> **As a** user migrating from a spreadsheet,  
> **I want to** import hundreds of rows with a preview step,  
> **So that** I can verify data before it's saved.

### Reminders

> **As a** user with upcoming bills,  
> **I want to** receive a notification on the due date,  
> **So that** I don't miss a payment.

---

## 7. Functional Requirements

### 7.1 Quick Add Syntax

| Input token | Effect |
|-------------|--------|
| `<number>` | Sets `totalAmount` (last numeric token wins) |
| `paid` / `unpaid` | Sets status; `paid` sets `amountPaid = totalAmount` |
| `high`, `urgent`, `asap` | Priority: High |
| `medium`, `normal`, `mid` | Priority: Medium |
| `low`, `later`, `minor` | Priority: Low |
| `note: <text>` | Sets optional note (max 500 chars) |

**Validation:** Title required (non-empty after token removal), amount > 0.

### 7.2 Expense Record Rules

- `totalAmount` must be > 0
- `amountPaid` must be in `[0, totalAmount]`
- `status` becomes `"paid"` when `amountPaid >= totalAmount`
- `monthKey` format: `YYYY-MM`
- `createdAt` set automatically on insert (Unix ms)
- Payments must be > 0; throws otherwise

### 7.3 Import Rules

| Constraint | Value |
|------------|-------|
| Max records per import | 10,000 |
| Max file size | 5 MB |
| Max field length (title, category, note) | 500 chars |
| Default `monthKey` when missing | User's active month in UI |
| JSON format | `{ "version": 1, "expenses": [...] }` |

**Import modes:**

- **Append** — add valid rows to existing data
- **Replace month** — delete all expenses for each `monthKey` in payload, then insert
- **Replace all** — clear entire `expenses` table (requires explicit confirmation)

### 7.4 Export Rules

- JSON includes `version`, `expenses`, `exportedAt`
- CSV columns: `title, totalAmount, amountPaid, status, priority, category, monthKey, dueDate, rolledOver, note`

### 7.5 Notification Rules

- Disabled by default; user must enable in settings
- Due reminders: once per expense per due-day (de-duped via `notifiedDueKeys`)
- Weekly digest: at most once per 7 days
- Notifications require browser permission + service worker

---

## 8. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Performance** | Quick add → visible in list < 200ms (local DB) |
| **Import performance** | 100+ records in < 3 seconds |
| **Offline** | App shell and cached assets work offline (production PWA) |
| **Privacy** | No expense data sent to server |
| **Accessibility** | Keyboard-navigable forms; ARIA labels on icon buttons |
| **Mobile** | Responsive layout; drawer modals on small screens |
| **Browser support** | Modern Chromium, Safari, Firefox (IndexedDB + SW required) |
| **Bundle** | OCR loaded on demand (dynamic import) |

---

## 9. Data Model

See `types/expense.ts` for canonical definitions.

### Expense (core entity)

```
title, totalAmount, amountPaid, status, priority,
category, monthKey, rolledOver, createdAt, dueDate?, note?
```

### Category

```
name (unique), maxAmount (budget cap; 0 = unlimited)
```

### NotificationSettings (singleton)

```
enabled, dueReminders, weeklyDigest, currency,
lastWeeklyDigestAt, lastDueCheckAt, notifiedDueKeys[]
```

---

## 10. User Flows

### 10.1 First visit

```
Landing (/) → "Open app" → /app
  → DB init check
  → Onboarding tour (if first visit)
  → Empty month view + quick-add prompt
```

### 10.2 Daily logging

```
/app → Quick-add field → type + Enter
  → Parser validates
  → Expense added to active month (or due-date month)
  → List + summary update via live query
  → Toast confirmation
```

### 10.3 End of month

```
/app → Review unpaid expenses
  → Rollover button → copies to next month
  → Navigate to next month
  → Continue logging / paying
```

### 10.4 Backup

```
Sidebar → Export JSON or CSV → file download
  (store securely — contains all financial data)
```

---

## 11. Success Metrics

| Metric | Definition | Measurement |
|--------|------------|-------------|
| Time to first expense | Seconds from `/app` load to first add | Manual / analytics timing |
| Quick-add adoption | % of expenses created via quick-add vs modal | Client event (future) |
| Retention | Return visits within 7 days | PWA analytics (future) |
| Import success rate | Imports completed without errors / total attempts | Error logging (future) |
| Notification opt-in | % of users enabling notifications | Settings read (future) |
| PWA install rate | Installs / unique visitors | Analytics (future) |

*Note: v0.1.x has minimal product analytics (Vercel page views only). Instrumentation is a future enhancement.*

---

## 12. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No cloud sync | Data is per-browser/device | Export/import |
| No auth | Anyone with device access sees data | Device lock |
| OCR accuracy varies | Receipt scan may misread amounts | Manual edit in quick-add |
| Periodic sync browser-gated | Background notifications may not fire on all browsers | Foreground polling |
| Currency is display-only | No FX conversion | User picks USD or NGN symbol |
| IndexedDB quota | Very large datasets may hit browser limits | Export and archive old months |
| SW disabled in dev | Offline behavior only testable in production build | `pnpm build && pnpm start` |

---

## 13. Future Roadmap (Not Yet Built)

Prioritized from existing planning docs and natural extensions:

### Near-term

- [ ] Duplicate detection on import (merge by title + amount)
- [ ] Import categories with custom `maxAmount`
- [ ] Product analytics events (privacy-preserving, local or aggregate)
- [ ] Improved OCR for non-English receipts

### Medium-term

- [ ] Optional encrypted cloud backup (user-controlled)
- [ ] Recurring expense templates
- [ ] Custom category colors (user-assigned)
- [ ] Additional currency display options

### Long-term / out of v1 scope

- [ ] Multi-device sync
- [ ] Shared / household budgets
- [ ] Bank statement import
- [ ] Native mobile apps (iOS / Android)

---

## 14. Competitive Positioning

| Dimension | Expensio | Typical cloud tracker |
|-----------|----------|----------------------|
| Sign-up | None | Required |
| Data location | Browser (IndexedDB) | Provider cloud |
| Offline | Yes (PWA) | Often limited |
| Entry speed | Quick-add text | Form-based |
| Price | Free (self-hosted / Vercel) | Freemium / subscription |
| Receipt scan | On-device OCR | Often server-side |
| Multi-device | Manual export/import | Automatic sync |

**Positioning statement:** *Expensio is the fastest way to track personal expenses without giving up ownership of your data.*

---

## 15. Release & Deployment

| Environment | Command | Notes |
|-------------|---------|-------|
| Development | `pnpm dev` | SW disabled, Turbopack |
| Production | `pnpm build && pnpm start` | PWA assets generated |
| Hosting | Vercel (recommended) | Static + SSR shell |

Data migrations: Dexie schema versioning in `lib/db.ts`. Bump version + `upgrade()` handler for schema changes.

---

## 16. Acceptance Criteria (Product-Level)

A release is considered successful when:

- [ ] User can add, edit, pay, and delete expenses without errors
- [ ] Monthly summary and charts reflect DB state in real time
- [ ] Export → clear browser data → import restores all expenses
- [ ] PWA installs and loads offline after first visit (production)
- [ ] Receipt scan prefills or imports at least one valid expense from a clear photo
- [ ] Notifications fire for due-date expenses when enabled and permitted
- [ ] `pnpm test`, `pnpm lint`, and `pnpm build` pass in CI

---

## 17. Glossary

| Term | Definition |
|------|------------|
| **monthKey** | String `YYYY-MM` identifying which month an expense belongs to |
| **Quick add** | Text-based expense entry using space-separated tokens |
| **Rollover** | Copy unpaid expenses from one month to the next as new records |
| **Local-first** | Primary data store is on-device; network is optional |
| **PWA** | Progressive Web App — installable web app with service worker |
| **Partial payment** | Incremental payment that updates `amountPaid` without requiring full amount |

---

## 18. References

| Document | Purpose |
|----------|---------|
| `README.md` | Developer setup and quick-add syntax |
| `ARCHITECTURE.md` | System design and data flows |
| `PLAN.md` | Bulk import enhancement spec (mostly implemented) |
| `types/expense.ts` | Canonical data types |
| `lib/db.ts` | IndexedDB schema |

---

*This PRD describes the product as built in v0.1.x. Update it when shipping features from the roadmap or changing core behavior.*
