// lib/monthKey.ts

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return toMonthKey(new Date());
}

export function nextMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month); // month is 0-indexed; month+1 wraps correctly
  return toMonthKey(d);
}

export function prevMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 2);
  return toMonthKey(d);
}

export function formatMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

/** Parse "july 2026", "July 2026", or "2026-07" into a month key. */
export function parseMonthLabel(label: string): string {
  const trimmed = label.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [year, month] = trimmed.split("-").map(Number);
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month key: "${label}"`);
    }
    return trimmed;
  }

  const match = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid month label: "${label}". Use "july 2026" or "2026-07".`);
  }

  const parsed = new Date(`${match[1]} 1, ${match[2]}`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid month label: "${label}"`);
  }

  return toMonthKey(parsed);
}

export function parseMonthLabels(labels: string | string[]): string[] {
  const list = Array.isArray(labels) ? labels : [labels];
  return list.map(parseMonthLabel);
}
