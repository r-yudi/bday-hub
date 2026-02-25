"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primaryForeground shadow-sm hover:-translate-y-px hover:shadow-md hover:brightness-[0.98] active:translate-y-0 active:brightness-95 disabled:bg-primary/65 disabled:text-primaryForeground/95 disabled:shadow-none disabled:hover:translate-y-0",
  secondary:
    "border border-border/80 bg-surface2/70 text-text shadow-sm hover:-translate-y-px hover:border-border hover:bg-surface2 hover:shadow-sm active:bg-surface2/90 dark:border-border/90 dark:bg-surface2/80 dark:hover:bg-surface2 dark:hover:border-border disabled:border-border/80 disabled:bg-surface2/70 disabled:text-muted disabled:shadow-none disabled:hover:translate-y-0",
  ghost:
    "border border-transparent bg-transparent text-text hover:border-border/70 hover:bg-surface2/45 active:bg-surface2/65 dark:text-text dark:hover:border-border/90 dark:hover:bg-surface2/60 dark:active:bg-surface2/80 disabled:border-border/40 disabled:bg-surface2/30 disabled:text-muted disabled:hover:bg-surface2/30",
  destructive:
    "bg-danger text-white shadow-sm hover:-translate-y-px hover:shadow-md hover:brightness-95 active:brightness-90 disabled:bg-danger/65 disabled:text-white/95 disabled:shadow-none disabled:hover:translate-y-0"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 ease-brand disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/25 focus-visible:ring-2 focus-visible:ring-primary/45",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
});
