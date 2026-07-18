"use client";

import { useEffect } from "react";
import {
  clearServiceWorkersAndCaches,
  isAppleTouchDevice,
  shouldRegisterServiceWorker,
} from "@/lib/pwa";

const CLEARED_KEY = "expensio-ios-sw-cleared";

/**
 * Registers the PWA service worker on non-Apple-touch browsers.
 * On iOS/iPadOS, actively removes any existing worker/caches so stuck
 * "This page couldn't load" clients can recover, then never re-registers.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    (async () => {
      if (isAppleTouchDevice()) {
        const changed = await clearServiceWorkersAndCaches();
        if (cancelled) return;
        // One reload so the page is no longer controlled by a dying worker.
        if (changed && !sessionStorage.getItem(CLEARED_KEY)) {
          sessionStorage.setItem(CLEARED_KEY, "1");
          window.location.reload();
        }
        return;
      }

      if (!shouldRegisterServiceWorker()) return;

      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        void reg.update();
      } catch {
        // Registration can fail in private mode; app still works without SW.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
