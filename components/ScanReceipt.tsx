"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logService } from "@/lib/logService";
import { parseReceiptOcrText } from "@/lib/receiptOcr";
import { runReceiptOcr } from "@/lib/runReceiptOcr";
import { useIsMobile } from "@/lib/useIsMobile";

const log = logService.createLogger("ScanReceipt");

interface ScanReceiptProps {
  onPrefill: (quickAddLine: string) => void;
  disabled?: boolean;
}

export function ScanReceipt({ onPrefill, disabled }: ScanReceiptProps) {
  const isMobile = useIsMobile();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
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
          : "Receipt scanned — review and tap add",
      );
    } catch (err) {
      log.error("Receipt scan failed", err);
      toast.error("Scan failed. Enter the expense manually.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={handleFile}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={handleFile}
      />

      {isMobile ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 border-zinc-200 text-zinc-700"
            disabled={disabled || scanning}
            onClick={() => cameraRef.current?.click()}
          >
            <ScanLine size={15} aria-hidden />
            {scanning ? "Scanning receipt…" : "Scan receipt"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-zinc-500"
            disabled={disabled || scanning}
            onClick={() => uploadRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5 border-zinc-200 text-zinc-700 sm:w-auto"
          disabled={disabled || scanning}
          onClick={() => uploadRef.current?.click()}
        >
          <ScanLine size={15} aria-hidden />
          {scanning ? "Scanning receipt…" : "Scan receipt"}
        </Button>
      )}
    </div>
  );
}
