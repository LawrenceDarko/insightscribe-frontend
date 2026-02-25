"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss delay in ms. `0` = sticky. Default 5000. */
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  /** Convenience shortcuts */
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/**
 * Standalone getter for use outside React components (e.g. API layer).
 * Set by the provider on mount.
 */
let _globalToast: ToastContextValue | null = null;

export function getToast(): ToastContextValue | null {
  return _globalToast;
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG — zero deps)                                     */
/* ------------------------------------------------------------------ */

const icons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950/60 dark:text-green-200 dark:border-green-500/40",
  error:
    "border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200 dark:border-red-500/40",
  warning:
    "border-yellow-500/30 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200 dark:border-yellow-500/40",
  info:
    "border-primary-500/30 bg-primary-50 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200 dark:border-primary-500/40",
};

/* ------------------------------------------------------------------ */
/*  Single Toast Item                                                  */
/* ------------------------------------------------------------------ */

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [onDismiss, toast.id]);

  // Auto-dismiss timer
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const duration = toast.duration ?? 5000;

  // Start timer on mount
  useState(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(dismiss, duration);
    }
  });

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-200",
        variantStyles[toast.variant],
        exiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      )}
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        if (duration > 0) {
          timerRef.current = setTimeout(dismiss, duration);
        }
      }}
    >
      {icons[toast.variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs opacity-80 leading-4">{toast.description}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const idCounter = useRef(0);

  useEffect(() => setMounted(true), []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${++idCounter.current}-${Date.now()}`;
      setToasts((prev) => {
        const next = [...prev, { ...toast, id }];
        // Keep only the newest MAX_TOASTS
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
      });
      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "success", title, description }),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "error", title, description, duration: 8000 }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "warning", title, description }),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: "info", title, description }),
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  // Expose globally for non-React code (API client)
  _globalToast = value;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end"
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
