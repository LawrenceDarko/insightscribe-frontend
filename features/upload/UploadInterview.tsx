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
import { Button, Card, CardContent } from "@/components/ui";
import type { InterviewStatus } from "@/types";

const ACCEPT = ".mp3,.wav,.mp4,.m4a,.webm,.ogg,audio/*,video/mp4";
const MAX_SIZE_MB = 500;
const POLL_INTERVAL = 3000;

let nextId = 1;

export function UploadInterview({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [queue, setQueue] = useState<UploadFileState[]>([]);
  const [globalError, setGlobalError] = useState("");
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
                  ? "Processing failed on server"
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

  /* ── Core upload logic ── */
  const uploadOne = useCallback(
    async (item: UploadFileState) => {
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

        patch(item.id, {
          status: "processing",
          progress: 100,
          interviewId: interview.id,
          interviewStatus: interview.status,
          abortController: undefined,
        });

        // If already in a terminal state, skip polling
        if (interview.status === "complete") {
          patch(item.id, { status: "complete" });
        } else if (interview.status === "failed") {
          patch(item.id, {
            status: "error",
            error: "Processing failed on server",
          });
        } else {
          startPolling(item.id, interview.id);
        }
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
    [projectId, patch, startPolling]
  );

  /* ── Add files to queue + auto-start ── */
  const addFiles = useCallback(
    (files: File[]) => {
      setGlobalError("");
      const newItems: UploadFileState[] = files.map((file) => ({
        id: `upload-${nextId++}`,
        file,
        status: "queued" as FileUploadStatus,
        progress: 0,
      }));

      setQueue((prev) => [...prev, ...newItems]);

      // Auto-start all queued uploads
      newItems.forEach((item) => uploadOne(item));
    },
    [uploadOne]
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
      if (item) uploadOne(item);
    },
    [queue, uploadOne]
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
      {/* ── Drop zone ── */}
      <DropZone
        accept={ACCEPT}
        maxSizeMB={MAX_SIZE_MB}
        multiple
        disabled={false}
        onFiles={addFiles}
        onError={setGlobalError}
      />

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
