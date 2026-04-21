"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Upload,
  X,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { exportData, importData } from "@/lib/exportImport";

interface AppSidebarProps {
  /** Controls the mobile drawer open state */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const json = await exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expensio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { imported, errors } = await importData(text);
    setImportStatus(
      errors.length > 0
        ? `Imported ${imported}, ${errors.length} error(s): ${errors[0]}`
        : `✓ Imported ${imported} expense${imported !== 1 ? "s" : ""}`
    );
    if (fileRef.current) fileRef.current.value = "";
    setTimeout(() => setImportStatus(null), 4000);
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
            E
          </span>
          <span className="text-sm font-bold text-white">Expensio</span>
        </div>
        {/* Close button — only shown on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:hidden"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Navigation
        </p>
        <button
          onClick={onClose}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <LayoutDashboard size={15} className="text-violet-400" />
          Dashboard
        </button>

        <p className="px-2 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Data
        </p>

        <button
          onClick={handleExport}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Download size={15} className="text-emerald-400" />
          Export data
        </button>

        <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-within:ring-2 focus-within:ring-violet-500">
          <Upload size={15} className="text-blue-400" />
          Import data
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="sr-only"
          />
        </label>

        {importStatus && (
          <div className="mx-2 mt-2 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
            {importStatus}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>
    </div>
  );
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* ── Desktop: always-visible sticky sidebar ── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-white/5"
        aria-label="App sidebar"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: slide-in drawer ── */}
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
