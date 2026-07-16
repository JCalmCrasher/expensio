"use client";

import { Sparkles } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { WHATS_NEW_ITEMS, WHATS_NEW_VERSION } from "@/lib/whatsNew";

interface WhatsNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the dialog closes. `force` = user clicked Got it / Take the tour. */
  onDismiss: (options?: { force?: boolean }) => void;
  onStartTour?: () => void;
}

export function WhatsNewDialog({
  open,
  onOpenChange,
  onDismiss,
  onStartTour,
}: WhatsNewDialogProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) onDismiss();
      }}
      title="What's new"
      dialogClassName="sm:max-w-lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onStartTour && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onDismiss({ force: true });
                onStartTour();
              }}
            >
              Take the tour
            </Button>
          )}
          <Button type="button" variant="brand" onClick={() => onDismiss({ force: true })}>
            Got it
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ring/15 text-ring">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              A few recent upgrades worth knowing. This is a quick changelog, not the full product tour.
            </p>
            <p className="mt-1 text-[11px] tabular-nums text-muted-foreground/70">
              Updated: {WHATS_NEW_VERSION}
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {WHATS_NEW_ITEMS.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-border bg-muted/40 px-3.5 py-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </ResponsiveModal>
  );
}
