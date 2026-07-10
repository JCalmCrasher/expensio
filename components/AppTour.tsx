"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface AppTourProps {
  onDone: () => void;
}

export function AppTour({ onDone }: AppTourProps) {
  useEffect(() => {
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
        onDone();
      },
      steps: [
        {
          element: "#tour-quick-add",
          popover: {
            title: "Quick Add",
            description:
              "Type an expense in plain text — e.g. <code>Coffee 4.50</code> or <code>Rent 1200 paid</code> — then press Enter. No forms.",
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
              "Switch between months with the arrows. Each month has its own expense list.",
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
          element: "#tour-search",
          popover: {
            title: "Search",
            description: "Filter expenses by title instantly.",
            side: "bottom",
            align: "start",
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
      ],
    });

    const t = setTimeout(() => d.drive(), 300);
    return () => {
      clearTimeout(t);
      d.destroy();
    };
  }, [onDone]);

  return null;
}
