import { db } from "@/lib/db";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTINGS_ID,
  type NotificationSettings,
} from "@/types/notification";

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const row = await db.table("settings").get(NOTIFICATION_SETTINGS_ID);
  return row ?? { ...DEFAULT_NOTIFICATION_SETTINGS };
}

export async function saveNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const next = { ...current, ...patch, id: NOTIFICATION_SETTINGS_ID };
  await db.table("settings").put(next);
  return next;
}
