"use client";

import dynamic from "next/dynamic";
import { BenchmarkDevTools } from "@/components/BenchmarkDevTools";

const ExpenseApp = dynamic(() => import("@/components/ExpenseApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-muted-foreground">Loading expenses…</div>
  ),
});

export function ExpenseAppShell() {
  return (
    <>
      <BenchmarkDevTools />
      <ExpenseApp />
    </>
  );
}
