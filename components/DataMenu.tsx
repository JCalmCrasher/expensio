"use client";

import { useState } from "react";
import { ChevronLeft, FileJson, FileText, MoreHorizontal, Palette, Upload } from "lucide-react";
import { exportCSV, exportJSON } from "@/lib/exportImport";
import { ImportModal } from "@/components/ImportModal";
import { AppearancePopover } from "@/components/AppearancePopover";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DataMenuProps {
  importOpen: boolean;
  onImportOpenChange: (open: boolean) => void;
  activeMonthKey: string;
  onImportComplete?: () => void;
  onNavigateMonth?: (monthKey: string) => void;
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataMenu({
  importOpen,
  onImportOpenChange,
  activeMonthKey,
  onImportComplete,
  onNavigateMonth,
}: DataMenuProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  async function handleExportJSON() {
    download(await exportJSON(), `expensio-${today}.json`, "application/json");
    setMenuOpen(false);
  }

  async function handleExportCSV() {
    download(await exportCSV(), `expensio-${today}.csv`, "text/csv");
    setMenuOpen(false);
  }

  function handleImport() {
    onImportOpenChange(true);
    setMenuOpen(false);
    setAppearanceOpen(false);
  }

  return (
    <>
      <Popover
        open={menuOpen || appearanceOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMenuOpen(false);
            setAppearanceOpen(false);
          } else {
            setMenuOpen(true);
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Data options"
              className="text-muted-foreground"
            >
              <MoreHorizontal size={18} />
            </Button>
          }
        />
        <PopoverContent align="end" className={appearanceOpen ? "w-64 p-4" : "w-52 p-1.5"}>
          {appearanceOpen ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setAppearanceOpen(false)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <AppearancePopover />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleExportJSON()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <FileJson size={15} className="text-ring" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => void handleExportCSV()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <FileText size={15} className="text-ring" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <Upload size={15} className="text-muted-foreground" />
                Import expenses
              </button>
              <button
                type="button"
                onClick={() => setAppearanceOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <Palette size={15} className="text-ring" />
                Appearance
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>

      <ImportModal
        open={importOpen}
        onClose={() => onImportOpenChange(false)}
        activeMonthKey={activeMonthKey}
        onImportComplete={onImportComplete}
        onNavigateMonth={onNavigateMonth}
      />
    </>
  );
}
