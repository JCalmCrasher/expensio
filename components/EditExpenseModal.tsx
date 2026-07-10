"use client";

import { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, Priority, Status } from "@/types/expense";
import { useCurrency } from "@/lib/useCurrency";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

interface EditExpenseModalProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Expense>) => Promise<void>;
}

const fieldClassName =
  "rounded-lg border-border bg-card text-foreground text-sm focus-visible:border-ring focus-visible:ring-ring/30";

const labelClassName = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const PRIORITY_OPTIONS: { value: Priority; label: string; Icon: typeof ArrowUp; color: string }[] =
  [
    {
      value: "High",
      label: "High",
      Icon: ArrowUp,
      color:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
    },
    {
      value: "Medium",
      label: "Medium",
      Icon: Minus,
      color:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    },
    {
      value: "Low",
      label: "Low",
      Icon: ArrowDown,
      color:
        "border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted dark:text-foreground",
    },
  ];

export function EditExpenseModal({ expense, open, onClose, onSave }: EditExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [status, setStatus] = useState<Status>("unpaid");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { symbol } = useCurrency();

  const categories = useLiveQuery(() => db.table("categories").toArray()) ?? [];
  const currentCategory = categories.find((c) => c.name === category);

  const categorySpending = useLiveQuery(
    async () => {
      if (!category || !expense?.monthKey) return 0;
      const expenses = await db
        .table("expenses")
        .where("monthKey")
        .equals(expense.monthKey)
        .and((e) => e.category === category && e.id !== expense.id)
        .toArray();
      return expenses.reduce((sum, e) => sum + e.totalAmount, 0);
    },
    [category, expense?.monthKey, expense?.id],
    0,
  );

  const totalProjected = categorySpending + (parseFloat(amount) || 0);
  const isNearLimit = currentCategory?.maxAmount
    ? totalProjected >= currentCategory.maxAmount * 0.8
    : false;
  const isOverLimit = currentCategory?.maxAmount
    ? totalProjected > currentCategory.maxAmount
    : false;

  useEffect(() => {
    if (!expense) return;
    setTitle(expense.title);
    setAmount(String(expense.totalAmount));
    setAmountPaid(String(expense.amountPaid));
    setCategory(expense.category ?? "");
    setPriority(expense.priority);
    setStatus(expense.status);
    setDueDate(expense.dueDate ? new Date(expense.dueDate).toISOString().slice(0, 10) : "");
    setNote(expense.note ?? "");
    setError(null);
  }, [expense]);

  useEffect(() => {
    if (status !== "paid") return;
    const total = parseFloat(amount);
    if (!isNaN(total) && total > 0) setAmountPaid(String(total));
  }, [status, amount]);

  async function handleSave() {
    if (!expense?.id) return;
    const parsedAmount = parseFloat(amount);
    const parsedPaid = parseFloat(amountPaid);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (isNaN(parsedPaid) || parsedPaid < 0) {
      setError("Amount paid must be 0 or more");
      return;
    }
    if (parsedPaid > parsedAmount) {
      setError("Amount paid can't exceed total amount");
      return;
    }

    const finalPaid = status === "paid" ? parsedAmount : parsedPaid;
    const finalStatus: Status =
      status === "paid" || finalPaid >= parsedAmount ? "paid" : "unpaid";

    setSaving(true);
    try {
      await onSave(expense.id, {
        title: title.trim(),
        totalAmount: parsedAmount,
        amountPaid: finalPaid,
        category: category.trim(),
        priority,
        status: finalStatus,
        dueDate: dueDate ? new Date(dueDate).getTime() : null,
        note: note.trim(),
      });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!expense) return null;

  const footer = (
    <>
      <Button type="button" variant="outline" size="modal" onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="button"
        variant="brand"
        size="modal"
        onClick={handleSave}
        disabled={saving}
        className="font-semibold"
      >
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Edit expense"
      footer={footer}
      dialogClassName="sm:max-w-lg"
    >
      <div className="space-y-4 px-6 py-5">
        <div className="space-y-1.5">
          <Label htmlFor="edit-title" className={labelClassName}>
            Title
          </Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Rent"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-amount" className={labelClassName}>
            Total amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
              {symbol}
            </span>
            <Input
              id="edit-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className={cn(fieldClassName, "pl-7")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-paid" className={labelClassName}>
            Amount paid{" "}
            <span className="font-normal text-muted-foreground/80 normal-case">
              — correct if entered by mistake
            </span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
              {symbol}
            </span>
            <Input
              id="edit-paid"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className={cn(fieldClassName, "pl-7")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-note" className={labelClassName}>
            Note <span className="font-normal text-muted-foreground/80 normal-case">(optional)</span>
          </Label>
          <Textarea
            id="edit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            maxLength={500}
            className={fieldClassName}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-category" className={labelClassName}>
            Category{" "}
            <span className="font-normal text-muted-foreground/80 normal-case">(optional)</span>
          </Label>
          <CategoryCombobox
            value={category}
            onChange={(v) => {
              setCategory(v);
              setError(null);
            }}
          />
          {currentCategory && currentCategory.maxAmount > 0 && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2 text-[10px]",
                isOverLimit
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  : isNearLimit
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-border bg-muted/50 text-muted-foreground",
              )}
            >
              <div className="flex-1">
                <div className="mb-1 flex justify-between">
                  <span>Month Budget: {symbol}{currentCategory.maxAmount.toLocaleString()}</span>
                  <span className="font-bold">
                    {Math.round((totalProjected / currentCategory.maxAmount) * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isOverLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-ring",
                    )}
                    style={{
                      width: `${Math.min(100, (totalProjected / currentCategory.maxAmount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-due" className={labelClassName}>
            Due date{" "}
            <span className="font-normal text-muted-foreground/80 normal-case">(optional)</span>
          </Label>
          <Input
            id="edit-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div className="space-y-1.5">
          <p className={labelClassName}>Priority</p>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map(({ value, label, Icon, color }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                onClick={() => setPriority(value)}
                className={cn(
                  "h-auto flex-1 gap-1.5 rounded-lg border py-2 text-xs font-semibold",
                  color,
                  priority === value
                    ? "ring-2 ring-ring ring-offset-1 ring-offset-card opacity-100"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Icon size={11} strokeWidth={3} />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className={labelClassName}>Status</p>
          <p className="text-[10px] text-muted-foreground">
            Setting to <span className="font-semibold text-accent-foreground">paid</span> marks the
            full amount as paid. Use <span className="font-semibold text-foreground">Amount paid</span>{" "}
            above for partial payments.
          </p>
          <div className="flex gap-2">
            {(["unpaid", "paid"] as Status[]).map((s) => (
              <Button
                key={s}
                type="button"
                variant="ghost"
                onClick={() => {
                  setStatus(s);
                  if (s === "paid") {
                    const total = parseFloat(amount);
                    if (!isNaN(total) && total > 0) setAmountPaid(String(total));
                  }
                }}
                className={cn(
                  "h-auto flex-1 rounded-lg border py-2 text-xs font-semibold capitalize",
                  status === s
                    ? s === "paid"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400 ring-offset-1 ring-offset-card dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-700 ring-2 ring-amber-400 ring-offset-1 ring-offset-card dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                    : "border-border bg-muted/50 text-muted-foreground opacity-70 hover:opacity-100",
                )}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
