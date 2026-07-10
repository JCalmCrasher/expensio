import { Skeleton } from "@/components/ui/skeleton";

export function MonthlySummarySkeleton() {
  return (
    <div
      id="tour-summary"
      className="rounded-3xl bg-muted/60 px-6 py-10 text-center"
      aria-busy="true"
      aria-label="Loading monthly summary"
    >
      <Skeleton className="mx-auto h-4 w-36" />
      <Skeleton className="mx-auto mt-4 h-12 w-44" />
      <Skeleton className="mx-auto mt-4 h-4 w-52" />
      <Skeleton className="mx-auto mt-5 h-4 w-full max-w-sm" />
    </div>
  );
}
