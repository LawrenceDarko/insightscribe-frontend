/** API / domain types for InsightScribe */

/* ------------------------------------------------------------------ */
/*  Backend API envelope                                              */
/* ------------------------------------------------------------------ */

/** Standard success envelope returned by the Django backend. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/** Standard error envelope returned by the Django backend. */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/* ------------------------------------------------------------------ */
/*  User / Auth                                                       */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  email: string;
  full_name: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
  /** client-side convenience alias */
  name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

/** Shape returned by the Next.js BFF auth routes (not the Django envelope). */
export interface LoginResponse {
  access: string;
  user?: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  full_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/* ------------------------------------------------------------------ */
/*  Projects                                                          */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "active" | "processing" | "complete" | "archived";

export interface Project {
  id: string;
  name: string;
  description?: string;
  interview_count: number;
  created_at: string;
  updated_at?: string;
  /** Client-side convenience field (derived, not from backend) */
  status?: ProjectStatus;
}

/* ------------------------------------------------------------------ */
/*  Interviews                                                        */
/* ------------------------------------------------------------------ */

export type InterviewStatus =
  | "uploaded"
  | "transcribing"
  | "embedding"
  | "complete"
  | "failed";

export interface Interview {
  id: string;
  project_id: string;
  title?: string;
  source_type?: "file" | "transcript" | "link";
  file_url?: string;
  file_name: string;
  file_size?: number;
  file_hash?: string;
  duration_seconds: number | null;
  processing_status?: InterviewStatus;
  /** 0–100 processing progress from the backend */
  processing_progress?: number;
  processing_error?: string;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  is_processing?: boolean;
  is_complete?: boolean;
  is_failed?: boolean;
  created_at: string;
  updated_at?: string;
  /** Client-side alias so existing UI code keeps working */
  status: InterviewStatus;
}

/* ------------------------------------------------------------------ */
/*  Transcription                                                     */
/* ------------------------------------------------------------------ */

export interface TranscriptChunk {
  id: string;
  interview_id: string;
  text: string;
  start_time: number;
  end_time: number;
  chunk_index: number;
  speaker_label: string;
  sentiment_score: number | null;
  token_count: number;
  duration: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  RAG / Chat                                                        */
/* ------------------------------------------------------------------ */

export interface ChatSource {
  /** Primary text content (backend field name) */
  text?: string;
  interview_title?: string;
  start_time?: number | null;
  end_time?: number | null;
  speaker?: string;
  /** Convenience aliases for backwards compatibility */
  quote?: string;
  interview_id?: string;
  interview_name?: string;
  timestamp?: string;
}

export interface RAGSource {
  chunk_id: string;
  interview_id: string;
  interview_title: string;
  text: string;
  start_time: number | null;
  end_time: number | null;
  chunk_index: number;
  speaker: string;
  similarity: number;
}

export interface ChatMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: RAGSource[];
  supporting_quotes?: ChatSource[];
  token_count?: number;
  /** Client-only: true while streaming is in progress */
  isStreaming?: boolean;
  /** Client-only: error that occurred sending/streaming this message */
  error?: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Insights                                                          */
/* ------------------------------------------------------------------ */

export type ReportType =
  | "feature_requests"
  | "frustrations"
  | "positive_themes"
  | "negative_themes"
  | "onboarding"
  | "full";

export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export interface SupportingQuote {
  text: string;
  interview_title: string;
  start_time: number | null;
  end_time: number | null;
  speaker: string;
}

export interface InsightTheme {
  /** Backend field: rank order in the report */
  rank?: number;
  /** Backend field: theme name */
  theme?: string;
  /** Backend field: theme description */
  description?: string;
  frequency: number;
  /** Backend field: average sentiment score */
  sentiment_avg?: number;
  /** Backend field: quotes with metadata */
  supporting_quotes?: SupportingQuote[];
  /** Client-side convenience aliases */
  id?: string;
  title?: string;
  sentiment_score?: number;
  quotes?: string[];
  type?: "feature_request" | "frustration" | "positive" | "negative" | "onboarding";
}

export interface InsightReportContent {
  themes: InsightTheme[];
  summary: string;
  total_chunks_analyzed: number;
  methodology: string;
}

export interface InsightReportMetadata {
  chunks_analyzed: number;
  total_project_chunks: number;
  interviews_included: number;
  generation_time_seconds: number;
  sentiment_distribution?: {
    average_sentiment: number;
    total_scored_chunks: number;
    positive_ratio: number;
    neutral_ratio: number;
    negative_ratio: number;
  };
}

export interface InsightReport {
  id: string;
  project_id: string;
  report_type: ReportType;
  status: ReportStatus;
  title: string;
  content: InsightReportContent;
  metadata: InsightReportMetadata;
  created_at: string;
}

export interface InsightReportListItem {
  id: string;
  report_type: ReportType;
  status: ReportStatus;
  title: string;
  theme_count: number;
  chunks_analyzed: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Common                                                            */
/* ------------------------------------------------------------------ */

export interface ApiError {
  success?: boolean;
  detail?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  details?: Record<string, unknown>;
  [key: string]: unknown;
}
