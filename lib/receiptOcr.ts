/** Parse raw OCR text into quick-add fields (amount + merchant). */

export type ReceiptParseResult = {
  amount: number | null;
  merchant: string | null;
  quickAddLine: string | null;
};

const TOTAL_HINT =
  /\b(?:grand\s*)?total|amount\s*due|balance\s*due|total\s*due|total\s*amount|amt\s*due/i;
const SKIP_MERCHANT =
  /^(receipt|invoice|tax\s*invoice|welcome|thank\s*you|tel|phone|fax|www\.|http|date|time|cashier|server|table|#\d)/i;

function parseNumber(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (Number.isNaN(n) || n < 0.01 || n > 1_000_000) return null;
  return n;
}

function scoreLine(line: string): number {
  const lower = line.toLowerCase();
  let score = 0;
  if (TOTAL_HINT.test(line)) score += 4;
  if (/\b(?:sub\s*)?total\b/i.test(line) && !/subtotal/i.test(lower)) score += 2;
  if (/\b(?:tax|vat|tip|change|discount)\b/i.test(line) && !TOTAL_HINT.test(line)) score -= 1;
  if (/[£$₦€]/.test(line)) score += 2;
  return score;
}

function looksLikeNoiseAmount(value: number, raw: string): boolean {
  if (/[.,]/.test(raw)) return false;
  if (value >= 1900 && value <= 2100) return true;
  // Single-digit values are usually qty/line noise, not the total
  if (value >= 0 && value <= 9 && raw.length === 1) return true;
  return false;
}

function extractAmountsFromLine(line: string, lineScore: number): { value: number; score: number }[] {
  const found: { value: number; score: number }[] = [];

  for (const m of line.matchAll(/[£$₦€]\s*([\d,]+\.?\d*)/g)) {
    const v = parseNumber(m[1]);
    if (v != null) found.push({ value: v, score: lineScore + 3 });
  }

  for (const m of line.matchAll(/\b([\d,]+\.\d{2})\b/g)) {
    const v = parseNumber(m[1]);
    if (v != null) found.push({ value: v, score: lineScore + 1 });
  }

  for (const m of line.matchAll(
    /(?:total|amount|due|balance)[:\s]*(?:[£$₦€])?\s*([\d,]+\.?\d*)/gi,
  )) {
    const v = parseNumber(m[1]);
    if (v != null) found.push({ value: v, score: lineScore + 5 });
  }

  // Plain amounts (e.g. "food 50", handwritten notes without decimals)
  for (const m of line.matchAll(/\b(\d{1,7}(?:,\d{3})*(?:\.\d{1,2})?)\b/g)) {
    const raw = m[1];
    const v = parseNumber(raw);
    if (v == null || looksLikeNoiseAmount(v, raw)) continue;
    let score = lineScore;
    if (/\.\d{2}$/.test(raw)) score += 1;
    found.push({ value: v, score });
  }

  return found;
}

/** Build a quick-add title from informal OCR (e.g. "food 50 from iya basira"). */
function buildTitleFromText(text: string, amount: number): string {
  const amountPattern = new RegExp(
    String.raw`(?:[£$₦€]\s*)?\b${amount}(?:\.\d{1,2})?\b`,
    "g",
  );
  const title = text
    .replace(amountPattern, " ")
    .replace(/\s+/g, " ")
    .trim();
  return title || "Receipt";
}

function extractMerchantFromText(text: string): string | null {
  const fromMatch = text.match(/\bfrom\s+([a-zA-Z][a-zA-Z\s'.-]{1,60})/i);
  if (fromMatch) {
    return fromMatch[1].replace(/\s+/g, " ").trim();
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 10)) {
    if (line.length < 3 || line.length > 72) continue;
    if (/^[\d\s.\-,/]+$/.test(line)) continue;
    if (SKIP_MERCHANT.test(line)) continue;
    if (!/[a-zA-Z]{2,}/.test(line)) continue;
    if (/[£$₦€]\s*[\d,]/.test(line) && line.length < 20) continue;
    return line
      .replace(/[^\w\s&'.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }
  return null;
}

export function parseReceiptOcrText(text: string): ReceiptParseResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates: { value: number; score: number }[] = [];
  const linesToScan = lines.length > 0 ? lines : normalized ? [normalized] : [];
  for (const line of linesToScan) {
    const lineScore = scoreLine(line);
    candidates.push(...extractAmountsFromLine(line, lineScore));
  }

  let amount: number | null = null;
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score || b.value - a.value);
    amount = candidates[0].value;
  }

  const merchant = extractMerchantFromText(text);

  if (amount == null) {
    return { amount: null, merchant, quickAddLine: null };
  }

  const isInformalNote = lines.length <= 1;
  const title = isInformalNote
    ? buildTitleFromText(normalized, amount)
    : merchant || buildTitleFromText(normalized, amount);

  return {
    amount,
    merchant,
    quickAddLine: `${title} ${amount}`,
  };
}
