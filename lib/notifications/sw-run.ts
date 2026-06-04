import { runNotificationEngine, type NotificationRunMode } from "@/lib/notifications/engine";
import { loadNotificationDataFromIdb } from "@/lib/notifications/idb";
import { NOTIFICATION_SETTINGS_ID } from "@/types/notification";
import type { NotificationSettings } from "@/types/notification";

const DB_NAME = "ExpenseTrackerDB";
const STORE_SETTINGS = "settings";

async function persistSettings(patch: Partial<NotificationSettings>): Promise<void> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });

  try {
    const current = await new Promise<NotificationSettings>((resolve, reject) => {
      const tx = database.transaction(STORE_SETTINGS, "readonly");
      const req = tx.objectStore(STORE_SETTINGS).get(NOTIFICATION_SETTINGS_ID);
      req.onsuccess = () => {
        const row = req.result as NotificationSettings | undefined;
        resolve(
          row ?? {
            id: NOTIFICATION_SETTINGS_ID,
            enabled: false,
            dueReminders: true,
            weeklyDigest: true,
            currency: "NGN",
            lastWeeklyDigestAt: null,
            lastDueCheckAt: null,
            notifiedDueKeys: [],
          },
        );
      };
      req.onerror = () => reject(req.error);
    });

    const next = { ...current, ...patch, id: NOTIFICATION_SETTINGS_ID };
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE_SETTINGS, "readwrite");
      const req = tx.objectStore(STORE_SETTINGS).put(next);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } finally {
    database.close();
  }
}

function mapPeriodicTag(tag: string): NotificationRunMode {
  if (tag === "expensio-weekly") return "expensio-weekly";
  if (tag === "expensio-due-dates") return "expensio-due-dates";
  return "all";
}

/** Called from the custom service worker (periodic sync / background). */
export async function runNotificationsFromServiceWorker(
  tag: string,
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const data = await loadNotificationDataFromIdb();
  if (!data.settings.enabled) return;

  const notify = async (title: string, body: string, notifTag: string) => {
    await registration.showNotification(title, {
      body,
      tag: notifTag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: "/app" },
    });
  };

  await runNotificationEngine(mapPeriodicTag(tag), data, notify, persistSettings);
}
