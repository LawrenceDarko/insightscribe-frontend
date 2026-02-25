import { Skeleton } from "@/components/ui";

/**
 * Loading fallback for dashboard routes.
 * Renders inside the AppShell (sidebar + topbar are already visible).
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-800"
          >
            <Skeleton className="h-4 w-2/3 mb-3" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
