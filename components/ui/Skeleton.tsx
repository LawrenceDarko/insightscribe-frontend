import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 bg-[length:200%_100%] dark:from-surface-700 dark:via-surface-600 dark:to-surface-700",
        className
      )}
      {...props}
    />
  );
}
