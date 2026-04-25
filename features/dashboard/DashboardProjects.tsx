"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/types";
import {
  Card,
  CardContent,
  Skeleton,
  EmptyState,
  Button,
  ProjectStatusBadge,
  ConfirmDialog,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { EditProjectModal } from "@/features/projects/EditProjectModal";

/* ── Color rotation for card accent stripes ── */
const accentColors = [
  "from-primary-500 to-primary-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
];

interface DashboardProjectsProps {
  onCreate?: () => void;
}

export function DashboardProjects({ onCreate }: DashboardProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    projectsApi
      .list()
      .then(setProjects)
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /* ── Optimistic delete ── */
  async function handleDelete() {
    if (!deleteTarget) return;
    const prev = projects;
    setProjects((ps) => ps.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(true);
    try {
      await projectsApi.delete(deleteTarget.id);
    } catch {
      setProjects(prev); // rollback
    } finally {
      setDeleting(false);
    }
  }

  /** Called externally after a new project is created */
  function addProject(project: Project) {
    setProjects((prev) => [project, ...prev]);
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white dark:border-surface-700/60 dark:bg-surface-800/80">
            <div className="h-1.5 w-full bg-surface-200 dark:bg-surface-700" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200/80 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
        <div className="py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={fetchProjects}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="h-14 w-14 text-surface-300 dark:text-surface-600"
            fill="none"
            viewBox="0 0 56 56"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <rect x="8" y="12" width="40" height="32" rx="4" />
            <path d="M8 20h40" />
            <path d="M20 28h16M24 34h8" strokeLinecap="round" />
          </svg>
        }
        title="No projects yet"
        description="Create your first project to start uploading customer interviews and generating insights."
        action={
          onCreate && (
            <Button onClick={onCreate}>
              <PlusIcon />
              New project
            </Button>
          )
        }
      />
    );
  }

  /* ── Project grid ── */
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, idx) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block"
          >
            <div className="relative h-full overflow-hidden rounded-2xl border border-surface-200/80 bg-white transition-all duration-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 dark:border-surface-700/60 dark:bg-surface-800/80 dark:hover:border-primary-800 dark:hover:shadow-primary-500/5">
              {/* Color accent stripe */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${accentColors[idx % accentColors.length]}`} />

              <div className="p-5">
                {/* Title + Status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-surface-900 line-clamp-1 dark:text-surface-100">
                    {project.name}
                  </h3>
                  {project.status && (
                    <ProjectStatusBadge status={project.status} />
                  )}
                </div>

                {/* Description */}
                {project.description && (
                  <p className="mt-2 text-sm text-surface-500 line-clamp-2 dark:text-surface-400">
                    {project.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="mt-4 flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                  <span className="inline-flex items-center gap-1.5">
                    <MicIcon />
                    {project.interview_count ?? 0} interview{(project.interview_count ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon />
                    {formatDate(project.created_at)}
                  </span>
                </div>

                {/* Actions row */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-700/60">
                  <span className="text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                    View project &rarr;
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditTarget(project);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 opacity-0 transition-all hover:bg-surface-100 hover:text-surface-700 group-hover:opacity-100 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                      disabled={deleting}
                      aria-label="Edit project"
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(project);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950 dark:hover:text-red-400"
                      disabled={deleting}
                      aria-label="Delete project"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* New project ghost card */}
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="group flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-200 bg-transparent transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/50 dark:border-surface-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-400 transition-colors group-hover:bg-primary-100 group-hover:text-primary-600 dark:bg-surface-800 dark:text-surface-500 dark:group-hover:bg-primary-950 dark:group-hover:text-primary-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-500 group-hover:text-primary-700 dark:text-surface-400 dark:group-hover:text-primary-400">
              New project
            </span>
          </button>
        )}
      </div>

      {editTarget && (
        <EditProjectModal
          project={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) => {
            setProjects((prev) =>
              prev.map((project) => (project.id === updated.id ? { ...project, ...updated } : project))
            );
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all interviews and insights.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

/* expose addProject so the parent can call it */
DashboardProjects.displayName = "DashboardProjects";

/* ── Inline icons ── */

function PlusIcon() {
  return (
    <svg
      className="mr-1.5 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
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
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a2.25 2.25 0 1 1 3.182 3.182l-1.688 1.687m-3.181-3.181L7.5 13.848V17.25h3.402l9.361-9.362m-3.181-3.181L19.5 7.125"
      />
    </svg>
  );
}
