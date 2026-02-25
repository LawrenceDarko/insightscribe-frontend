import { Suspense } from "react";
import Link from "next/link";
import { ProjectOverview } from "@/features/projects/ProjectOverview";
import { Button, Skeleton, Card, CardContent } from "@/components/ui";

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="space-y-2 py-5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-7 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <ProjectOverview projectId={params.id} />
    </Suspense>
  );
}
