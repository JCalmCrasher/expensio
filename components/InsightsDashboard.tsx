"use client";

import { ExpenseCharts } from "@/components/ExpenseCharts";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import type { Expense } from "@/types/expense";

interface InsightsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
}

export function InsightsDashboard({ open, onOpenChange, expenses }: InsightsDashboardProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Insights"
      dialogClassName="w-[min(80vw,70rem)] max-w-[min(80vw,70rem)] sm:max-w-[min(80vw,70rem)] max-h-[92vh]"
      drawerClassName="!max-h-[92vh] h-[92vh] data-[vaul-drawer-direction=bottom]:!max-h-[92vh]"
    >
      <div className="px-6 pb-8 pt-2 sm:px-8" id="tour-charts">
        <ExpenseCharts expenses={expenses} />
      </div>
    </ResponsiveModal>
  );
}
