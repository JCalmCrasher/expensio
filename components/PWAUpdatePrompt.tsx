"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      // New SW waiting to activate
      if (reg.waiting) {
        setWaiting(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(newSW);
          }
        });
      });
    });

    // When the new SW takes control, reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  if (!waiting) return null;

  function applyUpdate() {
    waiting?.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-500/30 bg-zinc-900 px-4 py-3 shadow-xl shadow-black/40">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Update available</p>
          <p className="text-xs text-zinc-400">Tap to get the latest version.</p>
        </div>
        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={applyUpdate}
          className="shrink-0 gap-1.5 font-semibold"
        >
          <RefreshCw size={12} />
          Update
        </Button>
      </div>
    </div>
  );
}
