"use client";

import { useEffect } from "react";

/** iPhone / iPad / Mac Safari — SW off. Chrome on Mac still gets PWA. */
function isAppleSafariFamily(): boolean {
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad/.test(ua)) return true;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return (
    /Macintosh|Mac OS X/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome|Chromium|Edg|Firefox|Opera/.test(ua)
  );
}

/**
 * next-pwa `register: false` — we own registration here.
 * Apple: unregister any existing worker and never register.
 * Everyone else: register /sw.js as usual.
 */
export function ServiceWorkerGate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (isAppleSafariFamily()) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    if (process.env.NODE_ENV === "development") return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  return null;
}
