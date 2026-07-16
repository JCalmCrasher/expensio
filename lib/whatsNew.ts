/** Bump version + releasedAt when shipping user-facing changes. */
export const WHATS_NEW_VERSION = "2026-07-16.1";

/** ISO date (YYYY-MM-DD) when this What's New ship went out. */
export const WHATS_NEW_RELEASED_AT = "2026-07-16";

/** Auto-prompt only during this many days after release. Manual open still works anytime. */
export const WHATS_NEW_WINDOW_DAYS = 7;

export const WHATS_NEW_KEY = "expensio-whats-new-seen";
export const FIRST_OPEN_KEY = "expensio-first-open-at";

export type WhatsNewItem = {
  title: string;
  body: string;
};

/** Changelog shown in the What's New dialog. Replace items when bumping WHATS_NEW_VERSION. */
export const WHATS_NEW_ITEMS: WhatsNewItem[] = [
  {
    title: "Search popout",
    body: "Press / or tap Search for a focused search panel. The list stays visible underneath as results filter.",
  },
  {
    title: "Clearer payments",
    body: "Partial payments show how much you've paid and what's left. The Pay form expands inside the expense card.",
  },
  {
    title: "Command palette",
    body: "⌘K / Ctrl+K (or the ⌘ button on mobile) jumps to expenses, months, settings, and more.",
  },
];

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

function releaseStartMs(releasedAt: string = WHATS_NEW_RELEASED_AT): number {
  const { y, m, d } = parseYmd(releasedAt);
  return new Date(y, m - 1, d).getTime();
}

/** Previous calendar day as YYYY-MM-DD (local). */
export function previousDayYmd(ymd: string): string {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function toYmd(ms: number = Date.now()): string {
  const dt = new Date(ms);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function isWhatsNewWindowOpen(
  nowMs: number = Date.now(),
  {
    releasedAt = WHATS_NEW_RELEASED_AT,
    windowDays = WHATS_NEW_WINDOW_DAYS,
  }: { releasedAt?: string; windowDays?: number } = {},
): boolean {
  const start = releaseStartMs(releasedAt);
  const end = start + windowDays * 24 * 60 * 60 * 1000;
  return nowMs >= start && nowMs < end;
}

/**
 * Returning user for this release = first opened the app before the release day.
 * Brand-new installs on/after release day should not get the changelog prompt.
 */
export function isReturningUserForRelease(
  firstOpenAt: string | null,
  releasedAt: string = WHATS_NEW_RELEASED_AT,
): boolean {
  if (!firstOpenAt) return false;
  return releaseStartMs(firstOpenAt) < releaseStartMs(releasedAt);
}

/**
 * Decide what to store for first-open.
 * Existing users (tour done / have data) upgrading into this code get backdated
 * so they still qualify as "before this release".
 */
export function resolveFirstOpenAt(
  existing: string | null,
  knownReturning: boolean,
  {
    nowMs = Date.now(),
    releasedAt = WHATS_NEW_RELEASED_AT,
  }: { nowMs?: number; releasedAt?: string } = {},
): string {
  if (existing) return existing;
  if (knownReturning) return previousDayYmd(releasedAt);
  return toYmd(nowMs);
}

export function ensureFirstOpenAt(knownReturning: boolean): string {
  if (typeof window === "undefined") return toYmd();
  const next = resolveFirstOpenAt(localStorage.getItem(FIRST_OPEN_KEY), knownReturning);
  localStorage.setItem(FIRST_OPEN_KEY, next);
  return next;
}

export function hasSeenWhatsNew(version: string = WHATS_NEW_VERSION): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WHATS_NEW_KEY) === version;
}

export function shouldAutoShowWhatsNew(
  nowMs: number = Date.now(),
  {
    firstOpenAt = typeof window !== "undefined" ? localStorage.getItem(FIRST_OPEN_KEY) : null,
    seen = hasSeenWhatsNew(),
  }: { firstOpenAt?: string | null; seen?: boolean } = {},
): boolean {
  if (seen) return false;
  if (!isWhatsNewWindowOpen(nowMs)) return false;
  return isReturningUserForRelease(firstOpenAt);
}

export function markWhatsNewSeen(version: string = WHATS_NEW_VERSION): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WHATS_NEW_KEY, version);
}
