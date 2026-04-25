import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { SummaryNotesView } from "@/features/insights/SummaryNotesView";

function SummaryNotesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function SummaryNotesPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Summary Notes</h1>
      <Suspense fallback={<SummaryNotesSkeleton />}>
        <SummaryNotesView projectId={params.id} />
      </Suspense>
    </div>
  );
}
