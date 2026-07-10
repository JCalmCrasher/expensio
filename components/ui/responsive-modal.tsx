"use client";

import * as React from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Extra className for the dialog content (desktop) */
  dialogClassName?: string;
  /** Extra className for the drawer content (mobile) */
  drawerClassName?: string;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  dialogClassName = "",
  drawerClassName = "",
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={`max-h-[90vh] flex flex-col ${drawerClassName}`}>
          <DrawerHeader className="shrink-0 px-5 pt-2 pb-0 text-left">
            <DrawerTitle className="text-base font-bold text-foreground">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && (
            <DrawerFooter className="shrink-0 border-t border-border px-5 pt-3 pb-6">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl ${dialogClassName}`}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-0">
          <DialogTitle className="text-base font-bold text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <DialogFooter className="flex shrink-0 gap-2 border-t border-border px-6 pt-3 pb-6">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
