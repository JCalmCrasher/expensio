import * as React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Expensio logo mark — a violet rounded square with a stylised
 * coin (circle) and a partial progress bar underneath.
 */
export function Logo({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Expensio"
      className={className}
    >
      {/* Background */}
      <rect width="32" height="32" rx="8" fill="#7c3aed" />

      {/* Coin ring */}
      <circle cx="16" cy="13" r="5.5" stroke="white" strokeWidth="2" />

      {/* Currency symbol — simple vertical bar + two horizontal ticks */}
      <line
        x1="16"
        y1="9.5"
        x2="16"
        y2="16.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="13.5"
        y1="11.5"
        x2="18.5"
        y2="11.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13.5"
        y1="14"
        x2="18.5"
        y2="14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Progress bar track */}
      <rect x="8" y="22" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.3)" />
      {/* Progress bar fill — ~65% */}
      <rect x="8" y="22" width="10.5" height="2.5" rx="1.25" fill="white" />
    </svg>
  );
}
