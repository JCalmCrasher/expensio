"use client";

import dynamic from "next/dynamic";

const ExpenseApp = dynamic(() => import("@/components/ExpenseApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-zinc-400">Loading…</div>
  ),
});

export function ExpenseAppShell() {
  return <ExpenseApp />;
}
