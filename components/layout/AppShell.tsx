"use client";

import { SidebarProvider } from "@/contexts/SidebarContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * AppShell — wraps every authenticated page.
 *
 * Provides:
 * - ProtectedRoute guard (redirects to /login if unauthenticated)
 * - SidebarProvider (mobile open/close + desktop collapse)
 * - Sidebar + TopBar chrome
 * - Scrollable main content area
 *
 * Use this in the `(dashboard)/layout.tsx` to avoid duplicating
 * sidebar/topbar in nested layouts.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-surface-50 via-surface-50 to-surface-100/50 dark:from-surface-950 dark:via-surface-950 dark:to-surface-900">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-5 sm:p-8">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
