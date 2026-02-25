"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardProjects } from "@/features/dashboard/DashboardProjects";
import { CreateProjectModal } from "@/features/dashboard/CreateProjectModal";
import { projectsApi } from "@/lib/api";
import { Button, Skeleton, Card, CardContent } from "@/components/ui";
import type { Project } from "@/types";

/* ── Stats cards ── */

function StatsCards() {
  const [stats, setStats] = useState({ projects: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi
      .list()
      .then((projects) => {
        const interviews = projects.reduce(
          (sum: number, p: Project) => sum + (p.interview_count ?? 0),
          0
        );
        setStats({ projects: projects.length, interviews });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Projects",
      value: stats.projects,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      ),
      accent: "from-primary-500 to-primary-600",
      iconColor: "text-primary-600 dark:text-primary-400",
      bgColor: "bg-primary-50 dark:bg-primary-950/50",
    },
    {
      label: "Interviews",
      value: stats.interviews,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      ),
      accent: "from-violet-500 to-violet-600",
      iconColor: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/50",
    },
    {
      label: "Insights Generated",
      value: 0,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
        </svg>
      ),
      accent: "from-emerald-500 to-emerald-600",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "AI Queries",
      value: 0,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      ),
      accent: "from-amber-500 to-amber-600",
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:shadow-surface-200/50 dark:border-surface-700/60 dark:bg-surface-800/80 dark:hover:shadow-surface-900/50"
        >
          {/* Gradient accent bar */}
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                {card.label}
              </p>
              {loading ? (
                <Skeleton className="mt-1.5 h-8 w-16" />
              ) : (
                <p className="mt-1 text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
                  {card.value}
                </p>
              )}
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor}`}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Greeting helper ── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ── Skeleton for suspense ── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="space-y-3 py-6">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback((_project: Project) => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-6 sm:p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-8 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {getGreeting()}, {user?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-2 max-w-lg text-primary-100/90 text-sm sm:text-base">
            Turn hours of customer interviews into structured product insights.
            Upload, analyze, and discover what matters.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Start new project
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Projects section */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Recent Projects
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Your research projects and interview collections.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            New project
          </Button>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardProjects
            key={refreshKey}
            onCreate={() => setShowCreate(true)}
          />
        </Suspense>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
