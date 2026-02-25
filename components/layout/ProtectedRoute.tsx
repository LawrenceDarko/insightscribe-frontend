"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Client-side route guard.
 *
 * - While auth is initializing → shows a branded spinner (prevents flash).
 * - If user is null after init → redirects to /login?from=<current>.
 * - Otherwise → renders children.
 *
 * Note: The edge middleware handles the server-side redirect. This component
 * is a second layer that covers client-side navigation and ensures no
 * unauthorized content is ever rendered.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitialized, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!user) {
      const from = pathname ? `?from=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${from}`);
    }
  }, [isInitialized, user, isLoading, pathname, router]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            IS
          </div>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Loading&hellip;
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
