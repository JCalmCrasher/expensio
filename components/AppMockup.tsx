"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// The demo sequence:
// 1. Cursor types "Coffee 4.50" into the input
// 2. Card appears with 0% progress
// 3. Progress bar animates to fill (simulating a payment being recorded)
// 4. Loops after a pause

const TYPING_TEXT = "Coffee 4.50 paid";
const TYPING_SPEED = 90; // ms per char
const POST_TYPE_PAUSE = 600;
const FILL_DURATION = 1.4; // seconds for bar to fill
const LOOP_PAUSE = 2800;

export function AppMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  const [typedText, setTypedText] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Entrance only — no float
  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(
      wrapRef.current,
      { y: 48, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: 0.4 }
    );
  }, []);

  // Demo loop
  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    function schedule(fn: () => void, ms: number) {
      const t = setTimeout(() => {
        if (alive) fn();
      }, ms);
      timeouts.push(t);
      return t;
    }

    async function runLoop() {
      // Reset
      setTypedText("");
      setShowCard(false);
      setShowCursor(true);
      if (barRef.current) gsap.set(barRef.current, { width: "0%" });
      if (pctRef.current) pctRef.current.textContent = "0%";

      // Type each character
      let delay = 400;
      for (let i = 1; i <= TYPING_TEXT.length; i++) {
        const captured = i;
        schedule(() => setTypedText(TYPING_TEXT.slice(0, captured)), delay);
        delay += TYPING_SPEED;
      }

      // After typing: hide cursor, show card
      schedule(() => {
        setShowCursor(false);
        setTypedText("");
        setShowCard(true);
      }, delay + POST_TYPE_PAUSE);

      // Animate bar filling
      schedule(
        () => {
          if (!barRef.current || !pctRef.current) return;
          const obj = { pct: 0 };
          gsap.to(obj, {
            pct: 100,
            duration: FILL_DURATION,
            ease: "power2.inOut",
            onUpdate() {
              const v = Math.round(obj.pct);
              if (barRef.current) barRef.current.style.width = `${v}%`;
              if (pctRef.current) pctRef.current.textContent = `${v}%`;
            },
          });
        },
        delay + POST_TYPE_PAUSE + 300
      );

      // Loop
      schedule(() => runLoop(), delay + POST_TYPE_PAUSE + 300 + FILL_DURATION * 1000 + LOOP_PAUSE);
    }

    runLoop();

    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
      gsap.killTweensOf({});
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      {/* Mock top bar */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">April 2026</span>
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
          Expenses
        </span>
      </div>

      {/* Mock quick-add input */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300">
          <span className="flex-1 min-w-0 truncate">
            {typedText || <span className="text-zinc-600">e.g. Rent 1200 paid</span>}
            {showCursor && (
              <span className="ml-px inline-block h-[13px] w-[1.5px] translate-y-[2px] animate-[blink_1s_step-end_infinite] bg-violet-400" />
            )}
          </span>
          <kbd className="ml-2 shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-zinc-600">
            ↵
          </kbd>
        </div>
      </div>

      {/* Mock summary */}
      <div className="px-4 py-2 border-y border-white/5">
        <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
          <span>
            Owed <span className="text-white font-semibold">$4.50</span>
          </span>
          <span>
            Paid <span className="text-emerald-400 font-semibold">$0.00</span>
          </span>
          <span className="text-zinc-400">0%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-violet-500" style={{ width: "0%" }} />
        </div>
      </div>

      {/* Animated expense card */}
      <div className="p-3">
        {showCard ? (
          <div ref={cardRef} className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white">Coffee</span>
                <span className="rounded-full bg-amber-900/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                  Medium
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-300">$4.50</span>
            </div>

            {/* Animated progress bar */}
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                ref={barRef}
                className="h-full rounded-full bg-violet-500"
                style={{ width: "0%" }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span ref={pctRef} className="text-[10px] font-medium text-zinc-500">
                0%
              </span>
              <span className="text-[10px] text-violet-400 font-semibold">+ Pay</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/5 py-6 text-center">
            <p className="text-[11px] text-zinc-700">No expenses yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
