import { Skeleton } from "@/components/ui/skeleton";

export function ExpenseRowSkeleton() {
  return (
    <div className="pb-2.5">
      <div className="rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px]" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-[42%] max-w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="shrink-0 space-y-2 text-right">
                <Skeleton className="ml-auto h-4 w-14" />
                <Skeleton className="ml-auto h-5 w-12 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-22 rounded-lg" />
              <Skeleton className="h-7 w-14 rounded-lg" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpenseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading expenses">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-[4px]" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div>
        {Array.from({ length: count }, (_, i) => (
          <ExpenseRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function DayHeaderSkeleton() {
  return (
    <div className="pb-3 pt-1">
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
