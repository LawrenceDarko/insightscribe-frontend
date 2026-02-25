import { env } from "@/lib/env";
import { api, getApiClient, getAccessToken } from "./client";
import type { ChatMessage, ChatSession, RAGSource, ChatSource } from "@/types";
import {
  DEV_MODE,
  devGetChatHistory,
  devClearChat,
  devGenerateChatResponse,
} from "./_dev-data";

/** Shape of each SSE/JSON-stream chunk from the backend */
export interface StreamChunk {
  /** Incremental text token */
  type: "token" | "sources" | "done" | "error";
  content?: string;
  sources?: ChatSource[];
  error?: string;
  /** Full message returned on "done" */
  message?: ChatMessage;
}

/** Backend chat response after envelope unwrap. */
interface ChatApiResponse {
  session_id: string;
  message_id: number;
  answer: string;
  supporting_quotes: ChatSource[];
  sources: RAGSource[];
  question: string;
  elapsed_seconds: number | null;
}

/** Backend RAG one-shot response after envelope unwrap. */
interface RAGApiResponse {
  answer: string;
  supporting_quotes: ChatSource[];
  sources: RAGSource[];
  question: string;
  result_count: number;
  elapsed_seconds: number;
}

/**
 * Build a fake `Response` whose body is a ReadableStream that emits
 * NDJSON chunks simulating a real streaming AI response.
 */
function createMockStreamResponse(
  projectId: string,
  message: string,
  signal?: AbortSignal
): Response {
  const { aiResponse, sources } = devGenerateChatResponse(projectId, message);

  // Split response into word-level tokens for realistic streaming
  const tokens = aiResponse.split(/(?<=\s)/); // split keeping trailing space

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      const push = (chunk: StreamChunk) => {
        controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
      };

      // Simulate token-by-token delivery with a small delay
      for (const token of tokens) {
        if (signal?.aborted) break;
        push({ type: "token", content: token });
        await new Promise((r) => setTimeout(r, 18 + Math.random() * 22));
      }

      // Send sources
      if (!signal?.aborted) {
        push({ type: "sources", sources: sources as unknown as ChatSource[] });
      }

      // Send done
      if (!signal?.aborted) {
        push({ type: "done" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

/**
 * Convert backend chat response → ChatMessage for the frontend.
 */
function chatResponseToMessage(data: ChatApiResponse): ChatMessage {
  return {
    id: String(data.message_id),
    role: "assistant",
    content: data.answer,
    sources: data.sources,
    supporting_quotes: data.supporting_quotes,
    created_at: new Date().toISOString(),
  };
}

export const chatApi = {
  /* ------------------------------------------------------------------ */
  /*  Session management                                                */
  /* ------------------------------------------------------------------ */

  /** List chat sessions for a project. */
  listSessions: (projectId: string): Promise<ChatSession[]> => {
    if (DEV_MODE) return Promise.resolve([]);
    return api.get<ChatSession[]>(`/projects/${projectId}/chat/sessions/`);
  },

  /** Get message history for a specific chat session. */
  getSessionHistory: (projectId: string, sessionId: string): Promise<ChatMessage[]> => {
    if (DEV_MODE) return Promise.resolve(devGetChatHistory(projectId));
    return api.get<ChatMessage[]>(`/projects/${projectId}/chat/sessions/${sessionId}/`);
  },

  /** Delete a chat session. */
  deleteSession: (projectId: string, sessionId: string): Promise<void> => {
    if (DEV_MODE) {
      devClearChat(projectId);
      return Promise.resolve();
    }
    return api.delete(`/projects/${projectId}/chat/sessions/${sessionId}/delete/`);
  },

  /** Rename a chat session. */
  renameSession: (projectId: string, sessionId: string, title: string) => {
    return api.patch<{ id: string; title: string }>(
      `/projects/${projectId}/chat/sessions/${sessionId}/rename/`,
      { title }
    );
  },

  /* ------------------------------------------------------------------ */
  /*  Conversational chat (session-based)                               */
  /* ------------------------------------------------------------------ */

  /** Fetch full chat history for a project (backwards-compatible). */
  list: (projectId: string) => {
    if (DEV_MODE) return Promise.resolve(devGetChatHistory(projectId));
    // Default: list sessions, then get history of most recent session
    return chatApi.listSessions(projectId).then(async (sessions) => {
      if (sessions.length === 0) return [];
      return chatApi.getSessionHistory(projectId, sessions[0].id);
    });
  },

  /**
   * Send a message via the conversational chat endpoint (non-streaming).
   *
   * Backend: POST /projects/<pid>/chat/
   * Body: { question: string, session_id?: string }
   * Returns: { session_id, message_id, answer, supporting_quotes, sources, ... }
   */
  send: async (
    projectId: string,
    message: string,
    sessionId?: string
  ): Promise<ChatMessage & { session_id: string }> => {
    if (DEV_MODE) {
      devGenerateChatResponse(projectId, message);
      const history = devGetChatHistory(projectId);
      return { ...history[history.length - 1], session_id: "dev-session" };
    }
    const data = await api.post<ChatApiResponse>(
      `/projects/${projectId}/chat/`,
      { question: message, session_id: sessionId }
    );
    return { ...chatResponseToMessage(data), session_id: data.session_id };
  },

  /** Delete chat history for a project. */
  clear: (projectId: string) => {
    if (DEV_MODE) {
      devClearChat(projectId);
      return Promise.resolve(undefined as unknown as void);
    }
    // Clear by deleting all sessions
    return chatApi.listSessions(projectId).then(async (sessions) => {
      await Promise.all(
        sessions.map((s) => chatApi.deleteSession(projectId, s.id))
      );
    });
  },

  /* ------------------------------------------------------------------ */
  /*  One-shot RAG query                                                */
  /* ------------------------------------------------------------------ */

  /**
   * One-shot RAG query (no session, no history).
   *
   * Backend: POST /projects/<pid>/query/
   * Body: { question: string }
   */
  ragQuery: async (projectId: string, question: string): Promise<RAGApiResponse> => {
    return api.post<RAGApiResponse>(`/projects/${projectId}/query/`, { question });
  },

  /* ------------------------------------------------------------------ */
  /*  Streaming (future / graceful fallback to non-streaming)           */
  /* ------------------------------------------------------------------ */

  /**
   * Stream a chat response.
   *
   * Returns a `Response` whose body is an NDJSON stream.
   * Each line is a JSON object matching `StreamChunk`.
   *
   * The caller should use `readStream()` to consume it.
   *
   * NOTE: if the backend doesn't have a streaming endpoint yet,
   * this falls back to a non-streaming POST and wraps the result
   * as a simulated stream.
   */
  stream: async (
    projectId: string,
    message: string,
    signal?: AbortSignal,
    sessionId?: string
  ): Promise<Response> => {
    if (DEV_MODE) {
      return createMockStreamResponse(projectId, message, signal);
    }

    // Try streaming endpoint first
    const token = getAccessToken();
    try {
      const streamRes = await fetch(
        `${env.apiUrl}/projects/${projectId}/chat/stream/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ question: message, session_id: sessionId }),
          signal,
        }
      );

      // If the streaming endpoint exists, return the response
      if (streamRes.ok) return streamRes;
    } catch {
      // Streaming endpoint not available — fall back to non-streaming
    }

    // Fallback: use the non-streaming chat endpoint and wrap as a stream
    const data = await api.post<ChatApiResponse>(
      `/projects/${projectId}/chat/`,
      { question: message, session_id: sessionId }
    );

    // Build a simulated NDJSON stream from the complete response
    const tokens = data.answer.split(/(?<=\s)/);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        const push = (chunk: StreamChunk) => {
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
        };

        for (const t of tokens) {
          if (signal?.aborted) break;
          push({ type: "token", content: t });
          await new Promise((r) => setTimeout(r, 8));
        }

        if (!signal?.aborted && data.supporting_quotes?.length) {
          push({ type: "sources", sources: data.supporting_quotes });
        }

        if (!signal?.aborted) {
          push({
            type: "done",
            message: chatResponseToMessage(data),
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  },
};

/**
 * Consume an NDJSON / SSE response body, yielding parsed chunks.
 *
 * Supports two formats:
 * 1. NDJSON — one JSON object per line
 * 2. SSE — `data: {json}\n\n`
 */
export async function* readStream(
  response: Response
): AsyncGenerator<StreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ":" || trimmed === "data: [DONE]") continue;

        // Strip SSE "data: " prefix if present
        const json = trimmed.startsWith("data: ")
          ? trimmed.slice(6)
          : trimmed;

        try {
          yield JSON.parse(json) as StreamChunk;
        } catch {
          // Skip unparseable lines
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const json = buffer.trim().startsWith("data: ")
        ? buffer.trim().slice(6)
        : buffer.trim();
      try {
        yield JSON.parse(json) as StreamChunk;
      } catch {
        // ignore
      }
    }
  } finally {
    reader.releaseLock();
  }
}
