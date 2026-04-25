import { Suspense } from "react";
import { InsightsView } from "@/features/insights/InsightsView";
import { Skeleton } from "@/components/ui";

function InsightsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

export default function InsightsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Insights</h1>
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsView projectId={params.id} />
      </Suspense>
    </div>
  );
}
