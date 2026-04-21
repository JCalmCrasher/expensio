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
      nextBtnText: "Next →",
      prevBtnText: "← Back",
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
          element: "#tour-month-nav",
          popover: {
            title: "Month Navigator",
            description:
              "Switch between months with the arrows. Each month has its own expense list.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-summary",
          popover: {
            title: "Monthly Summary",
            description: "See your total owed, total paid, and overall progress at a glance.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-stats",
          popover: {
            title: "Stats",
            description:
              "Quick counts of paid, unpaid, and high-priority expenses for the active month.",
            side: "bottom",
            align: "start",
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

    // Small delay so elements are painted
    const t = setTimeout(() => d.drive(), 300);
    return () => {
      clearTimeout(t);
      d.destroy();
    };
  }, [onDone]);

  return null;
}
