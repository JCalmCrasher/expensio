"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useExpenseStore } from "@/store/useExpenseStore";
import type { AccentColor } from "@/lib/appearance";
import { ACCENT_OPTIONS } from "@/lib/appearance";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function AppearancePopover() {
  const { theme, setTheme } = useTheme();
  const accent = useExpenseStore((s) => s.accent);
  const setAccent = useExpenseStore((s) => s.setAccent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-28 w-56" aria-hidden />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Theme</p>
        <ToggleGroup
          value={theme}
          onValueChange={(value) => {
            if (value) setTheme(value);
          }}
        >
          <ToggleGroupItem value="light">Light</ToggleGroupItem>
          <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          <ToggleGroupItem value="system">System</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Accent</p>
        <div className="flex gap-2.5">
          {ACCENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-label={option.label}
              aria-pressed={accent === option.id}
              onClick={() => setAccent(option.id as AccentColor)}
              className={cn(
                "size-8 rounded-full border-2 transition-transform",
                accent === option.id
                  ? "scale-110 border-foreground"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: option.swatch }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
