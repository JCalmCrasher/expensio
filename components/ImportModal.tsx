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
  Loader2,
  ChevronLeft,
} from "lucide-react";
import {
  parseImportFile,
  commitImport,
  CSV_HEADERS,
  csvTemplateRow,
  type ImportFormat,
  type ImportMode,
  type ParseImportResult,
  type CommitImportResult,
} from "@/lib/exportImport";
import { formatMonthKey } from "@/lib/monthKey";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  activeMonthKey: string;
  onImportComplete?: () => void;
  onNavigateMonth?: (monthKey: string) => void;
}

type Step = "format" | "preview" | "importing" | "result";

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
    "rolledOver": false,
    "note": "Monthly rent"
  }]
}`;

const CSV_EXAMPLE = `title,totalAmount,amountPaid,status,priority,category,monthKey,dueDate,rolledOver,note
Rent,1200,0,unpaid,High,Housing,2026-04,2026-04-30,false,Monthly rent
Coffee,4.50,4.50,paid,Low,Food,2026-04,,false,`;

const FIELD_REF = [
  ["title", "Required"],
  ["totalAmount", "Required, positive number"],
  ["amountPaid", "0 or more"],
  ["status", '"paid" or "unpaid"'],
  ["priority", '"High" "Medium" "Low"'],
  ["category", "Optional"],
  ["note", "Optional"],
  ["monthKey", '"YYYY-MM"'],
  ["dueDate", "Optional, YYYY-MM-DD"],
  ["rolledOver", '"true" or "false"'],
];

export function ImportModal({
  open,
  onClose,
  activeMonthKey,
  onImportComplete,
  onNavigateMonth,
}: ImportModalProps) {
  const [format, setFormat] = useState<ImportFormat>("json");
  const [step, setStep] = useState<Step>("format");
  const [parsed, setParsed] = useState<ParseImportResult | null>(null);
  const [result, setResult] = useState<CommitImportResult | null>(null);
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>("append");
  const [confirmReplaceAll, setConfirmReplaceAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [totalPreviewRows, setTotalPreviewRows] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("format");
    setParsed(null);
    setResult(null);
    setParseErrors([]);
    setImportMode("append");
    setConfirmReplaceAll(false);
    setLoading(false);
    setProgress(null);
    setPasteValue("");
    setPasteError(null);
    setShowAllErrors(false);
    setTotalPreviewRows(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function runParse(text: string) {
    setLoading(true);
    try {
      const importFormat = format === "json" ? "json" : "auto";
      const res = parseImportFile(text, importFormat, { defaultMonthKey: activeMonthKey });
      if (res.errors.some((e) => e.row === 0)) {
        setPasteError(res.errors[0]?.message ?? "Invalid file");
        return;
      }
      setParsed(res);
      setParseErrors(res.errors);
      setTotalPreviewRows(res.valid.length + res.errors.length);
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!parsed || parsed.valid.length === 0) return;
    if (importMode === "replace-all" && !confirmReplaceAll) return;

    setStep("importing");
    setProgress({ done: 0, total: parsed.valid.length });

    const res = await commitImport(parsed.valid, importMode, {
      activeMonthKey,
      onProgress: (done, total) => setProgress({ done, total }),
    });

    setResult(res);
    setStep("result");

    if (res.imported > 0) {
      onImportComplete?.();
      const skipped = parseErrors.length;
      toast.success(
        `${res.imported} expense${res.imported !== 1 ? "s" : ""} imported` +
          (skipped > 0 ? ` (${skipped} skipped)` : ""),
      );
    } else if (res.errors.length > 0) {
      toast.error("Import failed", { description: res.errors[0] });
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPasteError("File too large (max 5 MB).");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const text = await file.text();
    if (fileRef.current) fileRef.current.value = "";
    setPasteError(null);
    await runParse(text);
  }

  async function handlePasteImport() {
    const text = pasteValue.trim();
    if (!text) {
      setPasteError("Paste some content first.");
      return;
    }
    setPasteError(null);
    await runParse(text);
  }

  function downloadTemplate() {
    const isJSON = format === "json";
    const content = isJSON
      ? JSON_EXAMPLE
      : `${CSV_HEADERS.join(",")}\n${csvTemplateRow()}`;
    const blob = new Blob([content], { type: isJSON ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expensio-template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewOverflow = parsed ? totalPreviewRows > parsed.preview.length : false;
  const visibleErrors = showAllErrors ? parseErrors : parseErrors.slice(0, 4);

  const resultFooter =
    step === "result" ? (
      <>
        <Button type="button" variant="outline" size="modal" onClick={reset}>
          Import more
        </Button>
        <Button type="button" variant="brand" size="modal" onClick={handleClose} className="font-semibold">
          Done
        </Button>
      </>
    ) : step === "preview" ? (
      <>
        <Button type="button" variant="outline" size="modal" onClick={() => setStep("format")}>
          <ChevronLeft size={14} />
          Back
        </Button>
        <Button
          type="button"
          variant="brand"
          size="modal"
          onClick={handleConfirmImport}
          disabled={
            !parsed ||
            parsed.valid.length === 0 ||
            (importMode === "replace-all" && !confirmReplaceAll)
          }
          className="font-semibold"
        >
          Import {parsed?.valid.length ?? 0} expense{(parsed?.valid.length ?? 0) !== 1 ? "s" : ""}
        </Button>
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
      dialogClassName="sm:max-w-lg"
    >
      {step === "format" && (
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["json", "csv"] as ImportFormat[]).map((f) => (
              <Button
                key={f}
                type="button"
                variant={format === f ? "segment-active" : "segment"}
                onClick={() => setFormat(f)}
                className="w-full gap-2 py-2.5 text-sm font-semibold"
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
              </Button>
            ))}
          </div>

          {format === "csv" && (
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              CSV and tab-separated spreadsheet paste (Excel / Google Sheets) are both supported.
            </p>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Format preview
              </p>
              <Button
                type="button"
                variant="link-brand"
                size="xs"
                onClick={downloadTemplate}
                className="h-auto gap-1 px-2 py-0.5 text-[10px] font-semibold hover:bg-green-50"
              >
                <Download size={10} /> Template
              </Button>
            </div>
            <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-32">
              {format === "json" ? JSON_EXAMPLE : CSV_EXAMPLE}
            </pre>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
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
            <p className="mt-2 text-[10px] text-zinc-400">
              Empty <code className="text-zinc-500">monthKey</code> defaults to{" "}
              <code className="text-zinc-500">{activeMonthKey}</code>.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Upload file
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={format === "json" ? ".json" : ".csv,.tsv,.txt"}
              onChange={handleFile}
              className="sr-only"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={[
                "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3",
                "text-sm font-semibold transition-colors",
                "border-zinc-600 text-zinc-400 hover:border-green-300 hover:bg-green-50 hover:text-green-600",
                loading ? "pointer-events-none opacity-60" : "",
              ].join(" ")}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {loading ? "Parsing…" : `Choose ${format.toUpperCase()} file`}
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Or paste content
            </p>
            <Textarea
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
              className="border-zinc-600 bg-zinc-50 font-mono text-[11px] focus-visible:ring-green-500 focus-visible:bg-white"
            />
            {pasteError && (
              <p className="mt-1 text-[11px] font-medium text-red-500">{pasteError}</p>
            )}
            <Button
              type="button"
              variant="brand"
              onClick={handlePasteImport}
              disabled={loading || !pasteValue.trim()}
              className="mt-2 h-auto w-full gap-2 py-2.5 font-semibold"
            >
              <ClipboardPaste size={14} />
              {loading ? "Parsing…" : "Review pasted content"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && parsed && (
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-800">
              {parsed.valid.length} ready · {parseErrors.length} skipped
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-600">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-1.5 font-semibold">#</th>
                  <th className="px-2 py-1.5 font-semibold">Title</th>
                  <th className="px-2 py-1.5 font-semibold">Amount</th>
                  <th className="px-2 py-1.5 font-semibold">Status</th>
                  <th className="px-2 py-1.5 font-semibold hidden sm:table-cell">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {parsed.preview.map((row) => (
                  <tr key={row.row} className={row.valid ? "" : "bg-amber-50/60"}>
                    <td className="px-2 py-1.5 text-zinc-400">{row.row}</td>
                    <td className="px-2 py-1.5 max-w-[120px] truncate">
                      {row.valid ? row.title : (
                        <span className="text-amber-700" title={row.error}>
                          {row.error}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">{row.valid ? row.totalAmount : "—"}</td>
                    <td className="px-2 py-1.5">{row.valid ? row.status : "—"}</td>
                    <td className="px-2 py-1.5 hidden sm:table-cell">{row.valid ? row.monthKey : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewOverflow && (
            <p className="text-[10px] text-zinc-400">
              Showing first {parsed.preview.length} of {totalPreviewRows} rows.
            </p>
          )}

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <ul className="space-y-0.5">
                {visibleErrors.map((e) => (
                  <li key={e.row} className="text-[11px] text-amber-700 truncate">
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
              {parseErrors.length > 4 && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => setShowAllErrors((v) => !v)}
                  className="mt-1 h-auto p-0 text-[10px] text-amber-600"
                >
                  {showAllErrors ? "Show less" : `Show all ${parseErrors.length} errors`}
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Import mode
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {(
                [
                  ["append", "Append", "Add to existing data"],
                  ["replace-month", "Replace month", "Overwrite months in file"],
                  ["replace-all", "Replace all", "Delete everything first"],
                ] as const
              ).map(([mode, label, desc]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setImportMode(mode);
                    if (mode !== "replace-all") setConfirmReplaceAll(false);
                  }}
                  className={[
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    importMode === mode
                      ? "border-green-500 bg-green-50"
                      : "border-zinc-600 hover:border-zinc-300",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold text-zinc-800">{label}</p>
                  <p className="text-[10px] text-zinc-500">{desc}</p>
                </button>
              ))}
            </div>
            {importMode === "replace-all" && (
              <label className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmReplaceAll}
                  onChange={(e) => setConfirmReplaceAll(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[11px] text-red-800 leading-relaxed">
                  This will delete all existing expenses before importing.
                </span>
              </label>
            )}
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
          <Loader2 size={24} className="animate-spin text-green-600" />
          <p className="text-sm font-medium text-zinc-700">
            {progress
              ? `Importing ${progress.done} of ${progress.total}…`
              : "Importing…"}
          </p>
        </div>
      )}

      {step === "result" && result && (
        <div className="px-5 py-4 space-y-3">
          {result.imported > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {result.imported} expense{result.imported !== 1 ? "s" : ""} imported
                </p>
                {parseErrors.length === 0 && (
                  <p className="text-xs text-emerald-600 mt-0.5">All valid rows imported.</p>
                )}
              </div>
            </div>
          )}
          {parseErrors.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {parseErrors.length} row{parseErrors.length !== 1 ? "s" : ""} skipped during parse
                </p>
              </div>
            </div>
          )}
          {result.otherMonthKeys.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-800">
                Expenses were also added to:{" "}
                {result.otherMonthKeys.map((m) => formatMonthKey(m)).join(", ")}.
              </p>
              {result.otherMonthKeys.length === 1 && onNavigateMonth && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => onNavigateMonth(result.otherMonthKeys[0]!)}
                  className="mt-1 h-auto p-0 text-[11px] text-blue-600"
                >
                  Go to {formatMonthKey(result.otherMonthKeys[0]!)}
                </Button>
              )}
            </div>
          )}
          {result.imported === 0 && result.errors.length > 0 && (
            <p className="text-sm text-red-600">{result.errors[0]}</p>
          )}
        </div>
      )}
    </ResponsiveModal>
  );
}
