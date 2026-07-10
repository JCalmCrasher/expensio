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
    [activeMonthKey, onNavigate],
  );

  return (
    <div
      id="tour-month-nav"
      className="flex items-center justify-center gap-1"
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Month navigation"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onNavigate(prevMonthKey(activeMonthKey))}
        aria-label="Previous month"
        className="text-muted-foreground/70 hover:bg-transparent hover:text-muted-foreground"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </Button>

      <span className="min-w-[108px] text-center text-sm font-medium text-muted-foreground">
        {formatMonthKey(activeMonthKey)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onNavigate(nextMonthKey(activeMonthKey))}
        aria-label="Next month"
        className="text-muted-foreground/70 hover:bg-transparent hover:text-muted-foreground"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </Button>
    </div>
  );
}
