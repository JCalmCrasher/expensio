"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Link from "next/link";
import {
  Command,
  HelpCircle,
  Search,
  Settings,
  X,
} from "lucide-react";
import { DataMenu } from "@/components/DataMenu";
import { RolloverButton } from "@/components/RolloverButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShortcut } from "@/lib/keyboard";
import { CURRENCY_CONFIG, useExpenseStore, type Currency } from "@/store/useExpenseStore";

export type AppTopBarHandle = {
  focusSearch: () => void;
};

interface AppTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenCommand: () => void;
  importOpen: boolean;
  onImportOpenChange: (open: boolean) => void;
  activeMonthKey: string;
  onNavigateMonth: (monthKey: string) => void;
  onImportComplete?: () => void;
  hasUnpaid: boolean;
  onRollover: () => Promise<void>;
  onOpenSettings: () => void;
  onStartTour: () => void;
}

export const AppTopBar = forwardRef<AppTopBarHandle, AppTopBarProps>(function AppTopBar(
  {
    search,
    onSearchChange,
    onOpenCommand,
    importOpen,
    onImportOpenChange,
    activeMonthKey,
    onNavigateMonth,
    onImportComplete,
    hasUnpaid,
    onRollover,
    onOpenSettings,
    onStartTour,
  },
  ref,
) {
  const { currency, setCurrency } = useExpenseStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch() {
      if (window.matchMedia("(max-width: 639px)").matches) {
        setSearchOpen(true);
        setTimeout(() => mobileSearchRef.current?.focus(), 50);
        return;
      }
      searchRef.current?.focus();
    },
  }));

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3">
          <Link href="/">
            <h1 className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
              Expensio
            </h1>
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            <span id="tour-commands" className="inline-flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenCommand}
                aria-label="Open command menu"
                title="Commands"
                className="hidden h-8 gap-1.5 border-border bg-card px-2 text-muted-foreground sm:inline-flex"
              >
                <Command size={14} />
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {formatShortcut(["mod", "K"])}
                </kbd>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onOpenCommand}
                aria-label="Commands"
                title="Commands"
                className="text-muted-foreground sm:hidden"
              >
                <Command size={16} />
              </Button>
            </span>

            <div
              id="tour-search"
              className="relative hidden min-w-0 flex-1 sm:block sm:max-w-44"
            >
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground/60"
              />
              <Input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search…"
                aria-label="Search expenses"
                className="bg-card py-2 pl-8 pr-7 focus-visible:border-ring focus-visible:ring-ring/20"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    onSearchChange("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                >
                  <X size={13} />
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => mobileSearchRef.current?.focus(), 50);
              }}
              aria-label="Search"
              className="text-muted-foreground sm:hidden"
            >
              <Search size={16} />
            </Button>

            <div className="flex shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
              {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => {
                const { symbol, flag } = CURRENCY_CONFIG[c];
                return (
                  <Button
                    key={c}
                    type="button"
                    variant={currency === c ? "pill-active" : "pill"}
                    onClick={() => setCurrency(c)}
                    aria-label={`Switch to ${c}`}
                    title={c}
                    className="px-1.5 sm:px-2"
                  >
                    <span className="hidden sm:inline">{flag}</span>
                    <span>{symbol}</span>
                  </Button>
                );
              })}
            </div>

            <DataMenu
              importOpen={importOpen}
              onImportOpenChange={onImportOpenChange}
              activeMonthKey={activeMonthKey}
              onImportComplete={onImportComplete}
              onNavigateMonth={onNavigateMonth}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onOpenSettings}
              aria-label="Settings"
              title="Settings"
              className="text-muted-foreground"
            >
              <Settings size={15} />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onStartTour}
              aria-label="Take a tour"
              title="Take a tour"
              className="text-muted-foreground"
            >
              <HelpCircle size={15} />
            </Button>

            <div id="tour-rollover">
              <RolloverButton
                hasUnpaid={hasUnpaid}
                activeMonthKey={activeMonthKey}
                onRollover={onRollover}
              />
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-30 sm:hidden"
            onClick={() => setSearchOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 left-0 z-40 flex items-center gap-2 bg-card px-4 py-3 shadow-lg sm:hidden">
            <div className="relative flex-1">
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                ref={mobileSearchRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search expenses…"
                aria-label="Search expenses"
                className="border-ring/40 bg-card py-2.5 pl-8 pr-7 ring-2 ring-ring/30 focus-visible:outline-none"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onSearchChange("")}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="link-brand"
              size="sm"
              onClick={() => setSearchOpen(false)}
              className="shrink-0 font-medium"
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </>
  );
});
