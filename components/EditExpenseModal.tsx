"use client";

import { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowUp, Minus, ArrowDown } from "lucide-react";
import type { Expense, Priority, Status } from "@/types/expense";
import { useCurrency } from "@/lib/useCurrency";

interface EditExpenseModalProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Expense>) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; Icon: typeof ArrowUp; color: string }[] =
  [
    { value: "High", label: "High", Icon: ArrowUp, color: "text-red-600 bg-red-50 border-red-200" },
    {
      value: "Medium",
      label: "Medium",
      Icon: Minus,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      value: "Low",
      label: "Low",
      Icon: ArrowDown,
      color: "text-zinc-500 bg-zinc-100 border-zinc-200",
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { symbol } = useCurrency();

  useEffect(() => {
    if (!expense) return;
    setTitle(expense.title);
    setAmount(String(expense.totalAmount));
    setAmountPaid(String(expense.amountPaid));
    setCategory(expense.category ?? "");
    setPriority(expense.priority);
    setStatus(expense.status);
    setDueDate(expense.dueDate ? new Date(expense.dueDate).toISOString().slice(0, 10) : "");
    setError(null);
  }, [expense]);

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

    setSaving(true);
    try {
      const newStatus: Status = parsedPaid >= parsedAmount ? "paid" : status;
      await onSave(expense.id, {
        title: title.trim(),
        totalAmount: parsedAmount,
        amountPaid: parsedPaid,
        category: category.trim(),
        priority,
        status: newStatus,
        dueDate: dueDate ? new Date(dueDate).getTime() : null,
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
      <button
        onClick={onClose}
        className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
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
      <div className="px-6 py-5 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label
            htmlFor="edit-title"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
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
            className="rounded-xl border-zinc-200 text-sm focus-visible:ring-green-500"
          />
        </div>

        {/* Total amount */}
        <div className="space-y-1.5">
          <Label
            htmlFor="edit-amount"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Total amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
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
              className="rounded-xl border-zinc-200 pl-6 text-sm focus-visible:ring-green-500"
            />
          </div>
        </div>

        {/* Amount paid */}
        <div className="space-y-1.5">
          <Label
            htmlFor="edit-paid"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Amount paid{" "}
            <span className="font-normal normal-case text-zinc-400">
              — correct if entered by mistake
            </span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
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
              className="rounded-xl border-zinc-200 pl-6 text-sm focus-visible:ring-green-500"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label
            htmlFor="edit-category"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Category <span className="font-normal normal-case text-zinc-400">(optional)</span>
          </Label>
          <Input
            id="edit-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Housing, Food…"
            className="rounded-xl border-zinc-200 text-sm focus-visible:ring-green-500"
          />
        </div>

        {/* Due date */}
        <div className="space-y-1.5">
          <Label
            htmlFor="edit-due"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Due date <span className="font-normal normal-case text-zinc-400">(optional)</span>
          </Label>
          <Input
            id="edit-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-xl border-zinc-200 text-sm focus-visible:ring-green-500"
          />
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Priority</p>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map(({ value, label, Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                  color,
                  priority === value
                    ? "ring-2 ring-offset-1 opacity-100"
                    : "opacity-60 hover:opacity-90",
                ].join(" ")}
              >
                <Icon size={11} strokeWidth={3} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</p>
          <p className="text-[10px] text-zinc-400">
            Setting to <span className="font-semibold text-emerald-600">paid</span> marks the full
            amount as paid. Use <span className="font-semibold">Amount paid</span> above for partial
            payments.
          </p>
          <div className="flex gap-2">
            {(["unpaid", "paid"] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  if (s === "paid") {
                    const total = parseFloat(amount);
                    if (!isNaN(total) && total > 0) setAmountPaid(String(total));
                  }
                }}
                className={[
                  "flex flex-1 items-center justify-center rounded-xl border py-2 text-xs font-semibold capitalize transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1",
                  status === s
                    ? s === "paid"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-400 ring-offset-1"
                      : "bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-400 ring-offset-1"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 opacity-60 hover:opacity-90",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
