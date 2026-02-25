import { cn } from "@/lib/utils";

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-1.5 px-1 py-0.5", className)}
      aria-label="AI is typing"
      role="status"
    >
      <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400 dark:bg-surface-500 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400 dark:bg-surface-500 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400 dark:bg-surface-500 [animation-delay:300ms]" />
    </div>
  );
}
