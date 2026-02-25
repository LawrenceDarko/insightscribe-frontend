"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { projectsApi } from "@/lib/api";
import type { Interview, InterviewStatus, Project } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
  EmptyState,
  ProgressBar,
  ProjectStatusBadge,
  InterviewStatusBadge,
  ConfirmDialog,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

const POLL_INTERVAL = 3_000;
const ACTIVE_STATES: InterviewStatus[] = ["uploaded", "transcribing", "embedding"];

export function ProjectOverview({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch project + interviews on mount ── */
  useEffect(() => {
    Promise.all([
      projectsApi.get(projectId),
      projectsApi.listInterviews(projectId),
    ])
      .then(([p, list]) => {
        setProject(p);
        setInterviews(list);
      })
      .catch(() => setError("Failed to load project"))
      .finally(() => setLoading(false));
  }, [projectId]);

  /* ── Poll while any interview is in an active (non-terminal) state ── */
  const refreshInterviews = useCallback(async () => {
    try {
      const list = await projectsApi.listInterviews(projectId);
      setInterviews(list);
    } catch {
      // Non-fatal — we'll retry next tick
    }
  }, [projectId]);

  useEffect(() => {
    const hasActive = interviews.some((i) =>
      ACTIVE_STATES.includes(i.status)
    );

    if (hasActive && !pollTimer.current) {
      pollTimer.current = setInterval(refreshInterviews, POLL_INTERVAL);
    } else if (!hasActive && pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [interviews, refreshInterviews]);

  /* ── Optimistic delete interview ── */
  async function handleDeleteInterview() {
    if (!deleteTarget) return;
    const prev = interviews;
    setInterviews((is) => is.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(true);
    try {
      await projectsApi.deleteInterview(projectId, deleteTarget.id);
    } catch {
      setInterviews(prev);
    } finally {
      setDeleting(false);
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
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
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !project) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
        <CardContent className="py-8 text-center text-red-700 dark:text-red-400">
          {error ?? "Project not found"}
        </CardContent>
      </Card>
    );
  }

  /* ── Stats counters ── */
  const completedCount = interviews.filter(
    (i) => i.status === "complete"
  ).length;
  const processingCount = interviews.filter((i) =>
    ["transcribing", "embedding"].includes(i.status)
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Summary Stats ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total interviews" value={interviews.length} />
        <StatCard label="Completed" value={completedCount} accent="green" />
        <StatCard
          label="Processing"
          value={processingCount}
          accent="amber"
        />
      </div>

      {/* ── Project info ── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{project.name}</CardTitle>
              {project.description && (
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  {project.description}
                </p>
              )}
            </div>
            {project.status && <ProjectStatusBadge status={project.status} />}
          </div>
        </CardHeader>
        <CardContent className="text-xs text-surface-500 dark:text-surface-400">
          Created {formatDate(project.created_at)}
          {project.updated_at && <> · Updated {formatDate(project.updated_at)}</>}
        </CardContent>
      </Card>

      {/* ── Interview list ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Interviews
          </h2>
          <Link href={`/projects/${projectId}/upload`}>
            <Button size="sm">
              <UploadIcon />
              Upload
            </Button>
          </Link>
        </div>

        {interviews.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="h-12 w-12 text-surface-300 dark:text-surface-600"
                fill="none"
                viewBox="0 0 48 48"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path d="M14 8h20a4 4 0 014 4v24a4 4 0 01-4 4H14a4 4 0 01-4-4V12a4 4 0 014-4z" />
                <path d="M18 20h12M18 28h8" strokeLinecap="round" />
              </svg>
            }
            title="No interviews yet"
            description="Upload your first customer interview to start generating insights."
            action={
              <Link href={`/projects/${projectId}/upload`}>
                <Button>Upload interview</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <Card className="transition-colors hover:border-surface-300 dark:hover:border-surface-600">
                  <CardContent className="flex flex-col gap-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileIcon />
                          <p className="truncate font-medium text-surface-900 dark:text-surface-100">
                            {interview.file_name}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                          <InterviewStatusBadge status={interview.status} />
                          {interview.duration_seconds && (
                            <span>
                              {Math.round(interview.duration_seconds / 60)} min
                            </span>
                          )}
                          <span>{formatDateTime(interview.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {interview.status === "complete" && (
                          <>
                            <Link href={`/projects/${projectId}/chat`}>
                              <Button variant="ghost" size="sm">
                                Chat
                            </Button>
                          </Link>
                          <Link href={`/projects/${projectId}/insights`}>
                            <Button variant="ghost" size="sm">
                              Insights
                            </Button>
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(interview)}
                        className="rounded p-1 text-surface-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        disabled={deleting}
                        aria-label={`Delete ${interview.file_name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    </div>
                    {/* ── Processing progress bar ── */}
                    {(interview.status === "transcribing" || interview.status === "embedding") && (
                      <InterviewProgressBar interview={interview} />
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteInterview}
        title="Delete interview"
        description={`Are you sure you want to delete "${deleteTarget?.file_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

/* ── Interview progress bar ── */
function InterviewProgressBar({ interview }: { interview: Interview }) {
  const pct = interview.processing_progress ?? 0;
  const hasProgress = pct > 0;
  const label =
    interview.status === "transcribing"
      ? hasProgress
        ? `Transcribing… ${pct}%`
        : "Transcribing…"
      : hasProgress
      ? `Generating embeddings… ${pct}%`
      : "Generating embeddings…";

  return (
    <ProgressBar
      value={pct}
      label={label}
      variant="primary"
      indeterminate={!hasProgress}
    />
  );
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "amber";
}) {
  const valueColor = accent === "green"
    ? "text-green-600 dark:text-green-400"
    : accent === "amber"
    ? "text-amber-600 dark:text-amber-400"
    : "text-surface-900 dark:text-surface-100";

  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

/* ── Inline icons ── */
function UploadIcon() {
  return (
    <svg
      className="mr-1.5 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M8 8l4-4 4 4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-surface-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
