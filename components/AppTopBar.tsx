"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
  const popoutInputRef = useRef<HTMLInputElement>(null);

  function openSearch() {
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
  }

  useImperativeHandle(ref, () => ({
    focusSearch() {
      openSearch();
    },
  }));

  useEffect(() => {
    if (!searchOpen) return;

    const id = window.setTimeout(() => popoutInputRef.current?.focus(), 30);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  const hasQuery = search.trim().length > 0;

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

            <div id="tour-search" className="min-w-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openSearch}
                aria-label={hasQuery ? `Search: ${search}` : "Search expenses"}
                title="Search"
                className={[
                  "hidden h-8 max-w-44 gap-1.5 border-border bg-card px-2 text-muted-foreground sm:inline-flex",
                  hasQuery ? "border-ring/40 text-foreground" : "",
                ].join(" ")}
              >
                <Search size={13} className="shrink-0 opacity-60" />
                <span className="min-w-0 truncate text-left text-xs">
                  {hasQuery ? search : "Search…"}
                </span>
                {hasQuery ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Clear search"
                    className="ml-0.5 inline-flex rounded p-0.5 hover:bg-muted hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onSearchChange("");
                      }
                    }}
                  >
                    <X size={12} />
                  </span>
                ) : (
                  <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    /
                  </kbd>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={openSearch}
                aria-label="Search"
                className={[
                  "text-muted-foreground sm:hidden",
                  hasQuery ? "text-ring" : "",
                ].join(" ")}
              >
                <Search size={16} />
              </Button>
            </div>

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
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search expenses">
          {/* Soft scrim — light enough that filtered results stay readable */}
          <button
            type="button"
            className="absolute inset-0 bg-background/45 backdrop-blur-[0.5px] transition-opacity"
            aria-label="Close search"
            onClick={closeSearch}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-16">
            <div
              className="pointer-events-auto w-full max-w-lg origin-top animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-md dark:shadow-black/40">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    ref={popoutInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search expenses…"
                    aria-label="Search expenses"
                    autoComplete="off"
                    className="h-11 border-border bg-background py-2.5 pr-20 pl-10 text-sm text-foreground shadow-none"
                  />
                  <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
                    {hasQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          onSearchChange("");
                          popoutInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={closeSearch}
                      className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Done
                    </Button>
                  </div>
                </div>
                <p className="mt-2 px-1 text-[11px] text-muted-foreground">
                  Results update in the list below. Press Esc or Done to close.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
