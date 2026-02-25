import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-200/80 bg-surface-50/50 px-6 py-16 text-center dark:border-surface-700/60 dark:bg-surface-800/30",
        className
      )}
    >
      <div className="rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 p-4 dark:from-surface-700 dark:to-surface-800">
        {icon ?? <DefaultIllustration />}
      </div>

      <h3 className="mt-5 text-base font-semibold tracking-tight text-surface-900 dark:text-surface-100">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function DefaultIllustration() {
  return (
    <svg
      className="h-12 w-12 text-surface-300 dark:text-surface-600"
      fill="none"
      viewBox="0 0 48 48"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <rect x="6" y="6" width="36" height="36" rx="6" />
      <path d="M18 24h12M24 18v12" strokeLinecap="round" />
    </svg>
  );
}
