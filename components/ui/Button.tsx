import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled ?? isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none dark:focus:ring-offset-surface-900",
          {
            primary:
              "bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-sm hover:from-primary-600 hover:to-primary-700 hover:shadow-md focus:ring-primary-500 active:from-primary-700 active:to-primary-800",
            secondary:
              "bg-white text-surface-700 border border-surface-200 shadow-sm hover:bg-surface-50 hover:border-surface-300 focus:ring-surface-400 dark:bg-surface-800 dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-700 dark:hover:border-surface-500",
            ghost:
              "text-surface-600 hover:bg-surface-100 focus:ring-surface-300 dark:text-surface-400 dark:hover:bg-surface-800",
            danger:
              "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 hover:shadow-md focus:ring-red-500",
          }[variant],
          {
            sm: "text-sm px-3 py-1.5 gap-1.5",
            md: "text-sm px-4 py-2 gap-2",
            lg: "text-base px-6 py-2.5 gap-2",
          }[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading…
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
