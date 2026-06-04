"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logService } from "@/lib/logService";
import { parseReceiptOcrText } from "@/lib/receiptOcr";
import { runReceiptOcr } from "@/lib/runReceiptOcr";

const log = logService.createLogger("ScanReceipt");

interface ScanReceiptProps {
  onPrefill: (quickAddLine: string) => void;
  disabled?: boolean;
}

/** Compact scan control — sits inside the quick-add input group. */
export function ScanReceipt({ onPrefill, disabled }: ScanReceiptProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setScanning(true);
    try {
      const text = await runReceiptOcr(file);
      const parsed = parseReceiptOcrText(text);
      log.info("Receipt OCR result", { text, parsed });
      if (!parsed.quickAddLine) {
        toast.error("Could not read an amount from the receipt. Enter it manually.");
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
        title={scanning ? "Scanning receipt…" : "Scan receipt"}
        className="shrink-0 text-zinc-400 hover:bg-violet-50 hover:text-violet-600"
      >
        {scanning ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <ScanLine size={16} aria-hidden />
        )}
      </Button>
    </>
  );
}
