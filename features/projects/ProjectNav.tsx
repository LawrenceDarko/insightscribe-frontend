"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: (id: string) => `/projects/${id}`, label: "Overview" },
  { href: (id: string) => `/projects/${id}/upload`, label: "Upload" },
  { href: (id: string) => `/projects/${id}/chat`, label: "Chat" },
  { href: (id: string) => `/projects/${id}/insights`, label: "Insights" },
  { href: (id: string) => `/projects/${id}/summary-notes`, label: "Summary Notes" },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex border-b border-surface-200 bg-white px-6 dark:border-surface-700 dark:bg-surface-800"
      aria-label="Project sections"
    >
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const href = tab.href(projectId);
          const isActive =
            href === pathname ||
            (href !== `/projects/${projectId}` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-surface-600 hover:text-surface-900 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-200 dark:hover:border-surface-500"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
