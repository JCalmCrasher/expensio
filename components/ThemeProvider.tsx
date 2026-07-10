"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import { applyAccent, COLOR_MODE_STORAGE_KEY } from "@/lib/appearance";
import { useExpenseStore } from "@/store/useExpenseStore";

function AccentSync() {
  const accent = useExpenseStore((s) => s.accent);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey={COLOR_MODE_STORAGE_KEY}
      disableTransitionOnChange
    >
      <AccentSync />
      {children}
    </NextThemesProvider>
  );
}
