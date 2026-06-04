"use client";

import { useEffect } from "react";
import { runClientNotificationCheck } from "@/lib/notifications/client";
import { getNotificationSettings } from "@/lib/notifications/settings";
import { useExpenseStore } from "@/store/useExpenseStore";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Runs due-date and weekly checks while the app is open; SW handles background. */
export function NotificationManager() {
  const currency = useExpenseStore((s) => s.currency);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      await runClientNotificationCheck("all");
    }

    void tick();

    const interval = window.setInterval(() => void tick(), CHECK_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [currency]);

  return null;
}

/** Fire after saving an expense with a due date. */
export async function notifyAfterExpenseChange(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) return;
  await runClientNotificationCheck("due-dates");
}
