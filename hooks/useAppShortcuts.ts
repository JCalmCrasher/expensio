"use client";

import { useEffect } from "react";
import { nextMonthKey, prevMonthKey } from "@/lib/monthKey";

interface UseAppShortcutsOptions {
  enabled: boolean;
  activeMonthKey: string;
  onNavigateMonth: (monthKey: string) => void;
  onFocusQuickAdd: () => void;
  onFocusSearch: () => void;
}

export function useAppShortcuts({
  enabled,
  activeMonthKey,
  onNavigateMonth,
  onFocusQuickAdd,
  onFocusSearch,
}: UseAppShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const inField =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (inField) return;

      if (event.key === "n" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        onFocusQuickAdd();
        return;
      }

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        onFocusSearch();
        return;
      }

      if (event.key === "ArrowLeft" && event.altKey) {
        event.preventDefault();
        onNavigateMonth(prevMonthKey(activeMonthKey));
        return;
      }

      if (event.key === "ArrowRight" && event.altKey) {
        event.preventDefault();
        onNavigateMonth(nextMonthKey(activeMonthKey));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    activeMonthKey,
    enabled,
    onFocusQuickAdd,
    onFocusSearch,
    onNavigateMonth,
  ]);
}
