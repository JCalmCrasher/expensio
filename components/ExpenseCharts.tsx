"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { useCurrency } from "@/lib/useCurrency";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import type { Expense } from "@/types/expense";

interface ExpenseChartsProps {
  expenses: Expense[];
}

// ── Colour palette ────────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#7c3aed", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#d946ef", "#f97316",
  "#84cc16", "#6366f1",
];

const PRIORITY_COLORS: Record<string, string> = {
  High:   "#ef4444",
  Medium: "#f59e0b",
  Low:    "#a1a1aa",
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload?: { label?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { fmt } = useCurrency();
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-zinc-800">{payload[0].payload?.label ?? payload[0].name}</p>
      <p className="text-zinc-500 mt-0.5">{fmt(payload[0].value)}</p>
    </div>
  );
}

// ── Category donut ────────────────────────────────────────────────────────────
function CategoryDonut({ expenses }: { expenses: Expense[] }) {
  const { fmt } = useCurrency();

  const data = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      const key = e.category?.trim() || "Uncategorised";
      acc[key] = (acc[key] ?? 0) + e.totalAmount;
      return acc;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // top 8 categories

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-zinc-400">
        No data yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Donut */}
      <div className="w-full sm:w-48 h-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-1.5">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
              />
              <span className="flex-1 truncate text-[11px] text-zinc-600">{d.label}</span>
              <span className="text-[11px] font-semibold text-zinc-800 tabular-nums">
                {fmt(d.value)}
              </span>
              <span className="w-8 text-right text-[10px] text-zinc-400 tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Priority bar chart ────────────────────────────────────────────────────────
function PriorityBars({ expenses }: { expenses: Expense[] }) {
  const { fmt } = useCurrency();

  const data = (["High", "Medium", "Low"] as const).map((p) => {
    const group = expenses.filter((e) => e.priority === p);
    return {
      priority: p,
      Paid:   group.filter((e) => e.status === "paid").reduce((s, e) => s + e.totalAmount, 0),
      Unpaid: group.filter((e) => e.status === "unpaid").reduce((s, e) => s + e.totalAmount, 0),
    };
  }).filter((d) => d.Paid + d.Unpaid > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-zinc-400">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={20} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis
          dataKey="priority"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmt(v).replace(/\.00$/, "")}
          width={60}
        />
        <Tooltip
          formatter={(value: number) => fmt(value)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e4e4e7",
            fontSize: 11,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="Paid"   fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Unpaid" fill="#7c3aed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.category || "Uncategorised"));
    return Array.from(cats).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "all") return expenses;
    return expenses.filter((e) => (e.category || "Uncategorised") === selectedCategory);
  }, [expenses, selectedCategory]);

  if (expenses.length === 0) return null;

  return (
    <div className="mt-5 space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Charts Filter
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 w-[160px] rounded-lg border-zinc-200 bg-white text-[11px] font-medium">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all" className="text-[11px]">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-[11px]">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
              title="Clear filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Category breakdown */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              {selectedCategory === "all" ? "Spending by category" : `Spending in ${selectedCategory}`}
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {selectedCategory === "all" 
                ? "Where your money is going this month" 
                : "Top expenses in this category"}
            </p>
          </div>
          <CategoryDonut expenses={filteredExpenses} />
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Paid vs unpaid by priority</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">How much is cleared across priority levels</p>
          </div>
          <PriorityBars expenses={filteredExpenses} />
        </div>
      </div>
    </div>
  );
}
