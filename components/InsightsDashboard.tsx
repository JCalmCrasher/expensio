"use client";

import { BarChart3 } from "lucide-react";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import type { Expense } from "@/types/expense";

interface InsightsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
}

export function InsightsDashboard({ open, onOpenChange, expenses }: InsightsDashboardProps) {
  const hasInsights = expenses.length > 0;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Insights"
      dialogClassName="w-[min(80vw,70rem)] max-w-[min(80vw,70rem)] sm:max-w-[min(80vw,70rem)] max-h-[92vh]"
      drawerClassName="!max-h-[92vh] h-[92vh] data-[vaul-drawer-direction=bottom]:!max-h-[92vh]"
    >
      <div className="px-6 pb-8 pt-2 sm:px-8" id="tour-charts">
        {hasInsights ? (
          <ExpenseCharts expenses={expenses} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-400">
              <BarChart3 size={22} aria-hidden />
            </div>
            <p className="text-sm font-semibold text-zinc-800">No insights yet</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500">
              Add expenses for this month to see spending by category and how much you&apos;ve paid
              vs what&apos;s still owed.
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
