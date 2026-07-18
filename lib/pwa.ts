/** True for iPhone / iPod / iPad (including iPadOS desktop UA). */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad/.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * Service workers on iOS Safari are sticky and have repeatedly broken App Router
 * /app loads ("This page couldn't load") while Android/Windows are fine.
 * Keep the web manifest for Add to Home Screen; skip SW on Apple touch devices.
 */
export function shouldRegisterServiceWorker(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (process.env.NODE_ENV === "development") return false;
  return !isAppleTouchDevice();
}

export async function clearServiceWorkersAndCaches(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

  const regs = await navigator.serviceWorker.getRegistrations();
  let changed = regs.length > 0;
  await Promise.all(regs.map((reg) => reg.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    if (keys.length > 0) changed = true;
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  return changed;
}
