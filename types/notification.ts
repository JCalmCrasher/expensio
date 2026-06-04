export const NOTIFICATION_SETTINGS_ID = 1 as const;

import type { Currency } from "@/store/useExpenseStore";

export type NotificationSettings = {
  id: typeof NOTIFICATION_SETTINGS_ID;
  enabled: boolean;
  dueReminders: boolean;
  weeklyDigest: boolean;
  currency: Currency;
  lastWeeklyDigestAt: number | null;
  lastDueCheckAt: number | null;
  /** `${expenseId}-${dueDayStartMs}` — avoids duplicate due alerts */
  notifiedDueKeys: string[];
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: NOTIFICATION_SETTINGS_ID,
  enabled: false,
  dueReminders: true,
  weeklyDigest: true,
  currency: "NGN",
  lastWeeklyDigestAt: null,
  lastDueCheckAt: null,
  notifiedDueKeys: [],
};
