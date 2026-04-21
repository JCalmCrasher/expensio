"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      style={
        {
          "--normal-bg": "#18181b",
          "--normal-text": "#e4e4e7",
          "--normal-border": "rgba(255,255,255,0.08)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
