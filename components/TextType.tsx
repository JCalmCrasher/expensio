"use client";

import { useEffect, useRef, useState } from "react";

interface TextTypeProps {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
}

export function TextType({
  phrases,
  className = "",
  typingSpeed = 60,
  deletingSpeed = 35,
  pauseMs = 1800,
}: TextTypeProps) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      const target = phrases[phraseIdx.current];
      if (charIdx.current < target.length) {
        timeout = setTimeout(() => {
          charIdx.current += 1;
          setDisplayed(target.slice(0, charIdx.current));
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), pauseMs);
      }
    } else if (phase === "pausing") {
      setPhase("deleting");
    } else {
      if (charIdx.current > 0) {
        timeout = setTimeout(() => {
          charIdx.current -= 1;
          setDisplayed(phrases[phraseIdx.current].slice(0, charIdx.current));
        }, deletingSpeed);
      } else {
        phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [phase, displayed, phrases, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className}>
      {displayed}
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[blink_1s_step-end_infinite] bg-current"
      />
    </span>
  );
}
