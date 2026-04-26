"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import {
  ToastContainer,
  toast,
  type ToastContent,
  type ToastOptions,
  type Id,
} from "react-toastify";

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

const MAX_TOASTS = 5;

function mapType(variant: ToastVariant): ToastOptions["type"] {
  if (variant === "success") return "success";
  if (variant === "error") return "error";
  if (variant === "warning") return "warning";
  return "info";
}

function buildContent(title: string, description?: string): ToastContent {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold leading-5">{title}</p>
      {description ? <p className="text-xs leading-4 opacity-95">{description}</p> : null}
    </div>
  );
}

function mapClassName(type?: string): string {
  if (type === "error") return "bg-red-700 text-white border border-red-300";
  if (type === "success") return "bg-emerald-700 text-white border border-emerald-300";
  if (type === "warning") return "bg-amber-600 text-white border border-amber-300";
  return "bg-blue-700 text-white border border-blue-300";
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }: { children: ReactNode }) {
  const removeToast = useCallback((id: string) => {
    toast.dismiss(id as Id);
  }, []);

  const addToast = useCallback(
    (nextToast: Omit<Toast, "id">) => {
      const id = toast(buildContent(nextToast.title, nextToast.description), {
        type: mapType(nextToast.variant),
        autoClose: nextToast.duration ?? 5000,
      });
      return String(id);
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
    toasts: [],
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
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        limit={MAX_TOASTS}
        theme="colored"
        toastClassName={(ctx) => `rounded-lg shadow-lg ${mapClassName(ctx?.type)}`}
        progressClassName="!bg-white/50"
      />
    </ToastContext.Provider>
  );
}
