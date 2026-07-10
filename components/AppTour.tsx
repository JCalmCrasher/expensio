"use client";

import { useEffect, useRef } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { formatShortcut } from "@/lib/keyboard";

interface AppTourProps {
  onDone: () => void;
}

function isNarrowViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
}

export function AppTour({ onDone }: AppTourProps) {
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const narrow = isNarrowViewport();
    const modK = formatShortcut(["mod", "K"]);

    const steps: DriveStep[] = [
      {
        element: "#tour-quick-add",
        popover: {
          title: "Quick Add",
          description:
            "Type an expense in plain text — e.g. <code>Coffee 4.50</code> or <code>Rent 1200 paid</code> — then press Enter. Press <code>N</code> anytime to jump here.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-scan",
        popover: {
          title: "Scan a receipt",
          description:
            "Tap the scan icon to take a photo or upload an image. We read the amount and merchant, then pre-fill the box for you to check.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-month-nav",
        popover: {
          title: "Month Navigator",
          description:
            "Switch between months with the arrows. Use <code>Alt + ←/→</code> on desktop for quick jumps.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-summary",
        popover: {
          title: "Remaining balance",
          description:
            "Your hero number shows what's left to pay this month. The card shifts from green to amber to red as you get closer to fully paid.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-expenses",
        popover: {
          title: "Expense list",
          description:
            "Expenses group by day. Large months load in pages as you scroll — only what's on screen is rendered for speed.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#tour-insights",
        popover: {
          title: "Insights",
          description:
            "Open charts for spending by category and paid vs unpaid — without leaving your expense list.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-commands",
        popover: {
          title: "Command palette",
          description: narrow
            ? "Tap here to search expenses, jump months, change theme, and more — your shortcut hub on mobile."
            : `Press <code>${modK}</code> (or click here) to search expenses, jump months, switch currency, and change appearance.`,
          side: "bottom",
          align: "end",
        },
      },
    ];

    if (!narrow) {
      steps.push({
        element: "#tour-search",
        popover: {
          title: "Search",
          description:
            "Filter the visible list by title. Press <code>/</code> to focus search quickly.",
          side: "bottom",
          align: "start",
        },
      });
    }

    steps.push(
      {
        element: "#tour-data-menu",
        disableActiveInteraction: true,
        popover: {
          title: "⋯ Data menu",
          description:
            "Tap the <strong>⋯</strong> button for <strong>Export JSON</strong>, <strong>Export CSV</strong>, <strong>Import expenses</strong>, and <strong>Appearance</strong> (light/dark/system theme and accent color). Settings (gear icon) covers notifications, recurring templates, and category budgets.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-rollover",
        popover: {
          title: "Roll Over",
          description:
            "Copy all unpaid expenses into next month with their progress preserved. Each expense is only rolled over once per month.",
          side: "bottom",
          align: "end",
        },
      },
    );

    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.55)",
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: "expensio-tour",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      onDestroyStarted: () => {
        d.destroy();
        onDoneRef.current();
      },
      steps,
    });

    const t = setTimeout(() => d.drive(), 300);
    return () => {
      clearTimeout(t);
      d.destroy();
    };
  }, []);

  return null;
}
