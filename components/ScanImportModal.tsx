"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ReceiptLineItem } from "@/lib/receiptOcr";
import type { NewExpense } from "@/types/expense";
import { useCurrency } from "@/lib/useCurrency";

interface ScanImportModalProps {
  open: boolean;
  onClose: () => void;
  items: ReceiptLineItem[];
  merchant: string | null;
  activeMonthKey: string;
  onImport: (expenses: NewExpense[]) => Promise<void>;
}

export function ScanImportModal({
  open,
  onClose,
  items,
  merchant,
  activeMonthKey,
  onImport,
}: ScanImportModalProps) {
  const [importing, setImporting] = useState(false);
  const { symbol } = useCurrency();

  async function handleImport() {
    setImporting(true);
    try {
      const expenses: NewExpense[] = items.map((item) => ({
        title: item.title,
        totalAmount: item.amount,
        amountPaid: 0,
        status: "unpaid",
        priority: "Medium",
        category: "",
        monthKey: activeMonthKey,
        rolledOver: false,
        note: merchant ? `Scanned from ${merchant}` : "Scanned receipt",
      }));
      await onImport(expenses);
      onClose();
    } finally {
      setImporting(false);
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v && !importing) onClose();
      }}
      title="Import from scan"
      dialogClassName="sm:max-w-md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="modal"
            onClick={onClose}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            size="modal"
            onClick={handleImport}
            disabled={importing || items.length === 0}
            className="gap-2 font-semibold"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : null}
            Import {items.length} expense{items.length !== 1 ? "s" : ""}
          </Button>
        </>
      }
    >
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-zinc-600">
          Found {items.length} line{items.length !== 1 ? "s" : ""}
          {merchant ? ` from ${merchant}` : ""}. Review before importing.
        </p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-1.5 font-semibold">#</th>
                <th className="px-2 py-1.5 font-semibold">Title</th>
                <th className="px-2 py-1.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item, i) => (
                <tr key={`${item.title}-${item.amount}-${i}`}>
                  <td className="px-2 py-1.5 text-zinc-400">{i + 1}</td>
                  <td className="px-2 py-1.5 max-w-[180px] truncate">{item.title}</td>
                  <td className="px-2 py-1.5 text-right font-medium">
                    {symbol}
                    {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ResponsiveModal>
  );
}
