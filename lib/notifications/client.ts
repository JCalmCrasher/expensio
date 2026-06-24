"use client";

import { db } from "@/lib/db";
import { runNotificationEngine, type NotificationRunMode } from "@/lib/notifications/engine";
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notifications/settings";
import { useExpenseStore } from "@/store/useExpenseStore";

const WEEKLY_TAG = "expensio-weekly";
const DUE_TAG = "expensio-due-dates";

export function notificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

async function showNotification(title: string, body: string, tag: string): Promise<void> {
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    tag,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/app" },
  };

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.active) {
      await reg.showNotification(title, options);
      return;
    }
  }

  new Notification(title, options);
}

export async function sendTestNotification(): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;
  await showNotification(
    "Expensio test",
    "Notifications are working on this device.",
    "expensio-test",
  );
  return true;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined;
  return navigator.serviceWorker.getRegistration();
}

export async function registerBackgroundSync(): Promise<void> {
  const reg = await getServiceWorkerRegistration();
  if (!reg) return;

  type PeriodicSyncManager = {
    register: (tag: string, options: { minInterval: number }) => Promise<void>;
  };

  if ("periodicSync" in reg) {
    try {
      const periodic = (reg as ServiceWorkerRegistration & { periodicSync: PeriodicSyncManager })
        .periodicSync;
      await periodic.register(WEEKLY_TAG, { minInterval: 7 * 24 * 60 * 60 * 1000 });
      await periodic.register(DUE_TAG, { minInterval: 24 * 60 * 60 * 1000 });
    } catch {
      // Chromium may deny periodic sync without engagement
    }
  }

  if ("sync" in reg) {
    try {
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(
        "expensio-check",
      );
    } catch {
      // optional one-off sync
    }
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  const reg = await getServiceWorkerRegistration();
  if (!reg) return;

  type PeriodicSyncManager = {
    unregister: (tag: string) => Promise<void>;
  };
  if ("periodicSync" in reg) {
    const periodic = (reg as ServiceWorkerRegistration & { periodicSync: PeriodicSyncManager }).periodicSync;
    await periodic.unregister(WEEKLY_TAG).catch(() => {});
    await periodic.unregister(DUE_TAG).catch(() => {});
  }
}

export async function runClientNotificationCheck(mode: NotificationRunMode = "all"): Promise<void> {
  if (!notificationSupported() || Notification.permission !== "granted") return;

  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  const expenses = await db.expenses.toArray();
  const currency = useExpenseStore.getState().currency;
  if (settings.currency !== currency) {
    await saveNotificationSettings({ currency });
  }

  await runNotificationEngine(
    mode,
    { expenses, settings, currency },
    showNotification,
    async (patch) => {
      await saveNotificationSettings(patch);
    },
  );
}

export async function enableNotifications(): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;

  await saveNotificationSettings({
    enabled: true,
    currency: useExpenseStore.getState().currency,
  });
  await registerBackgroundSync();
  await runClientNotificationCheck("all");
  return true;
}

export async function disableNotifications(): Promise<void> {
  await saveNotificationSettings({ enabled: false });
  await unregisterBackgroundSync();
}
