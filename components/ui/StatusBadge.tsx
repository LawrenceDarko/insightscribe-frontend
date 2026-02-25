import { cn } from "@/lib/utils";
import type { ProjectStatus, InterviewStatus } from "@/types";

type BadgeVariant = "success" | "warning" | "info" | "danger" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  neutral:
    "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300",
};

const dotClasses: Record<BadgeVariant, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  danger: "bg-red-500",
  neutral: "bg-surface-400",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  variant,
  label,
  dot = true,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotClasses[variant])}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

/* ── Mapping helpers ── */

const projectStatusMap: Record<ProjectStatus, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Active" },
  processing: { variant: "warning", label: "Processing" },
  complete: { variant: "info", label: "Complete" },
  archived: { variant: "neutral", label: "Archived" },
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const { variant, label } = projectStatusMap[status] ?? projectStatusMap.active;
  return <StatusBadge variant={variant} label={label} className={className} />;
}

const interviewStatusMap: Record<InterviewStatus, { variant: BadgeVariant; label: string }> = {
  uploaded: { variant: "neutral", label: "Uploaded" },
  transcribing: { variant: "warning", label: "Transcribing" },
  embedding: { variant: "info", label: "Embedding" },
  complete: { variant: "success", label: "Complete" },
  failed: { variant: "danger", label: "Failed" },
};

export function InterviewStatusBadge({
  status,
  className,
}: {
  status: InterviewStatus;
  className?: string;
}) {
  const { variant, label } = interviewStatusMap[status] ?? interviewStatusMap.uploaded;
  return <StatusBadge variant={variant} label={label} className={className} />;
}
