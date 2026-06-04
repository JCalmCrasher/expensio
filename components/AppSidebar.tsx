"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, Upload, X,
  FileJson, FileText,
} from "lucide-react";
import { exportJSON, exportCSV } from "@/lib/exportImport";
import { ImportModal } from "@/components/ImportModal";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [importOpen, setImportOpen] = useState(false);

  async function handleExportJSON() {
    const json = await exportJSON();
    dl(json, `expensio-${today()}.json`, "application/json");
  }

  async function handleExportCSV() {
    const csv = await exportCSV();
    dl(csv, `expensio-${today()}.csv`, "text/csv");
  }

  function dl(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-5">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-sm font-bold text-white">Expensio</span>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="sidebar"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-zinc-500 hover:text-white lg:hidden"
          >
            <X size={15} />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Data
        </p>
        <Button type="button" variant="sidebar" onClick={handleExportJSON}>
          <FileJson size={15} className="text-emerald-400" />
          Export JSON
        </Button>
        <Button type="button" variant="sidebar" onClick={handleExportCSV}>
          <FileText size={15} className="text-emerald-400" />
          Export CSV
        </Button>
        <Button type="button" variant="sidebar" onClick={() => setImportOpen(true)}>
          <Upload size={15} className="text-blue-400" />
          Import expenses
        </Button>
        <p className="px-3 pt-1 text-[10px] leading-relaxed text-zinc-600">JSON or CSV files.</p>
      </nav>

      <div className="border-t border-white/5 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      <aside
        className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0 lg:flex-col border-r border-white/5"
        aria-label="App sidebar"
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-full w-64 lg:hidden",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="App sidebar"
      >
        <SidebarContent onClose={onMobileClose} />
      </aside>
    </>
  );
}
