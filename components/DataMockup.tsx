"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Download, Upload, CheckCircle2, FileJson, FileText } from "lucide-react";

// Animation sequence:
// 1. Show expense list
// 2. Highlight "Export as JSON" → file downloads (progress bar)
// 3. Pause → show "Imported 3 expenses" success
// 4. Loop

const MOCK_EXPENSES = [
  { title: "Rent",     amount: "$1,200", status: "unpaid", pct: 67 },
  { title: "Groceries", amount: "$320",  status: "unpaid", pct: 50 },
  { title: "Netflix",  amount: "$18",   status: "paid",   pct: 100 },
];

type Phase = "idle" | "exporting" | "exported" | "importing" | "imported";

export function DataMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [exportPct, setExportPct] = useState(0);
  const [activeFormat, setActiveFormat] = useState<"json" | "csv">("json");

  // Entrance
  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(wrapRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: 0.4 });
  }, []);

  // Demo loop
  useEffect(() => {
    let alive = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function schedule(fn: () => void, ms: number) {
      const t = setTimeout(() => { if (alive) fn(); }, ms);
      timeouts.push(t);
      return t;
    }

    function runLoop() {
      setPhase("idle");
      setExportPct(0);
      setActiveFormat("json");

      // Start export
      schedule(() => setPhase("exporting"), 1200);

      // Animate progress bar
      let pct = 0;
      const interval = setInterval(() => {
        if (!alive) { clearInterval(interval); return; }
        pct += 8;
        setExportPct(Math.min(pct, 100));
        if (pct >= 100) {
          clearInterval(interval);
          if (alive) setPhase("exported");
        }
      }, 60);
      timeouts.push(interval as unknown as ReturnType<typeof setTimeout>);

      // Switch to CSV export
      schedule(() => {
        setPhase("idle");
        setExportPct(0);
        setActiveFormat("csv");
      }, 3800);

      schedule(() => setPhase("exporting"), 4600);

      let pct2 = 0;
      schedule(() => {
        const iv2 = setInterval(() => {
          if (!alive) { clearInterval(iv2); return; }
          pct2 += 12;
          setExportPct(Math.min(pct2, 100));
          if (pct2 >= 100) {
            clearInterval(iv2);
            if (alive) setPhase("exported");
          }
        }, 55);
        timeouts.push(iv2 as unknown as ReturnType<typeof setTimeout>);
      }, 4600);

      // Show import success
      schedule(() => setPhase("importing"), 7000);
      schedule(() => setPhase("imported"), 7600);

      // Loop
      schedule(() => runLoop(), 10000);
    }

    runLoop();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">Data Management</span>
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
          3 expenses
        </span>
      </div>

      {/* Expense list preview */}
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        {MOCK_EXPENSES.map((e) => (
          <div key={e.title} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {e.status === "paid" && <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />}
              <span className={`text-[12px] font-semibold truncate ${e.status === "paid" ? "line-through text-zinc-500" : "text-white"}`}>
                {e.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-12 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${e.status === "paid" ? "bg-emerald-500" : "bg-violet-500"}`}
                  style={{ width: `${e.pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-400">{e.amount}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Export section */}
      <div className="px-3 pb-2">
        <p className="px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Export</p>
        <div className="grid grid-cols-2 gap-1.5">
          {/* JSON export button */}
          <div
            className={[
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-300",
              phase === "exporting" && activeFormat === "json"
                ? "border-violet-400 bg-violet-500/15 text-violet-300"
                : phase === "exported" && activeFormat === "json"
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                : activeFormat === "json" && phase === "idle"
                ? "border-violet-500/40 bg-violet-500/8 text-violet-400"
                : "border-white/5 bg-white/[0.03] text-zinc-500",
            ].join(" ")}
          >
            <FileJson size={13} />
            <span>JSON</span>
            {phase === "exported" && activeFormat === "json" && (
              <CheckCircle2 size={11} className="ml-auto text-emerald-400" />
            )}
            {phase === "exporting" && activeFormat === "json" && (
              <Download size={11} className="ml-auto text-violet-400 animate-bounce" />
            )}
          </div>

          {/* CSV export button */}
          <div
            className={[
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-300",
              phase === "exporting" && activeFormat === "csv"
                ? "border-violet-400 bg-violet-500/15 text-violet-300"
                : phase === "exported" && activeFormat === "csv"
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                : activeFormat === "csv" && phase === "idle"
                ? "border-violet-500/40 bg-violet-500/8 text-violet-400"
                : "border-white/5 bg-white/[0.03] text-zinc-500",
            ].join(" ")}
          >
            <FileText size={13} />
            <span>CSV</span>
            {phase === "exported" && activeFormat === "csv" && (
              <CheckCircle2 size={11} className="ml-auto text-emerald-400" />
            )}
            {phase === "exporting" && activeFormat === "csv" && (
              <Download size={11} className="ml-auto text-violet-400 animate-bounce" />
            )}
          </div>
        </div>

        {/* Export progress bar */}
        {(phase === "exporting" || phase === "exported") && (
          <div className="mt-2">
            <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${phase === "exported" ? "bg-emerald-500" : "bg-violet-500"}`}
                style={{ width: `${exportPct}%` }}
              />
            </div>
            <p className="mt-1 text-[9px] text-zinc-500">
              {phase === "exported"
                ? `✓ expensio-backup.${activeFormat} saved`
                : `Exporting ${activeFormat.toUpperCase()}… ${exportPct}%`}
            </p>
          </div>
        )}
      </div>

      {/* Import section */}
      <div className="px-3 pb-3">
        <p className="px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Import</p>
        <div
          className={[
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-300",
            phase === "importing"
              ? "border-blue-400/50 bg-blue-500/10 text-blue-300"
              : phase === "imported"
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
              : "border-white/5 bg-white/[0.03] text-zinc-500",
          ].join(" ")}
        >
          {phase === "imported" ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>3 expenses imported</span>
            </>
          ) : (
            <>
              <Upload size={13} className={phase === "importing" ? "text-blue-400 animate-bounce" : ""} />
              <span>{phase === "importing" ? "Importing…" : "Import JSON or CSV"}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
