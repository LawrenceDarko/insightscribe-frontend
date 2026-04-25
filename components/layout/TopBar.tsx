"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { projectsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Interview, Project } from "@/types";

/* ------------------------------------------------------------------ */
/*  Tiny inline icons                                                 */
/* ------------------------------------------------------------------ */

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function IconMonitor({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Theme toggle                                                      */
/* ------------------------------------------------------------------ */

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: IconSun, label: "Light" },
    { value: "dark" as const, icon: IconMoon, label: "Dark" },
    { value: "system" as const, icon: IconMonitor, label: "System" },
  ];

  return (
    <div className="flex items-center rounded-xl bg-surface-100 p-0.5 dark:bg-surface-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
            theme === opt.value
              ? "bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-100"
              : "text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
          )}
          aria-label={opt.label}
          title={opt.label}
        >
          <opt.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TopBar component                                                  */
/* ------------------------------------------------------------------ */

export function TopBar() {
  const { user } = useAuth();
  const { setMobileOpen } = useSidebar();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [interviews, setInterviews] = useState<Array<Interview & { project_name: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [interviewsLoaded, setInterviewsLoaded] = useState(false);

  const initials = (user?.full_name || user?.email || "U")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  useEffect(() => {
    let active = true;

    projectsApi
      .list()
      .then((items) => {
        if (active) {
          setProjects(items);
        }
      })
      .catch(() => {
        if (active) {
          setSearchError("Search is temporarily unavailable");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isFocused || interviewsLoaded || projects.length === 0) {
      return;
    }

    let active = true;
    setSearchLoading(true);

    Promise.all(
      projects.map(async (project) => {
        const list = await projectsApi.listInterviews(project.id);
        return list.map((interview) => ({
          ...interview,
          project_name: project.name,
        }));
      })
    )
      .then((lists) => {
        if (!active) return;
        setInterviews(lists.flat());
        setInterviewsLoaded(true);
      })
      .catch(() => {
        if (active) {
          setSearchError("Search is temporarily unavailable");
        }
      })
      .finally(() => {
        if (active) {
          setSearchLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isFocused, interviewsLoaded, projects]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }

      if (event.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return { projects: projects.slice(0, 5), interviews: interviews.slice(0, 5) };
    }

    const scoreMatch = (text: string) => {
      const normalizedText = text.toLowerCase();
      if (!normalizedText.includes(normalizedQuery)) {
        return 0;
      }

      let score = 1;
      if (normalizedText.startsWith(normalizedQuery)) score += 4;
      if (normalizedText === normalizedQuery) score += 3;
      if (normalizedText.includes(` ${normalizedQuery}`)) score += 1;
      return score;
    };

    const matchingProjects = projects
      .map((project) => ({
        project,
        score: scoreMatch(`${project.name} ${project.description ?? ""}`),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.project.name.localeCompare(b.project.name))
      .map((entry) => entry.project);

    const matchingInterviews = interviews
      .map((interview) => ({
        interview,
        score: scoreMatch(`${interview.file_name} ${interview.title ?? ""} ${interview.project_name}`),
      }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.interview.project_name.localeCompare(b.interview.project_name) ||
          a.interview.file_name.localeCompare(b.interview.file_name)
      )
      .map((entry) => entry.interview);

    return {
      projects: matchingProjects.slice(0, 5),
      interviews: matchingInterviews.slice(0, 5),
    };
  }, [interviews, projects, query]);

  const showDropdown = isFocused && (query.trim().length > 0 || projects.length > 0);

  function openProject(projectId: string) {
    setQuery("");
    setIsFocused(false);
    router.push(`/projects/${projectId}`);
  }

  function openInterview(interview: Interview) {
    setQuery("");
    setIsFocused(false);
    router.push(`/projects/${interview.project_id}#interview-${interview.id}`);
  }

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-4 border-b border-surface-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-xl dark:border-surface-800 dark:bg-surface-900/80">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        aria-label="Open navigation"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      {/* Search bar */}
      <div ref={searchRef} className="relative z-30 hidden sm:flex max-w-md flex-1">
        <div className="relative w-full">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, interviews..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            className="h-9 w-full rounded-xl border border-surface-200 bg-surface-50 pl-9 pr-20 text-sm text-surface-900 placeholder:text-surface-400 transition-colors focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-primary-500 dark:focus:bg-surface-800"
          />
          <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query && (
              <span className="hidden rounded-md bg-surface-200 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-700 dark:text-surface-400 sm:inline-flex">
                Esc
              </span>
            )}
            <kbd className="hidden items-center gap-0.5 rounded-md border border-surface-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-surface-400 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-500 sm:inline-flex">
              ⌘K
            </kbd>
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[70] overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-surface-950/10 ring-1 ring-black/5 dark:border-surface-700 dark:bg-surface-900 dark:shadow-black/30">
              <div className="border-b border-surface-100 px-4 py-3 text-xs font-medium uppercase tracking-wide text-surface-400 dark:border-surface-800">
                {searchLoading ? "Searching interviews..." : query.trim() ? `Results for “${query.trim()}”` : "Recent projects and interviews"}
              </div>

              {searchError ? (
                <div className="px-4 py-6 text-sm text-surface-500 dark:text-surface-400">{searchError}</div>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto p-2">
                  {searchResults.projects.length === 0 && searchResults.interviews.length === 0 ? (
                    <div className="px-3 py-10 text-center text-sm text-surface-500 dark:text-surface-400">
                      No projects or interviews match your search.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.projects.length > 0 && (
                        <div>
                          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">
                            Projects
                          </div>
                          <div className="space-y-1">
                            {searchResults.projects.map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => openProject(project.id)}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                                    {project.name}
                                  </div>
                                  <div className="truncate text-xs text-surface-500 dark:text-surface-400">
                                    {project.description ?? `${project.interview_count ?? 0} interviews`}
                                  </div>
                                </div>
                                <IconChevronRight className="ml-3 h-4 w-4 shrink-0 text-surface-300 dark:text-surface-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.interviews.length > 0 && (
                        <div>
                          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">
                            Interviews
                          </div>
                          <div className="space-y-1">
                            {searchResults.interviews.map((interview) => (
                              <button
                                key={interview.id}
                                type="button"
                                onClick={() => openInterview(interview)}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                                    {interview.title || interview.file_name}
                                  </div>
                                  <div className="truncate text-xs text-surface-500 dark:text-surface-400">
                                    {interview.project_name} · {interview.file_name}
                                  </div>
                                </div>
                                <IconChevronRight className="ml-3 h-4 w-4 shrink-0 text-surface-300 dark:text-surface-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section — pushed to far right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          aria-label="Notifications"
        >
          <IconBell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-500" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-surface-200 dark:bg-surface-700" />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                {user.full_name || user.email}
              </span>
              <span className="text-[11px] text-surface-500 capitalize dark:text-surface-400">
                {user.plan || "free"} plan
              </span>
            </div>
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-violet-500 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-surface-900" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
