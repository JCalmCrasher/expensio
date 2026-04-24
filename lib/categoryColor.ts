// lib/categoryColor.ts

const CATEGORY_PALETTE = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getCategoryColor(label: string): string {
  if (!label) return "bg-zinc-100 text-zinc-500";
  // F9: cap at 200 chars to prevent main-thread blocking on huge strings
  const truncated = label.slice(0, 200);
  return CATEGORY_PALETTE[hashString(truncated) % CATEGORY_PALETTE.length];
}
