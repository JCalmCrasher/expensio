"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// Sequence: type → add → type → add → type → add → loop
const ENTRIES = [
  {
    text: "Rent 1200 High",
    label: "Rent",
    amount: "$1,200",
    priority: "High",
    color: "text-red-400 bg-red-900/30",
  },
  {
    text: "Coffee 4.50 paid",
    label: "Coffee",
    amount: "$4.50",
    priority: "Medium",
    color: "text-amber-400 bg-zinc-800",
  },
  {
    text: "Gym 50",
    label: "Gym",
    amount: "$50.00",
    priority: "Medium",
    color: "text-amber-400 bg-zinc-80",
  },
];

const TYPING_SPEED = 75;
const POST_TYPE_PAUSE = 500;
const CARD_HOLD = 1400;
const LOOP_PAUSE = 600;

export function QuickAddMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [cards, setCards] = useState<typeof ENTRIES>([]);

  // Entrance animation
  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(
      wrapRef.current,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.6 }
    );
  }, []);

  // Demo loop
  useEffect(() => {
    let alive = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function schedule(fn: () => void, ms: number) {
      const t = setTimeout(() => {
        if (alive) fn();
      }, ms);
      timeouts.push(t);
    }

    async function runLoop() {
      setTypedText("");
      setCards([]);
      setShowCursor(true);

      let globalDelay = 300;

      for (let i = 0; i < ENTRIES.length; i++) {
        const entry = ENTRIES[i];

        // Type each character
        for (let c = 1; c <= entry.text.length; c++) {
          const captured = c;
          const entryText = entry.text;
          schedule(() => setTypedText(entryText.slice(0, captured)), globalDelay);
          globalDelay += TYPING_SPEED;
        }

        // Pause after typing, then clear input and add card
        schedule(() => {
          setShowCursor(false);
          setTypedText("");
          setCards((prev) => [entry, ...prev]);
        }, globalDelay + POST_TYPE_PAUSE);

        globalDelay += POST_TYPE_PAUSE + 80;

        // Show cursor again for next entry (unless last)
        if (i < ENTRIES.length - 1) {
          schedule(() => setShowCursor(true), globalDelay);
          globalDelay += 200;
        }
      }

      // Hold final state then loop
      schedule(() => runLoop(), globalDelay + CARD_HOLD + LOOP_PAUSE);
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
      className="w-full rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">Quick Add</span>
        <span className="text-[10px] text-zinc-600">Press Enter to add</span>
      </div>

      {/* Input */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300 min-h-10">
          <span className="flex-1 min-w-0 truncate">
            {typedText || <span className="text-zinc-600">e.g. Rent 1200 paid</span>}
            {showCursor && (
              <span className="ml-px inline-block h-3.25 w-[1.5px] translate-y-0.5 animate-[blink_1s_step-end_infinite] bg-green-400" />
            )}
          </span>
          <kbd className="ml-2 shrink-0 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-zinc-600">
            ↵
          </kbd>
        </div>
      </div>

      {/* Card list */}
      <div className="p-3 space-y-2 min-h-30">
        {cards.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/5 py-5 text-center">
            <p className="text-[11px] text-zinc-700">Your expenses appear here</p>
          </div>
        )}
        {cards.map((card, i) => (
          <div
            key={`${card.label}-${i}`}
            className="rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-white truncate">{card.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-zinc-300">{card.amount}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${card.color}`}>
                  {card.priority}
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full w-0 rounded-full bg-green-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
