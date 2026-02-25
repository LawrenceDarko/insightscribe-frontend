import { api } from "./client";
import type {
  InsightReport,
  InsightReportListItem,
  InsightTheme,
  ReportType,
} from "@/types";
import { DEV_MODE, devGetInsights } from "./_dev-data";

/** Legacy shape expected by InsightsView component. */
export interface InsightsResponse {
  feature_requests?: InsightTheme[];
  frustrations?: InsightTheme[];
  positive_themes?: InsightTheme[];
  negative_themes?: InsightTheme[];
  onboarding_issues?: InsightTheme[];
}

/**
 * Convert a backend InsightReport into the categorized InsightsResponse
 * shape that the InsightsView component expects.
 *
 * The backend returns a flat list of themes in report.content.themes.
 * We bucket them by report_type so the UI can render sections.
 */
function reportsToInsightsResponse(reports: InsightReport[]): InsightsResponse {
  const result: InsightsResponse = {};

  for (const report of reports) {
    if (report.status !== "completed" || !report.content?.themes) continue;

    // Map themes to InsightTheme shape with convenience aliases
    const themes: InsightTheme[] = report.content.themes.map((t, idx) => ({
      ...t,
      id: `${report.id}-${idx}`,
      title: t.theme,
      sentiment_score: t.sentiment_avg,
      quotes: t.supporting_quotes?.map((q) => q.text) ?? [],
    }));

    // Bucket by report_type
    switch (report.report_type) {
      case "feature_requests":
        result.feature_requests = [...(result.feature_requests ?? []), ...themes];
        break;
      case "frustrations":
        result.frustrations = [...(result.frustrations ?? []), ...themes];
        break;
      case "positive_themes":
        result.positive_themes = [...(result.positive_themes ?? []), ...themes];
        break;
      case "negative_themes":
        result.negative_themes = [...(result.negative_themes ?? []), ...themes];
        break;
      case "onboarding":
        result.onboarding_issues = [...(result.onboarding_issues ?? []), ...themes];
        break;
      case "full":
        // Full report: distribute themes into all categories or treat as combined
        result.feature_requests = [...(result.feature_requests ?? []), ...themes];
        break;
    }
  }

  return result;
}

export const insightsApi = {
  /**
   * Get insights for a project (legacy API shape for InsightsView component).
   *
   * Fetches all completed reports and converts them into the
   * categorized InsightsResponse format.
   */
  get: async (projectId: string): Promise<InsightsResponse> => {
    if (DEV_MODE) return devGetInsights(projectId);

    const reports = await insightsApi.listReports(projectId);
    // Fetch full content for completed reports
    const fullReports = await Promise.all(
      reports
        .filter((r) => r.status === "completed")
        .map((r) => insightsApi.getReport(projectId, r.id))
    );
    return reportsToInsightsResponse(fullReports);
  },

  /**
   * Generate a new insight report.
   *
   * Backend: POST /projects/<pid>/insights/generate/
   * Body: { report_type: "feature_requests" | "frustrations" | ... }
   */
  generateReport: (
    projectId: string,
    reportType: ReportType
  ): Promise<InsightReport> => {
    return api.post<InsightReport>(
      `/projects/${projectId}/insights/generate/`,
      { report_type: reportType }
    );
  },

  /**
   * List all insight reports for a project.
   *
   * Backend: GET /projects/<pid>/insights/?type=<optional>
   */
  listReports: (
    projectId: string,
    reportType?: ReportType
  ): Promise<InsightReportListItem[]> => {
    const params = reportType ? `?type=${reportType}` : "";
    return api.get<InsightReportListItem[]>(
      `/projects/${projectId}/insights/${params}`
    );
  },

  /**
   * Get a full insight report with content and metadata.
   *
   * Backend: GET /projects/<pid>/insights/<report_id>/
   */
  getReport: (projectId: string, reportId: string): Promise<InsightReport> => {
    return api.get<InsightReport>(
      `/projects/${projectId}/insights/${reportId}/`
    );
  },

  /**
   * Delete an insight report.
   *
   * Backend: DELETE /projects/<pid>/insights/<report_id>/delete/
   */
  deleteReport: (projectId: string, reportId: string): Promise<void> => {
    return api.delete(
      `/projects/${projectId}/insights/${reportId}/delete/`
    );
  },
};
