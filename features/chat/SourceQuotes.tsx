import { cn } from "@/lib/utils";
import type { ChatSource, RAGSource } from "@/types";

/** Any source-like object from the backend (ChatSource or RAGSource). */
type AnySource = ChatSource | RAGSource;

interface SourceQuotesProps {
  sources: AnySource[];
  className?: string;
}

export function SourceQuotes({ sources, className }: SourceQuotesProps) {
  if (!sources.length) return null;

  return (
    <div
      className={cn(
        "mt-3 space-y-2 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-600 dark:bg-surface-700/50",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400">
        <QuoteIcon />
        Sources ({sources.length})
      </div>
      {sources.map((source, i) => (
        <div
          key={i}
          className="rounded-md border-l-2 border-primary-400 bg-white py-1.5 pl-3 pr-2 dark:border-primary-500 dark:bg-surface-800"
        >
          <blockquote className="text-xs italic leading-relaxed text-surface-700 dark:text-surface-300">
            &ldquo;{source.text || ("quote" in source ? source.quote : "")}&rdquo;
          </blockquote>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-surface-500 dark:text-surface-400">
            {(source.interview_title || ("interview_name" in source ? source.interview_name : "")) && (
              <span className="inline-flex items-center gap-1">
                <FileIcon />
                {source.interview_title || ("interview_name" in source ? source.interview_name : "")}
              </span>
            )}
            {source.start_time != null && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon />
                {formatTimestamp(source.start_time)}
              </span>
            )}
            {!source.interview_title && "interview_id" in source && source.interview_id && (
              <span className="font-mono">
                #{String(source.interview_id).slice(0, 8)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Format seconds into mm:ss timestamp string. */
function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Tiny icons ── */

function QuoteIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  );
}
