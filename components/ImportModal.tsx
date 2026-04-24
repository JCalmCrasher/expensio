"use client";

import { useRef, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  ClipboardPaste,
} from "lucide-react";
import { importJSON, importCSV } from "@/lib/exportImport";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

type Format = "json" | "csv";
type Step = "format" | "result";

const JSON_EXAMPLE = `{
  "version": 1,
  "expenses": [{
    "title": "Rent",
    "totalAmount": 1200,
    "amountPaid": 0,
    "status": "unpaid",
    "priority": "High",
    "category": "Housing",
    "monthKey": "2026-04",
    "dueDate": "2026-04-30",
    "rolledOver": false
  }]
}`;

const CSV_EXAMPLE = `title,totalAmount,amountPaid,status,priority,
  category,monthKey,dueDate,rolledOver

Rent,1200,0,unpaid,High,Housing,2026-04,2026-04-30,false
Coffee,4.50,4.50,paid,Low,Food,2026-04,,false`;

const FIELD_REF = [
  ["title", "Required"],
  ["totalAmount", "Required, positive number"],
  ["amountPaid", "0 or more"],
  ["status", '"paid" or "unpaid"'],
  ["priority", '"High" "Medium" "Low"'],
  ["category", "Optional"],
  ["monthKey", '"YYYY-MM"'],
  ["dueDate", "Optional, YYYY-MM-DD"],
  ["rolledOver", '"true" or "false"'],
];

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [format, setFormat] = useState<Format>("json");
  const [step, setStep] = useState<Step>("format");
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("format");
    setResult(null);
    setLoading(false);
    setPasteValue("");
    setPasteError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function runImport(text: string) {
    setLoading(true);
    try {
      const res = format === "json" ? await importJSON(text) : await importCSV(text);
      setResult(res);
      setStep("result");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // F1: client-side size guard before reading
    if (file.size > 5 * 1024 * 1024) {
      setPasteError("File too large (max 5 MB).");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const text = await file.text();
    if (fileRef.current) fileRef.current.value = "";
    await runImport(text);
  }

  async function handlePasteImport() {
    const text = pasteValue.trim();
    if (!text) {
      setPasteError("Paste some content first.");
      return;
    }
    setPasteError(null);
    await runImport(text);
  }

  function downloadTemplate() {
    const isJSON = format === "json";
    const content = isJSON
      ? JSON_EXAMPLE
      : `title,totalAmount,amountPaid,status,priority,category,monthKey,dueDate,rolledOver\nRent,1200,0,unpaid,High,Housing,2026-04,2026-04-30,false`;
    const blob = new Blob([content], { type: isJSON ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expensio-template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const resultFooter =
    step === "result" ? (
      <>
        <button
          onClick={reset}
          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          Import more
        </button>
        <button
          onClick={handleClose}
          className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          Done
        </button>
      </>
    ) : undefined;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
      title="Import expenses"
      footer={resultFooter}
      dialogClassName="sm:max-w-md"
    >
      {step === "format" && (
        <div className="px-5 py-4 space-y-4">
          {/* Format toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["json", "csv"] as Format[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={[
                  "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                  format === f
                    ? "border-green-300 bg-green-50 text-green-700 ring-2 ring-green-300 ring-offset-1"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700",
                ].join(" ")}
              >
                {f === "json" ? (
                  <span
                    className={`text-[13px] font-bold leading-none ${format === "json" ? "text-green-500" : "text-zinc-400"}`}
                  >
                    {"{}"}
                  </span>
                ) : (
                  <FileText
                    size={14}
                    className={format === "csv" ? "text-green-500" : "text-zinc-400"}
                  />
                )}
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Code preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Format preview
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-green-600 transition-colors hover:bg-green-50"
              >
                <Download size={10} /> Template
              </button>
            </div>
            <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {format === "json" ? JSON_EXAMPLE : CSV_EXAMPLE}
            </pre>
            {format === "csv" && (
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                <code className="text-zinc-300">,, </code>
                (double comma) means the field is empty — used for optional fields like{" "}
                <code className="text-zinc-300">dueDate</code>.
              </p>
            )}
          </div>

          {/* Field reference */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Fields
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {FIELD_REF.map(([field, desc]) => (
                <div key={field} className="flex items-baseline gap-1 text-[10px]">
                  <code className="shrink-0 font-semibold text-green-600">{field}</code>
                  <span className="text-zinc-400 truncate">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File picker */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Upload file
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={format === "json" ? ".json" : ".csv"}
              onChange={handleFile}
              className="sr-only"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={[
                "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3",
                "text-sm font-semibold transition-colors",
                "border-zinc-200 text-zinc-400 hover:border-green-300 hover:bg-green-50 hover:text-green-600",
                loading ? "pointer-events-none opacity-60" : "",
              ].join(" ")}
            >
              <Upload size={14} />
              {loading ? "Importing…" : `Choose ${format.toUpperCase()} file`}
            </label>
          </div>

          {/* Paste area */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Or paste content
            </p>
            <textarea
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setPasteError(null);
              }}
              placeholder={
                format === "json"
                  ? '{ "version": 1, "expenses": [...] }'
                  : "title,totalAmount,amountPaid,status,…"
              }
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-[11px] text-zinc-800 placeholder:text-zinc-400 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-400 focus-visible:bg-white transition-colors"
            />
            {pasteError && (
              <p className="mt-1 text-[11px] font-medium text-red-500">{pasteError}</p>
            )}
            <button
              onClick={handlePasteImport}
              disabled={loading || !pasteValue.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ClipboardPaste size={14} />
              {loading ? "Importing…" : "Import pasted content"}
            </button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="px-5 py-4 space-y-3">
          {result.imported > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {result.imported} expense{result.imported !== 1 ? "s" : ""} imported
                </p>
                {result.errors.length === 0 && (
                  <p className="text-xs text-emerald-600 mt-0.5">All rows imported successfully.</p>
                )}
              </div>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped
                </p>
                <ul className="mt-1 space-y-0.5">
                  {result.errors.slice(0, 4).map((e, i) => (
                    <li key={i} className="text-xs text-amber-700 truncate">
                      {e}
                    </li>
                  ))}
                  {result.errors.length > 4 && (
                    <li className="text-xs text-amber-500">…and {result.errors.length - 4} more</li>
                  )}
                </ul>
              </div>
            </div>
          )}
          {result.imported === 0 && result.errors.length === 0 && (
            <p className="text-sm text-zinc-500">No expenses were imported.</p>
          )}
        </div>
      )}
    </ResponsiveModal>
  );
}
