"use client";

import { cn } from "@/lib/utils";
import { Button, ProgressBar } from "@/components/ui";
import { InterviewStatusBadge } from "@/components/ui";
import type { InterviewStatus } from "@/types";

export type FileUploadStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "complete"
  | "error"
  | "cancelled";

export interface UploadFileState {
  id: string; // unique per queued file
  kind: "file" | "transcript" | "link";
  label: string;
  file?: File;
  sizeBytes?: number;
  title?: string;
  transcriptText?: string;
  mediaUrl?: string;
  status: FileUploadStatus;
  progress: number; // 0–100
  error?: string;
  interviewId?: string;
  interviewStatus?: InterviewStatus;
  processingProgress?: number; // 0–100 backend processing progress
  abortController?: AbortController;
}

interface UploadFileItemProps {
  item: UploadFileState;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export function UploadFileItem({
  item,
  onCancel,
  onRetry,
  onRemove,
}: UploadFileItemProps) {
  const sizeMB =
    typeof item.sizeBytes === "number" ? (item.sizeBytes / 1024 / 1024).toFixed(1) : null;
  const sourceLabel =
    item.kind === "file" ? "File" : item.kind === "transcript" ? "Transcript" : "Media link";

  const progressVariant =
    item.status === "error" || item.status === "cancelled"
      ? "danger"
      : item.status === "complete"
      ? "success"
      : "primary";

  const showProgress =
    item.status === "uploading" || item.status === "processing";

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 transition-colors",
        item.status === "error"
          ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10"
          : "border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800"
      )}
    >
      {/* ── Top row: filename + actions ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileIcon status={item.status} />
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
              {item.label}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
            {sourceLabel}
            {sizeMB ? ` · ${sizeMB} MB` : ""}
            {item.interviewStatus && (
              <>
                {" "}
                · <InterviewStatusBadge status={item.interviewStatus} />
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.status === "uploading" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(item.id)}
              aria-label="Cancel upload"
            >
              Cancel
            </Button>
          )}
          {(item.status === "error" || item.status === "cancelled") && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(item.id)}
              >
                Retry
              </Button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                aria-label="Remove"
              >
                <CloseIcon />
              </button>
            </>
          )}
          {item.status === "complete" && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
              aria-label="Remove"
            >
              <CloseIcon />
            </button>
          )}
          {item.status === "queued" && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
              aria-label="Remove from queue"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Progress bar ── */}
      {showProgress && (() => {
        const isProcessing = item.status === "processing";
        const pct = isProcessing ? (item.processingProgress ?? 0) : item.progress;
        const hasBackendProgress = isProcessing && typeof item.processingProgress === "number" && item.processingProgress > 0;
        const statusLabel = isProcessing && item.interviewStatus
          ? item.interviewStatus === "transcribing"
            ? "Transcribing"
            : item.interviewStatus === "embedding"
            ? "Generating embeddings"
            : "Processing"
          : undefined;
        const label = isProcessing
          ? hasBackendProgress
            ? `${statusLabel ?? "Processing"}… ${pct}%`
            : `${statusLabel ?? "Processing"}…`
          : `${Math.round(item.progress)}%`;

        return (
          <div className="mt-2">
            <ProgressBar
              value={pct}
              label={label}
              variant={progressVariant}
              indeterminate={isProcessing && !hasBackendProgress}
            />
          </div>
        );
      })()}

      {/* ── Error message ── */}
      {item.status === "error" && item.error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {item.error}
        </p>
      )}

      {/* ── Cancelled message ── */}
      {item.status === "cancelled" && (
        <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
          Upload cancelled
        </p>
      )}
    </div>
  );
}

/* ── Icons ── */

function FileIcon({ status }: { status: FileUploadStatus }) {
  if (status === "complete") {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-green-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "error" || status === "cancelled") {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4 shrink-0 text-surface-400 dark:text-surface-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
