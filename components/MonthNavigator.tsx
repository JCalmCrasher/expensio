"use client";

import { useCallback, KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prevMonthKey, nextMonthKey, formatMonthKey } from "@/lib/monthKey";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="toolbar"
        size="icon"
        onClick={() => onNavigate(prevMonthKey(activeMonthKey))}
        aria-label="Previous month"
        className="text-zinc-400 hover:text-zinc-700"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </Button>

      <span className="min-w-[120px] text-center font-[var(--font-heading)] text-[15px] font-semibold text-zinc-900">
        {formatMonthKey(activeMonthKey)}
      </span>

      <Button
        type="button"
        variant="toolbar"
        size="icon"
        onClick={() => onNavigate(nextMonthKey(activeMonthKey))}
        aria-label="Next month"
        className="text-zinc-400 hover:text-zinc-700"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </Button>
    </div>
  );
}
