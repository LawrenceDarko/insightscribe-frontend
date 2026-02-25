"use client";

import { memo } from "react";
import { cn, formatDateTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import { SourceQuotes } from "./SourceQuotes";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "@/components/ui";

interface ChatMessageBubbleProps {
  message: ChatMessageType;
  onRetry?: (message: ChatMessageType) => void;
}

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  onRetry,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming && !message.content;

  return (
    <div
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {/* ── AI avatar ── */}
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <AiIcon />
        </div>
      )}

      <div
        className={cn(
          "group relative max-w-[85%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* ── Bubble ── */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "rounded-br-md bg-primary-600 text-white"
              : "rounded-bl-md border border-surface-200 bg-white text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          )}
        >
          {/* Streaming empty state → show dots */}
          {isStreaming ? (
            <TypingIndicator />
          ) : (
            <div
              className={cn(
                "whitespace-pre-wrap text-sm leading-relaxed",
                isUser ? "text-white" : ""
              )}
            >
              {message.content}
              {/* Streaming cursor */}
              {message.isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom" />
              )}
            </div>
          )}

          {/* ── Sources (AI only) ── */}
          {!isUser && (() => {
            const displaySources = message.supporting_quotes ?? message.sources ?? [];
            return displaySources.length > 0 ? (
              <SourceQuotes sources={displaySources} className="mt-2" />
            ) : null;
          })()}
        </div>

        {/* ── Meta row: timestamp + error/retry ── */}
        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-[11px]",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <time
            className="text-surface-400 dark:text-surface-500"
            dateTime={message.created_at}
          >
            {formatDateTime(message.created_at)}
          </time>

          {message.error && (
            <span className="flex items-center gap-1 text-red-500">
              <ErrorIcon />
              {message.error}
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message)}
                  className="ml-1 font-medium underline hover:no-underline"
                >
                  Retry
                </button>
              )}
            </span>
          )}
        </div>
      </div>

      {/* ── User avatar ── */}
      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300">
          <UserIcon />
        </div>
      )}
    </div>
  );
});

/* ── Icons ── */

function AiIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
