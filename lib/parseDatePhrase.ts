/** Parse short date phrases for quick-add (local midnight). */

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseIsoDate(phrase: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(phrase)) return null;
  const [year, month, day] = phrase.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function nextWeekday(dayIndex: number, ref: Date): number {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const diff = (dayIndex - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d.getTime();
}

/** @param refDate ms timestamp used as "today" (defaults to now) */
export function parseDatePhrase(phrase: string, refDate = Date.now()): number | null {
  const raw = phrase.trim().toLowerCase();
  if (!raw) return null;

  const iso = parseIsoDate(raw);
  if (iso != null) return iso;

  const today = startOfDay(refDate);

  if (raw === "today") return today;
  if (raw === "tomorrow") return today + 86_400_000;
  if (raw === "yesterday") return today - 86_400_000;
  if (raw === "next week") return today + 7 * 86_400_000;

  const dayIndex = DAY_NAMES.indexOf(raw);
  if (dayIndex >= 0) {
    return nextWeekday(dayIndex, new Date(refDate));
  }

  return null;
}
