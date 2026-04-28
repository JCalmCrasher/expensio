"use client";

import { useCallback, KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prevMonthKey, nextMonthKey, formatMonthKey } from "@/lib/monthKey";

interface MonthNavigatorProps {
  activeMonthKey: string;
  onNavigate: (monthKey: string) => void;
}

export function MonthNavigator({ activeMonthKey, onNavigate }: MonthNavigatorProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate(prevMonthKey(activeMonthKey));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate(nextMonthKey(activeMonthKey));
      }
    },
    [activeMonthKey, onNavigate]
  );

  return (
    <div
      className="flex items-center gap-1"
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Month navigation"
    >
      <button
        onClick={() => onNavigate(prevMonthKey(activeMonthKey))}
        aria-label="Previous month"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      <span className="min-w-[120px] text-center font-[var(--font-heading)] text-[15px] font-semibold text-zinc-900">
        {formatMonthKey(activeMonthKey)}
      </span>

      <button
        onClick={() => onNavigate(nextMonthKey(activeMonthKey))}
        aria-label="Next month"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
