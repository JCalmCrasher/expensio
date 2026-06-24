"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logService } from "@/lib/logService";
import { parseReceiptOcrText, type ReceiptLineItem } from "@/lib/receiptOcr";
import { runReceiptOcr } from "@/lib/runReceiptOcr";
import { ScanImportModal } from "@/components/ScanImportModal";
import type { NewExpense } from "@/types/expense";

const log = logService.createLogger("ScanReceipt");

interface ScanReceiptProps {
  onPrefill: (quickAddLine: string) => void;
  onScanPreview?: (preview: { line: string; merchant: string | null }) => void;
  onImportMultiple?: (expenses: NewExpense[]) => Promise<void>;
  activeMonthKey: string;
  disabled?: boolean;
}

/** Compact scan control — sits inside the quick-add input group. */
export function ScanReceipt({
  onPrefill,
  onScanPreview,
  onImportMultiple,
  activeMonthKey,
  disabled,
}: ScanReceiptProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([]);
  const [merchant, setMerchant] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setScanning(true);
    try {
      const text = await runReceiptOcr(file);
      const parsed = parseReceiptOcrText(text);
      log.info("Receipt OCR result", { text, parsed });

      if (parsed.lineItems.length >= 2 && onImportMultiple) {
        setLineItems(parsed.lineItems);
        setMerchant(parsed.merchant);
        setReviewOpen(true);
        toast.info(`Found ${parsed.lineItems.length} expenses on receipt`);
        return;
      }

      if (!parsed.quickAddLine) {
        toast.error("Could not read an amount from the receipt. Enter it manually.");
        return;
      }
      if (onScanPreview) {
        onScanPreview({ line: parsed.quickAddLine, merchant: parsed.merchant });
        toast.success(
          parsed.merchant
            ? `Scanned — ${parsed.merchant}`
            : "Receipt scanned — review and add",
        );
        return;
      }
      onPrefill(parsed.quickAddLine);
      toast.success(
        parsed.merchant
          ? `Filled from receipt — ${parsed.merchant}`
          : "Receipt scanned — review and add",
      );
    } catch (err) {
      log.error("Receipt scan failed", err);
      toast.error("Scan failed. Enter the expense manually.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={handleFile}
      />
      <Button
        id="tour-scan"
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled || scanning}
        onClick={() => fileRef.current?.click()}
        aria-label={scanning ? "Scanning receipt" : "Scan receipt"}
        title={scanning ? "Scanning receipt…" : "Scan receipt or expense list"}
        className="shrink-0 text-zinc-400 hover:bg-violet-50 hover:text-violet-600"
      >
        {scanning ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <ScanLine size={16} aria-hidden />
        )}
      </Button>

      {onImportMultiple && (
        <ScanImportModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          items={lineItems}
          merchant={merchant}
          activeMonthKey={activeMonthKey}
          onImport={onImportMultiple}
        />
      )}
    </>
  );
}
