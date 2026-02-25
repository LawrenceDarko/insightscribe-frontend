"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type UIEvent,
} from "react";
import { chatApi, readStream, getErrorMessage } from "@/lib/api";
import type { ChatMessage, ChatSource } from "@/types";
import { Card, Skeleton, Button, EmptyState } from "@/components/ui";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils";

/** Suggested starter questions shown in the empty state */
const STARTERS = [
  "What are the top feature requests?",
  "What frustrations did users mention?",
  "Summarize the key themes across all interviews",
  "What did users say about onboarding?",
];

export function ChatInterface({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Load chat history ── */
  useEffect(() => {
    chatApi
      .list(projectId)
      .then((data) => setMessages(data))
      .catch(() => setInitError("Failed to load chat history"))
      .finally(() => setInitLoading(false));
  }, [projectId]);

  /* ── Auto-scroll when new content arrives (only if user is at bottom) ── */
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  /* ── Track scroll position ── */
  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 80;
    setIsAtBottom(
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  /* ── Patch a single message in the list ── */
  const patchMessage = useCallback(
    (id: string, updates: Partial<ChatMessage>) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      ),
    []
  );

  /* ── Send message with streaming ── */
  const sendMessage = useCallback(
    async (text: string) => {
      if (isSending) return;
      setIsSending(true);

      // User message (optimistic)
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };

      // AI placeholder
      const aiId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await chatApi.stream(
          projectId,
          text,
          abortController.signal
        );

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          throw new Error(
            errBody || `Server error (${response.status})`
          );
        }

        let accumulated = "";
        let supportingQuotes: ChatSource[] = [];

        for await (const chunk of readStream(response)) {
          if (abortController.signal.aborted) break;

          switch (chunk.type) {
            case "token":
              accumulated += chunk.content ?? "";
              patchMessage(aiId, { content: accumulated });
              break;
            case "sources":
              supportingQuotes = chunk.sources ?? [];
              patchMessage(aiId, { supporting_quotes: supportingQuotes });
              break;
            case "done":
              // Final message from server — use it if provided
              if (chunk.message) {
                patchMessage(aiId, {
                  ...chunk.message,
                  isStreaming: false,
                });
              } else {
                patchMessage(aiId, {
                  content: accumulated,
                  supporting_quotes: supportingQuotes,
                  isStreaming: false,
                });
              }
              break;
            case "error":
              patchMessage(aiId, {
                content: accumulated || "An error occurred.",
                isStreaming: false,
                error: chunk.error ?? "Stream error",
              });
              break;
          }
        }

        // If we exited the loop without a "done" chunk, ensure streaming is off
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err: unknown) {
        const isCancelled =
          err instanceof DOMException && err.name === "AbortError";

        if (isCancelled) {
          // Mark as stopped but not errored
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, isStreaming: false } : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? {
                    ...m,
                    content: m.content || "Failed to get response.",
                    isStreaming: false,
                    error: getErrorMessage(err),
                  }
                : m
            )
          );
        }
      } finally {
        abortRef.current = null;
        setIsSending(false);
      }
    },
    [isSending, projectId, patchMessage]
  );

  /* ── Stop streaming ── */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /* ── Retry a failed message ── */
  const handleRetry = useCallback(
    (msg: ChatMessage) => {
      // Find the user message right before this AI message and resend
      const idx = messages.findIndex((m) => m.id === msg.id);
      if (idx < 1) return;
      const userMsg = messages[idx - 1];
      if (userMsg.role !== "user") return;

      // Remove the failed AI message
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      // Re-send
      sendMessage(userMsg.content);
    },
    [messages, sendMessage]
  );

  /* ── Clear chat ── */
  const handleClear = useCallback(async () => {
    try {
      await chatApi.clear(projectId);
      setMessages([]);
    } catch {
      // ignore
    }
  }, [projectId]);

  /* ── Initial loading state ── */
  if (initLoading) {
    return (
      <Card className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 p-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn("flex gap-3", i % 2 === 0 ? "justify-end" : "")}
            >
              <Skeleton
                className={cn(
                  "h-14 rounded-2xl",
                  i % 2 === 0 ? "w-1/3" : "w-2/3"
                )}
              />
            </div>
          ))}
        </div>
        <div className="border-t border-surface-200 p-3 dark:border-surface-700">
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </Card>
    );
  }

  /* ── Init error ── */
  if (initError) {
    return (
      <Card className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            {initError}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header bar ── */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between border-b border-surface-200 px-4 py-2 dark:border-surface-700">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {messages.filter((m) => m.role === "user").length} messages ·
            {" "}
            {messages.filter((m) => (m.supporting_quotes?.length ?? 0) > 0 || (m.sources?.length ?? 0) > 0).length}{" "}
            with sources
          </p>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear chat
          </Button>
        </div>
      )}

      {/* ── Messages area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6">
            <ChatEmptyState onSend={sendMessage} />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onRetry={msg.error ? handleRetry : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      {!isAtBottom && messages.length > 0 && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2">
          <button
            type="button"
            onClick={scrollToBottom}
            className="rounded-full border border-surface-200 bg-white p-2 shadow-md transition-transform hover:scale-105 dark:border-surface-600 dark:bg-surface-700"
            aria-label="Scroll to bottom"
          >
            <svg
              className="h-4 w-4 text-surface-600 dark:text-surface-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Stop button (visible during streaming) ── */}
      {isSending && (
        <div className="flex justify-center border-t border-surface-200 bg-surface-50 py-2 dark:border-surface-700 dark:bg-surface-800/50">
          <Button variant="secondary" size="sm" onClick={stopStreaming}>
            <StopIcon />
            Stop generating
          </Button>
        </div>
      )}

      {/* ── Input ── */}
      <ChatInput
        onSend={sendMessage}
        disabled={isSending}
        placeholder={
          isSending
            ? "Waiting for response…"
            : "Ask about your interviews…"
        }
      />
    </Card>
  );
}

/* ── Empty state with starter suggestions ── */

function ChatEmptyState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
        <svg
          className="h-7 w-7 text-primary-600 dark:text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>

      <h3 className="mt-4 text-base font-semibold text-surface-900 dark:text-surface-100">
        Chat with your interviews
      </h3>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
        Ask questions and get AI-powered answers with quotes and references
        from your uploaded interviews.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {STARTERS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSend(q)}
            className="rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function StopIcon() {
  return (
    <svg
      className="mr-1.5 h-3.5 w-3.5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
