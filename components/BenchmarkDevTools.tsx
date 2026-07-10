"use client";

import { useEffect } from "react";
import {
  clearBenchmarkExpenses,
  countBenchmarkExpenses,
  seedBenchmarkExpenses,
} from "@/lib/seedBenchmark";

declare global {
  interface Window {
    expensio?: {
      seed: typeof seedBenchmarkExpenses;
      clear: typeof clearBenchmarkExpenses;
      count: typeof countBenchmarkExpenses;
    };
  }
}

export function BenchmarkDevTools() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    window.expensio = {
      seed: seedBenchmarkExpenses,
      clear: clearBenchmarkExpenses,
      count: countBenchmarkExpenses,
    };

    console.info(
      "[expensio] Benchmark helpers ready:\n" +
        "  await expensio.seed(10000)\n" +
        '  await expensio.seed(10000, "july 2026")\n' +
        '  await expensio.seed(10000, ["june 2026", "july 2026"])\n' +
        "  await expensio.seed(10000, { clearFirst: true })\n" +
        '  await expensio.seed(10000, "july 2026", { clearFirst: true })\n' +
        "  await expensio.clear()\n" +
        "  await expensio.count()",
    );

    return () => {
      delete window.expensio;
    };
  }, []);

  return null;
}
