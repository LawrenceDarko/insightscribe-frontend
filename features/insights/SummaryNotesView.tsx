"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { insightsApi } from "@/lib/api";
import type { InsightReport } from "@/types";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { getErrorMessage } from "@/lib/api";

export function SummaryNotesView({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InsightReport | null>(null);

  const fetchLatestSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reports = await insightsApi.listReports(projectId, "full");
      const latestCompleted = reports.find((r) => r.status === "completed");

      if (!latestCompleted) {
        setReport(null);
        return;
      }

      const fullReport = await insightsApi.getReport(projectId, latestCompleted.id);
      setReport(fullReport);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLatestSummary();
  }, [fetchLatestSummary]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const generated = await insightsApi.generateReport(projectId, "full");
      setReport(generated);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const generatedAt = useMemo(() => {
    if (!report?.created_at) return "";
    return new Date(report.created_at).toLocaleString();
  }, [report?.created_at]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Project Summary Notes
          </h2>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            Generate an executive summary across interviews in this project. Summary notes are generated only when you click the button below.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleGenerate} isLoading={generating}>
              Generate summary notes
            </Button>
            {report && (
              <Button variant="secondary" onClick={fetchLatestSummary} disabled={generating}>
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {report?.content?.summary ? (
        <Card>
          <CardContent className="py-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                Latest Project-wide Summary
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Generated {generatedAt}
              </p>
            </div>

            <p className="whitespace-pre-line text-sm leading-7 text-surface-700 dark:text-surface-300">
              {report.content.summary}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SummaryStat label="Interviews included" value={String(report.metadata?.interviews_included ?? 0)} />
              <SummaryStat label="Chunks analyzed" value={String(report.metadata?.chunks_analyzed ?? 0)} />
              <SummaryStat
                label="Generation time"
                value={`${report.metadata?.generation_time_seconds ?? 0}s`}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-surface-600 dark:text-surface-400">
            No summary notes yet. Click Generate summary notes to create one from your project interviews.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-3 dark:border-surface-700 dark:bg-surface-800">
      <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-surface-900 dark:text-surface-100">{value}</p>
    </div>
  );
}
