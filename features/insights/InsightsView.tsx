"use client";

import { useCallback, useEffect, useState } from "react";
import { insightsApi, type InsightsResponse } from "@/lib/api";
import type { InsightReportListItem, InsightTheme, ReportType } from "@/types";
import { Button, Card, CardContent } from "@/components/ui";
import { Skeleton } from "@/components/ui";

const SECTIONS: (keyof InsightsResponse)[] = [
  "feature_requests",
  "frustrations",
  "positive_themes",
  "negative_themes",
  "onboarding_issues",
];

const SECTION_LABELS: Record<string, string> = {
  feature_requests: "Top feature requests",
  frustrations: "Most common frustrations",
  positive_themes: "Positive themes",
  negative_themes: "Negative themes",
  onboarding_issues: "Onboarding issues",
};

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string; description: string }[] = [
  { value: "full", label: "Full Report", description: "Comprehensive analysis across all categories" },
  { value: "feature_requests", label: "Feature Requests", description: "Top feature requests from interviews" },
  { value: "frustrations", label: "Frustrations", description: "Most common pain points and complaints" },
  { value: "positive_themes", label: "Positive Themes", description: "What users love and appreciate" },
  { value: "negative_themes", label: "Negative Themes", description: "Areas of criticism and dissatisfaction" },
  { value: "onboarding", label: "Onboarding Issues", description: "First-time experience and setup problems" },
];

function removeDeletedReportThemes(
  current: InsightsResponse | null,
  deletedReportIds: string[]
): InsightsResponse | null {
  if (!current || deletedReportIds.length === 0) return current;

  const shouldKeep = (themeId?: string) => {
    if (!themeId) return true;
    return !deletedReportIds.some((reportId) => themeId.startsWith(`${reportId}-`));
  };

  return {
    feature_requests: current.feature_requests?.filter((theme) => shouldKeep(theme.id)),
    frustrations: current.frustrations?.filter((theme) => shouldKeep(theme.id)),
    positive_themes: current.positive_themes?.filter((theme) => shouldKeep(theme.id)),
    negative_themes: current.negative_themes?.filter((theme) => shouldKeep(theme.id)),
    onboarding_issues: current.onboarding_issues?.filter((theme) => shouldKeep(theme.id)),
  };
}

export function InsightsView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [reports, setReports] = useState<InsightReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [insightsData, reportItems] = await Promise.all([
        insightsApi.get(projectId),
        insightsApi.listReports(projectId),
      ]);
      setData(insightsData);
      setReports(reportItems);
      setSelectedReportIds((prev) => {
        if (prev.size === 0) return prev;
        const valid = new Set(reportItems.map((r) => r.id));
        const next = new Set<string>();
        prev.forEach((id) => {
          if (valid.has(id)) next.add(id);
        });
        return next;
      });
    } catch {
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleGenerate = async (reportType: ReportType) => {
    setGenerating(reportType);
    setGenError(null);
    try {
      await insightsApi.generateReport(projectId, reportType);
      // Refresh the insights after successful generation
      await fetchInsights();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate report. Please try again.";
      setGenError(msg);
    } finally {
      setGenerating(null);
    }
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const toggleSelectAllReports = () => {
    setSelectedReportIds((prev) => {
      const selectable = reports.filter((r) => r.status !== "processing" && r.status !== "pending");
      if (selectable.length === 0) return new Set();

      const allSelected = selectable.every((r) => prev.has(r.id));
      if (allSelected) return new Set();

      return new Set(selectable.map((r) => r.id));
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedReportIds.size === 0) return;

    const reportIdsToDelete = Array.from(selectedReportIds);

    const confirmed = window.confirm(
      `Delete ${reportIdsToDelete.length} selected insight report(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await Promise.all(
        reportIdsToDelete.map((reportId) =>
          insightsApi.deleteReport(projectId, reportId)
        )
      );

      // Optimistic UI update: remove deleted reports/themes immediately.
      setSelectedReportIds((prev) => {
        const next = new Set(prev);
        reportIdsToDelete.forEach((id) => next.delete(id));
        return next;
      });
      setReports((prev) => prev.filter((report) => !reportIdsToDelete.includes(report.id)));
      setData((prev) => removeDeletedReportThemes(prev, reportIdsToDelete));

      // Re-sync with backend in case any state changed on server side.
      await fetchInsights();
    } catch {
      setDeleteError("Failed to delete selected insights. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const hasInsights = data && SECTIONS.some((k) => (data[k]?.length ?? 0) > 0);
  const selectableReports = reports.filter((r) => r.status !== "processing" && r.status !== "pending");
  const hasSelectedReports = selectedReportIds.size > 0;
  const allSelectableReportsSelected =
    selectableReports.length > 0 && selectableReports.every((r) => selectedReportIds.has(r.id));

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="py-8 text-center text-red-700 dark:text-red-400">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Generate Reports Panel */}
      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            Generate Insights
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
            Analyze your processed interviews using AI to extract themes, feature requests, and sentiment.
          </p>
          {genError && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {genError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={generating !== null}
                onClick={() => handleGenerate(opt.value)}
                className="group relative flex flex-col items-start gap-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 text-left transition hover:border-primary-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === opt.value && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 dark:bg-surface-800/80">
                    <svg
                      className="h-5 w-5 animate-spin text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                <span className="font-medium text-surface-900 dark:text-surface-100 group-hover:text-primary-700 dark:group-hover:text-primary-400">
                  {opt.label}
                </span>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manage Reports Panel */}
      <Card>
        <CardContent className="py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsManageOpen((open) => !open)}
              className="flex items-center gap-2 text-left"
              aria-expanded={isManageOpen}
              aria-controls="manage-insight-reports-content"
            >
              <svg
                className={`h-4 w-4 text-surface-500 transition-transform dark:text-surface-400 ${
                  isManageOpen ? "rotate-90" : "rotate-0"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Manage Insight Reports
              </h2>
            </button>
          </div>

          <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">
            Select one or more generated insight reports and delete them.
          </p>

          {isManageOpen && (
            <div id="manage-insight-reports-content">
              <div className="mb-4 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={toggleSelectAllReports}
                  disabled={deleting || selectableReports.length === 0}
                >
                  {allSelectableReportsSelected ? "Clear selection" : "Select all"}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteSelected}
                  isLoading={deleting}
                  disabled={!hasSelectedReports}
                >
                  Delete selected ({selectedReportIds.size})
                </Button>
              </div>

              {deleteError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                  {deleteError}
                </div>
              )}

              {reports.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  No insight reports generated yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => {
                    const isSelectable = report.status !== "processing" && report.status !== "pending";
                    const checked = selectedReportIds.has(report.id);

                    return (
                      <label
                        key={report.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-surface-200 bg-white px-3 py-3 text-sm transition hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:hover:border-surface-600"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!isSelectable || deleting}
                          onChange={() => toggleReportSelection(report.id)}
                          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-surface-900 dark:text-surface-100">
                            {report.title}
                          </p>
                          <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                            Type: {report.report_type} | Status: {report.status} | Themes: {report.theme_count} | Chunks: {report.chunks_analyzed}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Results */}
      {SECTIONS.map((key) => {
        const themes = data?.[key];
        if (!themes?.length) return null;
        const label = SECTION_LABELS[key] ?? key;
        return (
          <section key={key}>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {label}
            </h2>
            <div className="space-y-4">
              {themes.map((theme, i) => (
                <InsightCard key={theme.id} theme={theme} rank={i + 1} />
              ))}
            </div>
          </section>
        );
      })}

      {!hasInsights && (
        <Card>
          <CardContent className="py-12 text-center text-surface-600 dark:text-surface-400">
            No insights yet. Use the panel above to generate insights from your processed interviews.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InsightCard({
  theme,
  rank,
}: {
  theme: InsightTheme;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const quotes = theme.quotes ?? theme.supporting_quotes?.map((q) => q.text) ?? [];
  const displayTitle = theme.title ?? theme.theme;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-surface-900 dark:text-surface-100">
              {rank}. {displayTitle}
            </p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-surface-500 dark:text-surface-400">
              {theme.frequency != null && (
                <span>Mentions: {theme.frequency}</span>
              )}
              {theme.sentiment_score != null && (
                <span>Sentiment: {theme.sentiment_score.toFixed(1)}</span>
              )}
            </div>
            {quotes.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mt-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                {expanded ? "Hide quotes" : `Show ${quotes.length} quote(s)`}
              </button>
            )}
            {expanded && quotes.length > 0 && (
              <ul className="mt-2 space-y-2 pl-4 border-l-2 border-surface-200 dark:border-surface-600">
                {quotes.map((q, i) => (
                  <li key={i} className="text-sm italic text-surface-600 dark:text-surface-300">
                    &quot;{q}&quot;
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
