import { CURRENCY_CONFIG, type Currency } from "@/store/useExpenseStore";
import type { Expense } from "@/types/expense";
import type { NotificationSettings } from "@/types/notification";
import { buildWeeklyDigest } from "@/lib/notifications/digest";
import { dueNotificationKey, findDueReminders } from "@/lib/notifications/dueDates";

export type NotificationRunMode = "all" | "weekly" | "due-dates" | "expensio-weekly" | "expensio-due-dates";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type NotifyFn = (title: string, body: string, tag: string) => Promise<void>;

export async function runNotificationEngine(
  mode: NotificationRunMode,
  data: {
    expenses: Expense[];
    settings: NotificationSettings;
    currency: Currency;
  },
  notify: NotifyFn,
  persist: (patch: Partial<NotificationSettings>) => Promise<void>,
): Promise<void> {
  const { expenses, settings, currency } = data;
  if (!settings.enabled) return;

  const symbol = CURRENCY_CONFIG[currency].symbol;
  const now = Date.now();
  const patch: Partial<NotificationSettings> = {};
  let notifiedKeys = [...settings.notifiedDueKeys];

  const runDue =
    settings.dueReminders &&
    (mode === "all" ||
      mode === "due-dates" ||
      mode === "expensio-due-dates" ||
      !settings.lastDueCheckAt ||
      now - settings.lastDueCheckAt >= DAY_MS);

  if (runDue) {
    for (const { expense, overdue, remaining } of findDueReminders(expenses)) {
      const key = dueNotificationKey(expense.id!, expense.dueDate!);
      if (notifiedKeys.includes(key)) continue;

      const title = overdue ? `${expense.title} is overdue` : `${expense.title} is due today`;
      const body = `${symbol}${remaining.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })} left to pay`;

      await notify(title, body, `due-${key}`);
      notifiedKeys.push(key);
    }
    patch.lastDueCheckAt = now;
    patch.notifiedDueKeys = notifiedKeys.slice(-400);
  }

  const runWeekly =
    settings.weeklyDigest &&
    (mode === "all" ||
      mode === "weekly" ||
      mode === "expensio-weekly" ||
      !settings.lastWeeklyDigestAt ||
      now - settings.lastWeeklyDigestAt >= WEEK_MS);

  if (runWeekly) {
    const { title, body } = buildWeeklyDigest(expenses, symbol);
    await notify(title, body, "weekly-digest");
    patch.lastWeeklyDigestAt = now;
  }

  if (Object.keys(patch).length > 0) {
    await persist(patch);
  }
}
