"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Download, Upload, CheckCircle2, FileJson, FileText } from "lucide-react";

const ALL_EXPENSES = [
  { title: "Rent",      amount: "$1,200", status: "unpaid", pct: 67 },
  { title: "Groceries", amount: "$320",   status: "unpaid", pct: 50 },
  { title: "Netflix",   amount: "$18",    status: "paid",   pct: 100 },
];

// Sequence phases
// "empty"     → list is empty, import button idle
// "importing" → import button active, wire dot flowing up
// "imported"  → import success, expenses appear one by one
// "ready"     → all expenses visible, pause before export
// "exporting" → export button active, wire dot flowing down, progress bar fills
// "exported"  → export success, pause then loop

type Phase = "empty" | "importing" | "imported" | "ready" | "exporting" | "exported";

// Animated wire dot — travels along a vertical line
function WireDot({
  active,
  color = "#7c3aed",
  direction = "down",
}: {
  active: boolean;
  color?: string;
  direction?: "up" | "down";
}) {
  const path = direction === "down" ? "M 0 0 L 0 36" : "M 0 36 L 0 0";
  return (
    <svg
      viewBox="0 0 2 36"
      className="w-0.5 mx-auto"
      style={{ height: 36, overflow: "visible" }}
      aria-hidden="true"
    >
      <line x1="1" y1="0" x2="1" y2="36" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      {active && (
        <circle r="2.5" fill={color} cx="1">
          <animateMotion dur="1s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </svg>
  );
}

export function DataMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("empty");
  const [visibleCount, setVisibleCount] = useState(0);
  const [exportPct, setExportPct] = useState(0);
  const [activeFormat, setActiveFormat] = useState<"json" | "csv">("json");

  // Entrance
  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(
      wrapRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.5 }
    );
  }, []);

  // Demo loop
  useEffect(() => {
    let alive = true;
    const handles: ReturnType<typeof setTimeout>[] = [];

    function schedule(fn: () => void, ms: number) {
      const t = setTimeout(() => { if (alive) fn(); }, ms);
      handles.push(t);
    }

    function animateBar(onTick: (v: number) => void, onDone: () => void) {
      let v = 0;
      const iv = setInterval(() => {
        if (!alive) { clearInterval(iv); return; }
        v = Math.min(v + 3, 100);
        onTick(v);
        if (v >= 100) { clearInterval(iv); onDone(); }
      }, 90); // ~3s to fill
      handles.push(iv as unknown as ReturnType<typeof setTimeout>);
    }

    function runLoop() {
      // Reset
      setPhase("empty");
      setVisibleCount(0);
      setExportPct(0);
      setActiveFormat("json");

      // 1.5s pause on empty state
      schedule(() => setPhase("importing"), 1500);

      // Import animation runs for 2s, then show success
      schedule(() => setPhase("imported"), 3500);

      // Expenses appear one by one, 600ms apart
      schedule(() => setVisibleCount(1), 4200);
      schedule(() => setVisibleCount(2), 4900);
      schedule(() => setVisibleCount(3), 5600);

      // All visible — pause before export
      schedule(() => setPhase("ready"), 6400);

      // Start export after 1.5s hold
      schedule(() => {
        setPhase("exporting");
        animateBar(
          (v) => setExportPct(v),
          () => { if (alive) setPhase("exported"); }
        );
      }, 7900);

      // Hold exported state, then loop
      schedule(() => runLoop(), 14000);
    }

    runLoop();
    return () => {
      alive = false;
      handles.forEach(clearTimeout);
    };
  }, []);

  const showExpenses = phase === "imported" || phase === "ready" || phase === "exporting" || phase === "exported";
  const isImporting = phase === "importing" || phase === "imported";
  const isExporting = phase === "exporting" || phase === "exported";

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">Data Management</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-500 ${
            showExpenses
              ? "bg-violet-500/20 text-violet-400"
              : "bg-zinc-800 text-zinc-600"
          }`}
        >
          {showExpenses ? `${visibleCount} expense${visibleCount !== 1 ? "s" : ""}` : "0 expenses"}
        </span>
      </div>

      {/* Import section — top */}
      <div className="px-3 pt-3 pb-1">
        <p className="px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Import</p>
        <div
          className={[
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-500",
            phase === "importing"
              ? "border-blue-400/60 bg-blue-500/12 text-blue-300"
              : phase === "imported"
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
              : "border-white/5 bg-white/3 text-zinc-500",
          ].join(" ")}
        >
          {phase === "imported" || showExpenses ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>3 expenses imported</span>
            </>
          ) : (
            <>
              <Upload
                size={13}
                className={phase === "importing" ? "text-blue-400 animate-bounce" : ""}
              />
              <span>{phase === "importing" ? "Importing file…" : "Import JSON or CSV"}</span>
            </>
          )}
        </div>
      </div>

      {/* Wire — import flows down into list */}
      <div className="flex flex-col items-center py-0.5">
        <WireDot active={isImporting} color="#3b82f6" direction="down" />
      </div>

      {/* Expense list */}
      <div className="px-3 pb-1 space-y-1.5 min-h-[80px]">
        {!showExpenses && (
          <div className="rounded-xl border border-dashed border-white/5 py-5 text-center">
            <p className="text-[11px] text-zinc-700">No expenses yet</p>
          </div>
        )}
        {showExpenses &&
          ALL_EXPENSES.slice(0, visibleCount).map((e, i) => (
            <div
              key={e.title}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/3 px-2.5 py-1.5 animate-in fade-in slide-in-from-top-1 duration-400"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {e.status === "paid" && (
                  <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                )}
                <span
                  className={`text-[12px] font-semibold truncate ${
                    e.status === "paid" ? "line-through text-zinc-500" : "text-white"
                  }`}
                >
                  {e.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-12 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      e.status === "paid" ? "bg-emerald-500" : "bg-violet-500"
                    }`}
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-400">{e.amount}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Wire — list flows down into export */}
      <div className="flex flex-col items-center py-0.5">
        <WireDot active={isExporting} color="#7c3aed" direction="down" />
      </div>

      {/* Export section — bottom */}
      <div className="px-3 pb-3">
        <p className="px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Export</p>
        <div className="grid grid-cols-2 gap-1.5">
          {/* JSON */}
          <div
            className={[
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-500",
              phase === "exporting" && activeFormat === "json"
                ? "border-violet-400 bg-violet-500/15 text-violet-300"
                : phase === "exported" && activeFormat === "json"
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                : phase === "ready" || phase === "exporting" || phase === "exported"
                ? "border-violet-500/30 bg-violet-500/5 text-violet-400"
                : "border-white/5 bg-white/3 text-zinc-500",
            ].join(" ")}
          >
            <FileJson size={13} />
            <span>JSON</span>
            {phase === "exported" && (
              <CheckCircle2 size={11} className="ml-auto text-emerald-400" />
            )}
            {phase === "exporting" && (
              <Download size={11} className="ml-auto text-violet-400 animate-bounce" />
            )}
          </div>

          {/* CSV */}
          <div
            className={[
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-500",
              phase === "ready" || phase === "exporting" || phase === "exported"
                ? "border-white/10 bg-white/3 text-zinc-400"
                : "border-white/5 bg-white/3 text-zinc-600",
            ].join(" ")}
          >
            <FileText size={13} />
            <span>CSV</span>
          </div>
        </div>

        {/* Progress bar */}
        {(phase === "exporting" || phase === "exported") && (
          <div className="mt-2">
            <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-150 ${
                  phase === "exported" ? "bg-emerald-500" : "bg-violet-500"
                }`}
                style={{ width: `${exportPct}%` }}
              />
            </div>
            <p className="mt-1 text-[9px] text-zinc-500">
              {phase === "exported"
                ? "✓ expensio-backup.json saved"
                : `Exporting JSON… ${exportPct}%`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
