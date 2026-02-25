export { api, getApiClient, setAccessToken, getAccessToken, getErrorMessage } from "./client";
export type { RequestOptions } from "./client";
export { projectsApi } from "./projects";
export { loginWithCredentials, registerWithCredentials, refreshAccessToken, fetchCurrentUser, logoutClient } from "./auth";
export { uploadApi } from "./upload";
export { chatApi, readStream } from "./chat";
export type { StreamChunk } from "./chat";
export { insightsApi } from "./insights";
export type { UploadResponse } from "./upload";
export type { InsightsResponse } from "./insights";

// Re-export new types for convenience
export type { ChatSession, RAGSource, InsightReport, InsightReportListItem, ReportType } from "@/types";
