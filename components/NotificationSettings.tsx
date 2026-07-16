"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  disableNotifications,
  enableNotifications,
  notificationSupported,
  requestNotificationPermission,
  runClientNotificationCheck,
  sendTestNotification,
} from "@/lib/notifications/client";
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notifications/settings";
import type { NotificationSettings } from "@/types/notification";

export function NotificationSettingsPanel() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const supported = notificationSupported();

  useEffect(() => {
    void getNotificationSettings().then(setSettings);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, [supported]);

  if (!settings) return null;

  async function refresh() {
    setSettings(await getNotificationSettings());
    if (supported) setPermission(Notification.permission);
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const ok = await enableNotifications();
      if (!ok) {
        toast.error("Notifications blocked. Allow them in your browser settings.");
        setPermission(Notification.permission);
        return;
      }
      toast.success("Notifications enabled");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    await disableNotifications();
    toast.success("Notifications turned off");
    await refresh();
  }

  async function toggleField<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) {
    const next = await saveNotificationSettings({ [key]: value });
    setSettings(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <Bell size={16} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Due-date reminders and a weekly summary of what you paid and still owe. Runs on this
            device — install the app for background alerts (Chrome / Edge).
          </p>
        </div>
      </div>

      {!supported ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Notifications are not supported in this browser.
        </p>
      ) : (
        <>
          {!settings.enabled ? (
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="w-full gap-1.5"
              disabled={loading}
              onClick={handleEnable}
            >
              <Bell size={14} aria-hidden />
              Enable notifications
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-3">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-xs font-medium text-foreground">Due date reminders</span>
                <input
                  type="checkbox"
                  checked={settings.dueReminders}
                  onChange={(e) => void toggleField("dueReminders", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-xs font-medium text-foreground">Weekly insights</span>
                <input
                  type="checkbox"
                  checked={settings.weeklyDigest}
                  onChange={(e) => void toggleField("weeklyDigest", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 border-border text-muted-foreground"
                disabled={loading}
                onClick={handleDisable}
              >
                <BellOff size={14} aria-hidden />
                Turn off
              </Button>
            </div>
          )}

          {permission === "denied" && (
            <p className="text-[11px] text-red-600">
              Permission denied. Reset site permissions in your browser to enable alerts.
            </p>
          )}

          {settings.enabled && permission === "granted" && (
            <div className="flex flex-col gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-violet-700 hover:bg-violet-50"
                onClick={async () => {
                  const ok = await sendTestNotification();
                  if (!ok) toast.error("Could not show test notification");
                  else toast.success("Test notification sent");
                }}
              >
                Test notification
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-violet-700 hover:bg-violet-50"
                onClick={async () => {
                  await requestNotificationPermission();
                  await runClientNotificationCheck("all");
                  toast.message("If anything is due or your week is ready, you'll see an alert.");
                }}
              >
                Send check now
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
