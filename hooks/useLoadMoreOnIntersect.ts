"use client";

import { useEffect, useRef } from "react";

export function useLoadMoreOnIntersect(
  onLoadMore: () => void,
  enabled: boolean,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "320px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  return sentinelRef;
}
