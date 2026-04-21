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
          <DrawerHeader className="px-5 pt-2 pb-0 shrink-0 text-left">
            <DrawerTitle className="text-base font-bold text-zinc-900">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
          {footer && (
            <DrawerFooter className="shrink-0 px-5 pb-6 pt-3 border-t border-zinc-100">
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
        className={`p-0 shadow-xl border border-zinc-200 bg-white max-h-[85vh] flex flex-col overflow-hidden rounded-2xl ${dialogClassName}`}
      >
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold text-zinc-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        {footer && (
          <DialogFooter className="shrink-0 px-6 pb-6 pt-3 border-t border-zinc-100 flex gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
