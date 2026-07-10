"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EXPENSE_PAGE_SIZE,
  countMonthExpenses,
  fetchMonthExpensePage,
  searchMonthExpenses,
} from "@/lib/monthExpenseQueries";
import type { Expense } from "@/types/expense";

export function usePaginatedMonthExpenses(
  monthKey: string,
  search: string,
  liveVersion: number,
) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const searchKey = search.trim().toLowerCase();
  const isSearching = searchKey.length > 0;

  useEffect(() => {
    let cancelled = false;
    offsetRef.current = 0;
    setLoading(true);
    setExpenses([]);
    setHasMore(false);

    (async () => {
      if (isSearching) {
        const rows = await searchMonthExpenses(monthKey, searchKey);
        if (cancelled) return;
        setExpenses(rows);
        setTotalCount(rows.length);
        setHasMore(false);
        setLoading(false);
        return;
      }

      const [page, count] = await Promise.all([
        fetchMonthExpensePage(monthKey, 0, EXPENSE_PAGE_SIZE),
        countMonthExpenses(monthKey),
      ]);

      if (cancelled) return;
      setExpenses(page);
      setTotalCount(count);
      offsetRef.current = page.length;
      setHasMore(page.length < count);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [monthKey, searchKey, isSearching, liveVersion]);

  const loadMore = useCallback(async () => {
    if (isSearching || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const page = await fetchMonthExpensePage(
        monthKey,
        offsetRef.current,
        EXPENSE_PAGE_SIZE,
      );
      offsetRef.current += page.length;
      setExpenses((prev) => [...prev, ...page]);
      setHasMore(offsetRef.current < totalCount);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, isSearching, loadingMore, monthKey, totalCount]);

  const patchExpense = useCallback((id: number, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  }, []);

  const removeExpenses = useCallback((ids: number[]) => {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => e.id != null && !idSet.has(e.id)));
    setTotalCount((prev) => Math.max(0, prev - ids.length));
    offsetRef.current = Math.max(0, offsetRef.current - ids.length);
  }, []);

  return {
    expenses,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    isSearching,
    patchExpense,
    removeExpenses,
  };
}
