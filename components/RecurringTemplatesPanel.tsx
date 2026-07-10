"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { useCurrency } from "@/lib/useCurrency";
import type { ExpenseTemplate, Priority } from "@/types/expense";

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export function RecurringTemplatesPanel() {
  const { symbol } = useCurrency();
  const templates = useLiveQuery(() => db.templates.orderBy("title").toArray()) ?? [];

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDay, setDueDay] = useState("");

  async function handleAdd() {
    const totalAmount = parseFloat(amount);
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    const dueDayOfMonth = dueDay ? parseInt(dueDay, 10) : undefined;
    if (dueDayOfMonth != null && (dueDayOfMonth < 1 || dueDayOfMonth > 28)) {
      toast.error("Due day must be between 1 and 28");
      return;
    }

    await db.templates.add({
      title: title.trim(),
      totalAmount,
      category: category.trim(),
      priority,
      dueDayOfMonth,
      createdAt: Date.now(),
    });

    setTitle("");
    setAmount("");
    setCategory("");
    setPriority("Medium");
    setDueDay("");
    toast.success("Recurring expense saved");
  }

  async function handleDelete(id: number, name: string) {
    await db.templates.delete(id);
    toast.error(`Removed "${name}"`);
  }

  return (
    <div className="border-t border-zinc-100 pt-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Repeat size={16} aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Recurring expenses</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
            Save templates for rent, subscriptions, and other monthly bills. Add them to a new month
            with one tap.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-200 bg-background p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Netflix"
              className="h-9 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Amount ({symbol})
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15"
              className="h-9 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Due day (1–28)
            </Label>
            <Input
              type="number"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Optional"
              className="h-9 bg-white"
            />
          </div>
          <div className="col-span-2">
            <CategoryCombobox value={category} onChange={setCategory} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} priority
                </option>
              ))}
            </select>
            <Button type="button" size="icon" onClick={handleAdd} className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700">
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[200px] space-y-2 overflow-y-auto">
        {templates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
            No recurring expenses yet.
          </p>
        ) : (
          templates.map((t) => (
            <TemplateRow key={t.id} template={t} symbol={symbol} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  symbol,
  onDelete,
}: {
  template: ExpenseTemplate;
  symbol: string;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-800">{template.title}</p>
        <p className="text-[10px] text-zinc-400">
          {symbol}
          {template.totalAmount.toLocaleString()}
          {template.category ? ` · ${template.category}` : ""}
          {template.dueDayOfMonth ? ` · due ${template.dueDayOfMonth}` : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost-danger"
        size="icon-sm"
        aria-label={`Delete ${template.title}`}
        onClick={() => template.id && onDelete(template.id, template.title)}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
