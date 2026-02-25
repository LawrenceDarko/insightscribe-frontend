import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Optional label shown to the right */
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "success" | "danger";
  indeterminate?: boolean;
  className?: string;
}

const variantTrack: Record<string, string> = {
  primary: "bg-primary-600",
  success: "bg-green-500",
  danger: "bg-red-500",
};

export function ProgressBar({
  value,
  label,
  size = "sm",
  variant = "primary",
  indeterminate = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantTrack[variant],
            indeterminate && "animate-indeterminate w-1/3"
          )}
          style={indeterminate ? undefined : { width: `${clamped}%` }}
        />
      </div>
      {label && (
        <span className="shrink-0 text-xs tabular-nums text-surface-600 dark:text-surface-400">
          {label}
        </span>
      )}
    </div>
  );
}
