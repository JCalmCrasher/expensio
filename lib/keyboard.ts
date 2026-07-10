/** True on macOS, iOS, iPadOS — use ⌘ instead of Ctrl in shortcut labels. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modKeyLabel(): string {
  return isApplePlatform() ? "⌘" : "Ctrl";
}

export function formatShortcut(keys: string[]): string {
  const mod = modKeyLabel();
  return keys.map((k) => (k === "mod" ? mod : k)).join("");
}
