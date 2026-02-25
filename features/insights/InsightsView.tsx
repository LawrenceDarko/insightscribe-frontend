"use client";

import { useCallback, useEffect, useState } from "react";
import { insightsApi, type InsightsResponse } from "@/lib/api";
import type { InsightTheme, ReportType } from "@/types";
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

export function InsightsView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const fetchInsights = useCallback(() => {
    setLoading(true);
    setError(null);
    insightsApi
      .get(projectId)
      .then(setData)
      .catch(() => setError("Failed to load insights"))
      .finally(() => setLoading(false));
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
      fetchInsights();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate report. Please try again.";
      setGenError(msg);
    } finally {
      setGenerating(null);
    }
  };

  const hasInsights = data && SECTIONS.some((k) => (data[k]?.length ?? 0) > 0);

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
