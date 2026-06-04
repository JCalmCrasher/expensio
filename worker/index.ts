/// <reference lib="webworker" />

import { runNotificationsFromServiceWorker } from "../lib/notifications/sw-run";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("periodicsync", (event: Event) => {
  const ev = event as ExtendableEvent & { tag: string };
  if (ev.tag === "expensio-weekly" || ev.tag === "expensio-due-dates") {
    ev.waitUntil(runNotificationsFromServiceWorker(ev.tag, self.registration));
  }
});

self.addEventListener("sync", (event: Event) => {
  const ev = event as ExtendableEvent & { tag: string };
  if (ev.tag === "expensio-check") {
    ev.waitUntil(runNotificationsFromServiceWorker("all", self.registration));
  }
});

self.addEventListener("notificationclick", (event: Event) => {
  const ev = event as NotificationEvent;
  ev.notification.close();
  const url = (ev.notification.data as { url?: string } | undefined)?.url ?? "/app";
  ev.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const match = clients.find((c) => c.url.includes("/app"));
      if (match) return match.focus();
      return self.clients.openWindow(url);
    }),
  );
});

export {};
