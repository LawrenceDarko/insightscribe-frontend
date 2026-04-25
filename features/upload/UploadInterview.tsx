"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { DropZone } from "./DropZone";
import {
  UploadFileItem,
  type UploadFileState,
  type FileUploadStatus,
} from "./UploadFileItem";
import { Button, Card, CardContent, Input } from "@/components/ui";
import type { InterviewStatus } from "@/types";

const ACCEPT = ".mp3,.wav,.mp4";
const MAX_SIZE_MB = 200;
const POLL_INTERVAL = 3000;

let nextId = 1;

type UploadMode = "file" | "transcript" | "link";

export function UploadInterview({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [queue, setQueue] = useState<UploadFileState[]>([]);
  const [globalError, setGlobalError] = useState("");
  const [mode, setMode] = useState<UploadMode>("file");
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  /* ── Cleanup polling on unmount ── */
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((timer) => clearInterval(timer));
    };
  }, []);

  /* ── Helpers to update a single item in the queue ── */
  const patch = useCallback(
    (id: string, updates: Partial<UploadFileState>) =>
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      ),
    []
  );

  /* ── Status polling after upload completes ── */
  const startPolling = useCallback(
    (itemId: string, interviewId: string) => {
      const timer = setInterval(async () => {
        try {
          const interview = await uploadApi.getInterviewStatus(
            projectId,
            interviewId
          );
          const terminal: InterviewStatus[] = ["complete", "failed"];

          patch(itemId, {
            interviewStatus: interview.status,
            processingProgress: interview.processing_progress ?? undefined,
          });

          if (terminal.includes(interview.status)) {
            clearInterval(timer);
            pollingRef.current.delete(itemId);
            patch(itemId, {
              status: interview.status === "complete" ? "complete" : "error",
              error:
                interview.status === "failed"
                  ? interview.processing_error || "Processing failed on server"
                  : undefined,
            });
          }
        } catch {
          // Polling failure is non-fatal — we'll retry next tick
        }
      }, POLL_INTERVAL);

      pollingRef.current.set(itemId, timer);
    },
    [projectId, patch]
  );

  const queueProcessingInterview = useCallback(
    (itemId: string, interview: { id: string; status: InterviewStatus; processing_progress?: number }) => {
      patch(itemId, {
        status: "processing",
        progress: 100,
        interviewId: interview.id,
        interviewStatus: interview.status,
        processingProgress: interview.processing_progress ?? undefined,
        abortController: undefined,
      });

      if (interview.status === "complete") {
        patch(itemId, { status: "complete" });
        return;
      }

      if (interview.status === "failed") {
        patch(itemId, {
          status: "error",
          error: interview.processing_error || "Processing failed on server",
        });
        return;
      }

      startPolling(itemId, interview.id);
    },
    [patch, startPolling]
  );

  /* ── Core upload logic ── */
  const uploadFileItem = useCallback(
    async (item: UploadFileState) => {
      if (!item.file) {
        patch(item.id, { status: "error", error: "No file available for upload." });
        return;
      }

      const abortController = new AbortController();
      patch(item.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
        abortController,
      });

      try {
        const interview = await uploadApi.fullUpload(
          projectId,
          item.file,
          {
            onProgress: (loaded, total) => {
              patch(item.id, {
                progress: Math.round((loaded / total) * 100),
              });
            },
            signal: abortController.signal,
          }
        );

        queueProcessingInterview(item.id, interview);
      } catch (err: unknown) {
        // Detect cancellation
        const isCancelled =
          (err instanceof DOMException && err.name === "AbortError") ||
          (typeof err === "object" &&
            err !== null &&
            "message" in err &&
            (err as { message?: string }).message === "Upload cancelled");

        patch(item.id, {
          status: isCancelled ? "cancelled" : "error",
          error: isCancelled ? undefined : getErrorMessage(err),
          abortController: undefined,
        });
      }
    },
    [projectId, patch, queueProcessingInterview]
  );

  const submitTranscript = useCallback(async () => {
    const text = transcriptText.trim();
    if (!text) {
      setGlobalError("Please paste transcript text before submitting.");
      return;
    }

    setGlobalError("");
    setSubmitting(true);
    const itemId = `upload-${nextId++}`;
    const label = transcriptTitle.trim() || "Manual transcript";
    const sizeBytes = new TextEncoder().encode(text).length;

    setQueue((prev) => [
      ...prev,
      {
        id: itemId,
        kind: "transcript",
        label,
        title: transcriptTitle.trim() || undefined,
        transcriptText: text,
        sizeBytes,
        status: "uploading",
        progress: 0,
      },
    ]);

    try {
      const interview = await uploadApi.uploadTranscript(projectId, {
        title: transcriptTitle.trim() || undefined,
        transcript_text: text,
      });
      queueProcessingInterview(itemId, interview);
      setTranscriptTitle("");
      setTranscriptText("");
    } catch (err: unknown) {
      patch(itemId, {
        status: "error",
        error: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  }, [projectId, transcriptText, transcriptTitle, patch, queueProcessingInterview]);

  const submitLink = useCallback(async () => {
    const url = mediaUrl.trim();
    if (!url) {
      setGlobalError("Please provide a media URL before submitting.");
      return;
    }

    setGlobalError("");
    setSubmitting(true);
    const itemId = `upload-${nextId++}`;
    const inferredName = url.split("/").filter(Boolean).pop() || "External media";

    setQueue((prev) => [
      ...prev,
      {
        id: itemId,
        kind: "link",
        label: linkTitle.trim() || inferredName,
        title: linkTitle.trim() || undefined,
        mediaUrl: url,
        status: "uploading",
        progress: 0,
      },
    ]);

    try {
      const interview = await uploadApi.uploadMediaLink(projectId, {
        title: linkTitle.trim() || undefined,
        media_url: url,
      });
      queueProcessingInterview(itemId, interview);
      setLinkTitle("");
      setMediaUrl("");
    } catch (err: unknown) {
      patch(itemId, {
        status: "error",
        error: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  }, [projectId, mediaUrl, linkTitle, patch, queueProcessingInterview]);

  /* ── Add files to queue + auto-start ── */
  const addFiles = useCallback(
    (files: File[]) => {
      setGlobalError("");
      const newItems: UploadFileState[] = files.map((file) => ({
        id: `upload-${nextId++}`,
        kind: "file",
        label: file.name,
        file,
        sizeBytes: file.size,
        status: "queued" as FileUploadStatus,
        progress: 0,
      }));

      setQueue((prev) => [...prev, ...newItems]);

      // Auto-start all queued uploads
      newItems.forEach((item) => uploadFileItem(item));
    },
    [uploadFileItem]
  );

  /* ── Actions ── */
  const handleCancel = useCallback(
    (id: string) => {
      const item = queue.find((i) => i.id === id);
      item?.abortController?.abort();
      // Stop polling if any
      const timer = pollingRef.current.get(id);
      if (timer) {
        clearInterval(timer);
        pollingRef.current.delete(id);
      }
      patch(id, { status: "cancelled", abortController: undefined });
    },
    [queue, patch]
  );

  const handleRetry = useCallback(
    (id: string) => {
      const item = queue.find((i) => i.id === id);
      if (!item) return;

      if (item.kind === "file") {
        uploadFileItem(item);
        return;
      }

      if (item.kind === "transcript" && item.transcriptText) {
        patch(id, { status: "uploading", progress: 0, error: undefined });
        uploadApi
          .uploadTranscript(projectId, {
            title: item.title,
            transcript_text: item.transcriptText,
          })
          .then((interview) => queueProcessingInterview(id, interview))
          .catch((err) => patch(id, { status: "error", error: getErrorMessage(err) }));
        return;
      }

      if (item.kind === "link" && item.mediaUrl) {
        patch(id, { status: "uploading", progress: 0, error: undefined });
        uploadApi
          .uploadMediaLink(projectId, {
            title: item.title,
            media_url: item.mediaUrl,
          })
          .then((interview) => queueProcessingInterview(id, interview))
          .catch((err) => patch(id, { status: "error", error: getErrorMessage(err) }));
      }
    },
    [queue, uploadFileItem, patch, projectId, queueProcessingInterview]
  );

  const handleRemove = useCallback(
    (id: string) => {
      // Cancel if still in progress
      const item = queue.find((i) => i.id === id);
      item?.abortController?.abort();
      const timer = pollingRef.current.get(id);
      if (timer) {
        clearInterval(timer);
        pollingRef.current.delete(id);
      }
      setQueue((prev) => prev.filter((i) => i.id !== id));
    },
    [queue]
  );

  const handleClearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== "complete"));
  }, []);

  /* ── Derived state ── */
  const hasActive = queue.some(
    (i) => i.status === "uploading" || i.status === "processing"
  );
  const completedCount = queue.filter((i) => i.status === "complete").length;
  const totalCount = queue.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mode === "file" ? "primary" : "secondary"}
              onClick={() => setMode("file")}
            >
              Upload file
            </Button>
            <Button
              size="sm"
              variant={mode === "transcript" ? "primary" : "secondary"}
              onClick={() => setMode("transcript")}
            >
              Paste transcript
            </Button>
            <Button
              size="sm"
              variant={mode === "link" ? "primary" : "secondary"}
              onClick={() => setMode("link")}
            >
              Submit media link
            </Button>
          </div>

          {mode === "file" && (
            <DropZone
              accept={ACCEPT}
              maxSizeMB={MAX_SIZE_MB}
              multiple
              disabled={false}
              onFiles={addFiles}
              onError={setGlobalError}
            />
          )}

          {mode === "transcript" && (
            <div className="space-y-3">
              <Input
                value={transcriptTitle}
                onChange={(e) => setTranscriptTitle(e.target.value)}
                placeholder="Transcript title (optional)"
              />
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste transcript text here..."
                rows={9}
                className="block w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder:text-surface-500"
              />
              <div className="flex justify-end">
                <Button onClick={submitTranscript} isLoading={submitting}>
                  Submit transcript
                </Button>
              </div>
            </div>
          )}

          {mode === "link" && (
            <div className="space-y-3">
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/interview.mp4"
                type="url"
              />
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Interview title (optional)"
              />
              <div className="flex justify-end">
                <Button onClick={submitLink} isLoading={submitting}>
                  Submit link
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Global error ── */}
      {globalError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {globalError}
        </p>
      )}

      {/* ── Upload queue ── */}
      {queue.length > 0 && (
        <Card>
          <CardContent className="space-y-1 py-4">
            {/* ── Header ── */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {hasActive ? "Uploading" : "Uploads"}{" "}
                <span className="font-normal text-surface-500 dark:text-surface-400">
                  ({completedCount}/{totalCount} complete)
                </span>
              </h3>
              <div className="flex gap-2">
                {completedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCompleted}
                  >
                    Clear completed
                  </Button>
                )}
                {completedCount > 0 && (
                  <Button
                    size="sm"
                    onClick={() => router.push(`/projects/${projectId}`)}
                  >
                    View project
                  </Button>
                )}
              </div>
            </div>

            {/* ── File list ── */}
            <div className="space-y-2">
              {queue.map((item) => (
                <UploadFileItem
                  key={item.id}
                  item={item}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
