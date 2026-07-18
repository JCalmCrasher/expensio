"use client";
import { useEffect } from "react";

export function SafariSWSilencer() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!isSafari) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
  }, []);

  return null;
}