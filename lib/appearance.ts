export type AccentColor = "green" | "blue" | "purple";

export const ACCENT_STORAGE_KEY = "expensio-store-v1";
export const COLOR_MODE_STORAGE_KEY = "expensio-color-mode";

export const ACCENT_OPTIONS: {
  id: AccentColor;
  label: string;
  swatch: string;
}[] = [
  { id: "green", label: "Green", swatch: "#16a34a" },
  { id: "blue", label: "Blue", swatch: "#2563eb" },
  { id: "purple", label: "Purple", swatch: "#7c3aed" },
];

export function applyAccent(accent: AccentColor) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", accent);
}
