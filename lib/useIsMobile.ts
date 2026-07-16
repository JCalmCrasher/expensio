"use client";

import { useSyncExternalStore } from "react";

function subscribeMobile(breakpoint: number, onStoreChange: () => void) {
  const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

/**
 * Viewport mobile check without a false→true flash on mount.
 * (A useState(false)+useEffect pattern remounts ResponsiveModal Dialog→Drawer
 * and can fire spurious onOpenChange(false).)
 */
export function useIsMobile(breakpoint = 640): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMobile(breakpoint, onStoreChange),
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    () => false,
  );
}
