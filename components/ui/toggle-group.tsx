"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToggleGroupContextValue = {
  value?: string;
  onChange?: (value: string) => void;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue>({});

function ToggleGroup({
  className,
  value,
  onValueChange,
  children,
}: {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <ToggleGroupContext.Provider value={{ value, onChange: onValueChange }}>
      <div
        role="radiogroup"
        className={cn("inline-flex w-full rounded-lg bg-muted p-1", className)}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

function ToggleGroupItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { value: selected, onChange } = useContext(ToggleGroupContext);
  const isSelected = selected === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onChange?.(value)}
      className={cn(
        "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export { ToggleGroup, ToggleGroupItem };
