import { ProjectNav } from "@/features/projects/ProjectNav";

/**
 * Nested layout for /projects/[id]/*.
 *
 * The parent (dashboard) layout already provides the AppShell
 * (Sidebar + TopBar + ProtectedRoute), so this layout only adds
 * the project-specific sub-navigation.
 */
export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden -m-4 sm:-m-6">
      <ProjectNav projectId={params.id} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}
