"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Home-screen PWAs should open a known-good document first (`/`), then
 * enter the app. Avoids iOS cold-starting directly on `/app` under a bad SW.
 */
export function PwaLaunchRedirect() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromPwa = params.get("source") === "pwa";
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari legacy
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (fromPwa || standalone) {
      router.replace("/app");
    }
  }, [router]);

  return null;
}
