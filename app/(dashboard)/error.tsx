"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

/**
 * Error boundary for dashboard routes.
 * Renders inside the AppShell so the sidebar/topbar remain accessible.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <svg
          className="h-6 w-6 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
        Something went wrong
      </h2>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 text-center max-w-sm">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button className="mt-5" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
