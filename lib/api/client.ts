import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { getToast } from "@/contexts/ToastContext";
import type { ApiError, ApiEnvelope } from "@/types";

/* ------------------------------------------------------------------ */
/*  Access-token management                                            */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/* ------------------------------------------------------------------ */
/*  Retry configuration                                                */
/* ------------------------------------------------------------------ */

interface RetryConfig {
  /** Maximum number of automatic retries (default 3). */
  maxRetries: number;
  /** Initial delay before first retry in ms (default 1000). */
  baseDelay: number;
  /** Max delay cap in ms (default 10 000). */
  maxDelay: number;
  /** HTTP methods eligible for retry (safe & idempotent). */
  retryMethods: Set<string>;
  /** HTTP status codes that should trigger a retry. */
  retryStatusCodes: Set<number>;
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10_000,
  retryMethods: new Set(["get", "head", "options", "put", "delete"]),
  retryStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
};

/**
 * Determine whether a failed request should be retried.
 */
function shouldRetry(error: AxiosError, attempt: number): boolean {
  if (attempt >= RETRY_CONFIG.maxRetries) return false;

  const method = error.config?.method?.toLowerCase() ?? "";
  if (!RETRY_CONFIG.retryMethods.has(method)) return false;

  // Network error (no response at all)
  if (!error.response) return true;

  return RETRY_CONFIG.retryStatusCodes.has(error.response.status);
}

/**
 * Exponential backoff with jitter.
 */
function retryDelay(attempt: number): number {
  const exp = Math.min(
    RETRY_CONFIG.baseDelay * 2 ** attempt,
    RETRY_CONFIG.maxDelay
  );
  // Add ±25 % jitter
  return exp * (0.75 + Math.random() * 0.5);
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/*  Axios instance                                                     */
/* ------------------------------------------------------------------ */

const client = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

/* -- Request interceptor: inject Bearer token -- */

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/* -- Response interceptor: 401 refresh + retry logic -- */

interface ExtendedConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  /** Caller opted out of toasts (e.g. silent fetches). */
  _silent?: boolean;
}

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiError>) => {
    const config = err.config as ExtendedConfig | undefined;
    if (!config) return Promise.reject(err);

    /* ---------- 401 — attempt token refresh ---------- */
    if (err.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        const base =
          typeof window !== "undefined"
            ? window.location.origin
            : env.appUrl || env.apiUrl;
        const res = await axios.post<{ access: string }>(
          `${base}/api/auth/refresh`,
          undefined,
          { withCredentials: true }
        );
        const newAccess = res.data?.access;
        if (newAccess) {
          setAccessToken(newAccess);
          config.headers.Authorization = `Bearer ${newAccess}`;
          return client(config);
        }
      } catch {
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(err);
      }
    }

    /* ---------- Retry with exponential backoff ---------- */
    const attempt = config._retryCount ?? 0;
    if (shouldRetry(err, attempt)) {
      config._retryCount = attempt + 1;
      await wait(retryDelay(attempt));
      return client(config);
    }

    /* ---------- Surface toast notification ---------- */
    if (!config._silent) {
      const toast = getToast();
      if (toast) {
        const msg = getErrorMessage(err);
        toast.error("Request failed", msg);
      }
    }

    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------------ */
/*  Public accessors                                                   */
/* ------------------------------------------------------------------ */

export function getApiClient() {
  return client;
}

/* ------------------------------------------------------------------ */
/*  Typed request helpers                                              */
/* ------------------------------------------------------------------ */

export interface RequestOptions extends Omit<AxiosRequestConfig, "url" | "method" | "data"> {
  /** Suppress automatic error toasts for this request. */
  silent?: boolean;
}

/**
 * Central typed API helper. All domain modules should call through `api.*`.
 *
 * - Automatically unwraps `response.data`
 * - Injects retry & toast config
 * - Provides strict TypeScript return type
 */
export const api = {
  get: <T>(url: string, opts?: RequestOptions): Promise<T> =>
    client
      .get(url, withSilent(opts))
      .then((res) => unwrap<T>(res)),

  post: <T>(url: string, data?: unknown, opts?: RequestOptions): Promise<T> =>
    client
      .post(url, data, withSilent(opts))
      .then((res) => unwrap<T>(res)),

  put: <T>(url: string, data?: unknown, opts?: RequestOptions): Promise<T> =>
    client
      .put(url, data, withSilent(opts))
      .then((res) => unwrap<T>(res)),

  patch: <T>(url: string, data?: unknown, opts?: RequestOptions): Promise<T> =>
    client
      .patch(url, data, withSilent(opts))
      .then((res) => unwrap<T>(res)),

  delete: <T = void>(url: string, opts?: RequestOptions): Promise<T> =>
    client
      .delete(url, withSilent(opts))
      .then((res) => unwrap<T>(res)),
};

/**
 * Unwrap Axios response + Django API envelope.
 *
 * The backend returns all responses in a standardized envelope:
 *   { success: true, message: "...", data: <payload> }
 *
 * This function first unwraps Axios (response.data → envelope),
 * then unwraps the envelope (envelope.data → payload).
 */
function unwrap<T>(res: AxiosResponse): T {
  const body = res.data;

  // If the body is the Django envelope, extract .data
  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    body.success === true
  ) {
    return (body as ApiEnvelope).data as T;
  }

  // Fallback: return the raw body (e.g. non-envelope endpoints)
  return body as T;
}

function withSilent(opts?: RequestOptions): AxiosRequestConfig | undefined {
  if (!opts) return undefined;
  const { silent, ...rest } = opts;
  if (silent) {
    (rest as Record<string, unknown>)._silent = true;
  }
  return rest;
}

/* ------------------------------------------------------------------ */
/*  Error utilities                                                    */
/* ------------------------------------------------------------------ */

export function getErrorMessage(err: unknown): string {
  // Axios error with response body
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as ApiError;

    // Django envelope error: { success: false, error: { code, message, details } }
    if (d.error && typeof d.error === "object" && "message" in d.error) {
      return d.error.message;
    }

    if (typeof d.detail === "string") return d.detail;
    if (typeof d.message === "string") return d.message;
    if (
      typeof d.detail === "object" &&
      d.detail !== null &&
      "message" in d.detail
    ) {
      return String((d.detail as { message?: string }).message);
    }
    // Field-level validation errors (Django REST Framework style)
    const firstKey = Object.keys(d).find(
      (k) => Array.isArray(d[k]) && (d[k] as string[]).length > 0
    );
    if (firstKey) {
      return `${firstKey}: ${(d[firstKey] as string[])[0]}`;
    }
  }

  // Non-Axios error with response.data
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    (err as { response?: { data?: ApiError } }).response?.data
  ) {
    const d = (err as { response: { data: ApiError } }).response.data;
    if (typeof d.detail === "string") return d.detail;
    if (typeof d.message === "string") return d.message;
  }

  // Network / timeout
  if (axios.isAxiosError(err) && !err.response) {
    if (err.code === "ECONNABORTED") return "Request timed out";
    return "Network error — please check your connection";
  }

  return err instanceof Error ? err.message : "Something went wrong";
}
