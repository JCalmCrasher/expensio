"use client";

import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { useLoadMoreOnIntersect } from "@/hooks/useLoadMoreOnIntersect";
import { ExpenseListSkeleton, ExpenseRowSkeleton } from "@/components/ExpenseRowSkeleton";
import { groupExpensesByDay } from "@/lib/groupExpensesByDay";
import {
  estimateVirtualRowSize,
  flattenExpenseList,
  type VirtualListRow,
} from "@/lib/flattenExpenseList";
import { getDocumentScrollMargin } from "@/lib/getScrollMargin";
import { getCategoryColor } from "@/lib/categoryColor";
import { useCurrency } from "@/lib/useCurrency";
import { useIsMobile } from "@/lib/useIsMobile";
import { PartialPaymentForm } from "@/components/PartialPaymentForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense, Priority } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onPaymentSubmit: (id: number, amount: number) => Promise<void>;
  onPriorityChange: (id: number, priority: Priority) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBulkDelete: (ids: number[]) => Promise<void>;
  onMarkPaid: (id: number) => Promise<void>;
  onEdit: (expense: Expense) => void;
  openPaymentFormId: number | null;
  onOpenPaymentForm: (id: number | null) => void;
}

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const SWIPE_COMMIT = 220;

const ExpenseRow = memo(function ExpenseRow({
  expense,
  selected,
  isMobile,
  onToggleSelect,
  onEdit,
  onDelete,
  onMarkPaid,
  onPriorityChange,
  onOpenPaymentForm,
  onPaymentSubmit,
  isPaymentOpen,
}: {
  expense: Expense;
  selected: boolean;
  isMobile: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  onOpenPaymentForm: (id: number | null) => void;
  onPaymentSubmit: (amount: number) => Promise<void>;
  isPaymentOpen: boolean;
}) {
  const { fmt } = useCurrency();
  const isPaid = expense.status === "paid";

  const [offsetX, setOffsetX] = useState(0);
  const [acting, setActing] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef<boolean | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isScrolling.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isMobile || !isDragging.current) return;
    const dx = startX.current - e.touches[0].clientX;
    const dy = startY.current - e.touches[0].clientY;

    if (isScrolling.current === null) {
      if (Math.abs(dy) > Math.abs(dx) * 0.7) isScrolling.current = true;
      else if (Math.abs(dx) > 8) isScrolling.current = false;
      else return;
    }
    if (isScrolling.current) {
      setOffsetX(0);
      return;
    }

    if (dx > 0) setOffsetX(Math.min(dx, SWIPE_COMMIT + 20));
    else if (!isPaid) setOffsetX(Math.max(dx, -(SWIPE_COMMIT + 20)));
  }

  async function onTouchEnd() {
    if (!isMobile) return;
    isDragging.current = false;
    if (offsetX >= SWIPE_COMMIT) {
      setActing(true);
      try {
        await onDelete();
      } finally {
        setActing(false);
        setOffsetX(0);
      }
    } else if (offsetX <= -SWIPE_COMMIT && !isPaid) {
      setActing(true);
      try {
        await onMarkPaid();
      } finally {
        setActing(false);
        setOffsetX(0);
      }
    } else {
      setOffsetX(0);
    }
  }

  return (
    <div className="pb-3">
      <div className="relative overflow-hidden rounded-2xl">
        {!isPaid && isMobile && (
          <div
            className={`absolute inset-0 flex items-center justify-start rounded-2xl bg-ring px-5 ${offsetX < 0 ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          >
            <CheckCircle2 size={20} className="text-white" />
          </div>
        )}
        {isMobile && (
          <div
            className={`absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500 px-5 ${offsetX > 0 ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          >
            <Trash2 size={20} className="text-white" />
          </div>
        )}

        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: isMobile ? `translateX(${-offsetX}px)` : undefined,
            transition: isDragging.current ? "none" : "transform 0.25s ease",
            opacity: acting ? 0.5 : 1,
          }}
          className={[
            "rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm",
            isPaid ? "opacity-70" : "",
            selected ? "ring-2 ring-ring/30" : "",
            isPaymentOpen ? "ring-1 ring-ring/25" : "",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect()}
              aria-label={`Select ${expense.title}`}
              className="mt-0.5"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${isPaid ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {expense.title}
                    </span>
                    {expense.category && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(expense.category)}`}
                      >
                        {expense.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {fmt(expense.totalAmount)}
                  </p>
                  {isPaid ? (
                    <p className="mt-0.5 text-[10px] font-medium text-accent-foreground">Paid</p>
                  ) : expense.amountPaid > 0 ? (
                    <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {fmt(expense.amountPaid)} paid
                      <span className="text-muted-foreground/50"> · </span>
                      {fmt(expense.totalAmount - expense.amountPaid)} left
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">Unpaid</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select
                  value={expense.priority}
                  onValueChange={(value) => {
                    if (value) void onPriorityChange(value as Priority);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label={`Priority for ${expense.title}`}
                    className="h-7 w-22 text-[11px] font-medium"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!isPaid && (
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    onClick={() => onOpenPaymentForm(isPaymentOpen ? null : (expense.id ?? null))}
                    className={
                      isPaymentOpen
                        ? "h-7 border-border px-2.5 text-[11px] font-semibold text-muted-foreground"
                        : "h-7 border-ring/35 bg-ring/10 px-2.5 text-[11px] font-semibold text-ring hover:bg-ring/15 hover:text-ring"
                    }
                  >
                    {isPaymentOpen ? "Close" : "Pay"}
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onEdit}
                    aria-label="Edit"
                    className="text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void onDelete()}
                    aria-label="Delete"
                    className="text-muted-foreground/50 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              {isPaymentOpen && (
                <div className="mt-3 border-t border-border pt-3">
                  <PartialPaymentForm
                    expense={expense}
                    onSubmit={async (amount) => {
                      await onPaymentSubmit(amount);
                      onOpenPaymentForm(null);
                    }}
                    onCancel={() => onOpenPaymentForm(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const VirtualRow = memo(function VirtualRow({
  row,
  isMobile,
  selected,
  openPaymentFormId,
  onToggleSelect,
  onEdit,
  onDelete,
  onMarkPaid,
  onPaymentSubmit,
  onPriorityChange,
  onOpenPaymentForm,
}: {
  row: VirtualListRow;
  isMobile: boolean;
  selected: boolean;
  openPaymentFormId: number | null;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onPaymentSubmit: (amount: number) => Promise<void>;
  onPriorityChange: (priority: Priority) => Promise<void>;
  onOpenPaymentForm: (id: number | null) => void;
}) {
  if (row.kind === "header") {
    return (
      <div className="pb-3 pt-1">
        <h3 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {row.label}
        </h3>
      </div>
    );
  }

  return (
    <ExpenseRow
      expense={row.expense}
      selected={selected}
      isMobile={isMobile}
      onToggleSelect={onToggleSelect}
      onEdit={onEdit}
      onDelete={onDelete}
      onMarkPaid={onMarkPaid}
      onPriorityChange={onPriorityChange}
      onOpenPaymentForm={onOpenPaymentForm}
      onPaymentSubmit={onPaymentSubmit}
      isPaymentOpen={openPaymentFormId === row.expense.id}
    />
  );
});

export function ExpenseList({
  expenses,
  loading = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onPaymentSubmit,
  onPriorityChange,
  onDelete,
  onBulkDelete,
  onMarkPaid,
  onEdit,
  openPaymentFormId,
  onOpenPaymentForm,
}: ExpenseListProps) {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState<number | null>(null);

  const groups = useMemo(
    () => groupExpensesByDay(expenses, { preSorted: true }),
    [expenses],
  );
  const rows = useMemo(
    () => flattenExpenseList(groups, openPaymentFormId),
    [groups, openPaymentFormId],
  );

  const ids = useMemo(() => expenses.map((e) => e.id!), [expenses]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const loadMoreRef = useLoadMoreOnIntersect(
    () => onLoadMore?.(),
    Boolean(hasMore && !loadingMore && onLoadMore),
  );

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const update = () => setScrollMargin(getDocumentScrollMargin(el));
    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [expenses.length]);
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: (index) => estimateVirtualRowSize(rows[index]),
    overscan: 6,
    scrollMargin: scrollMargin ?? 0,
    enabled: scrollMargin !== null,
    getItemKey: (index) => rows[index].id,
  });

  useLayoutEffect(() => {
    if (scrollMargin === null) return;
    virtualizer.measure();
  }, [openPaymentFormId, rows.length, scrollMargin]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      await onBulkDelete([...selected]);
      setSelected(new Set());
      setConfirmBulk(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <ExpenseListSkeleton count={6} />;
  }
  if (expenses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">No expenses yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Type above and press Enter to add your first one.
        </p>
      </div>
    );
  }

  return (
    <div id="tour-expenses" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all expenses"
          />
          {allSelected ? "Deselect all" : "Select all"}
        </label>

        {someSelected && !confirmBulk && (
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setConfirmBulk(true)}
            className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Delete {selected.size} selected
          </Button>
        )}
        {someSelected && confirmBulk && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive-solid"
              size="compact"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Confirm"}
            </Button>
            <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmBulk(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div ref={listRef} className="relative w-full">
        {scrollMargin === null ? (
          <ExpenseListSkeleton count={5} />
        ) : (
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];

            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                }}
              >
                <VirtualRow
                  row={row}
                  isMobile={isMobile}
                  selected={row.kind === "expense" ? selected.has(row.expense.id!) : false}
                  openPaymentFormId={openPaymentFormId}
                  onToggleSelect={() => row.kind === "expense" && toggleOne(row.expense.id!)}
                  onEdit={() => row.kind === "expense" && onEdit(row.expense)}
                  onDelete={() =>
                    row.kind === "expense" && row.expense.id
                      ? onDelete(row.expense.id)
                      : Promise.resolve()
                  }
                  onMarkPaid={() =>
                    row.kind === "expense" && row.expense.id
                      ? onMarkPaid(row.expense.id)
                      : Promise.resolve()
                  }
                  onPaymentSubmit={(amount) =>
                    row.kind === "expense" && row.expense.id
                      ? onPaymentSubmit(row.expense.id, amount)
                      : Promise.resolve()
                  }
                  onPriorityChange={(priority) =>
                    row.kind === "expense" && row.expense.id
                      ? onPriorityChange(row.expense.id, priority)
                      : Promise.resolve()
                  }
                  onOpenPaymentForm={onOpenPaymentForm}
                />
              </div>
            );
          })}
        </div>
        )}
        <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />
        {loadingMore && (
          <div className="pt-1" aria-busy="true" aria-label="Loading more expenses">
            <ExpenseRowSkeleton />
            <ExpenseRowSkeleton />
          </div>
        )}
        {hasMore && !loadingMore && (
          <p className="py-6 text-center text-xs text-muted-foreground">Scroll for more</p>
        )}
      </div>
    </div>
  );
}
