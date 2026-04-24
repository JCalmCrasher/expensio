"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload, X, LayoutDashboard, FileJson, FileText } from "lucide-react";
import { exportJSON, exportCSV } from "@/lib/exportImport";
import { ImportModal } from "@/components/ImportModal";
import { Logo } from "@/components/Logo";

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [importOpen, setImportOpen] = useState(false);

  async function handleExportJSON() {
    const json = await exportJSON();
    download(json, `expensio-${today()}.json`, "application/json");
  }

  async function handleExportCSV() {
    const csv = await exportCSV();
    download(csv, `expensio-${today()}.csv`, "text/csv");
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

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-sm font-bold text-white">Expensio</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 lg:hidden"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Navigation section */}
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Navigation
        </p>
        <button
          onClick={onClose}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <LayoutDashboard size={15} className="text-green-400" />
          Dashboard
        </button>

        {/* Export section */}
        <p className="px-2 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Export
        </p>
        <button
          onClick={handleExportJSON}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <FileJson size={15} className="text-emerald-400" />
          Export as JSON
        </button>
        <button
          onClick={handleExportCSV}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <FileText size={15} className="text-emerald-400" />
          Export as CSV
        </button>

        {/* Import section */}
        <p className="px-2 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Import
        </p>
        <button
          onClick={() => setImportOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <Upload size={15} className="text-blue-400" />
          Import expenses
        </button>
        <p className="px-3 text-[10px] leading-relaxed text-zinc-600">
          Supports JSON and CSV. Format guide shown before upload.
        </p>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      {/* Import modal — rendered inside sidebar so it has access to state */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop: sticky */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-white/5"
        aria-label="App sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Mobile: drawer */}
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
