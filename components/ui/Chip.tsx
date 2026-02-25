import * as React from "react";
import { cn } from "@/lib/cn";

type ChipVariant = "default" | "subtle" | "accent" | "warning" | "danger";

type BaseProps = {
  variant?: ChipVariant;
  interactive?: boolean;
};

type ChipButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type ChipSpanProps = BaseProps & React.HTMLAttributes<HTMLSpanElement> & { as: "span" };
type ChipProps = ChipButtonProps | ChipSpanProps;

const variants: Record<ChipVariant, string> = {
  default:
    "border border-border/80 bg-surface text-text dark:border-border/90 dark:bg-surface2/60 dark:text-text",
  subtle:
    "border border-border/70 bg-surface2/70 text-text/90 dark:border-border/90 dark:bg-surface2/80 dark:text-text",
  accent:
    "border border-primary/30 bg-primary/12 text-primary dark:border-primary/45 dark:bg-primary/18 dark:text-primaryForeground",
  warning:
    "border border-warning/35 bg-warning/12 text-text dark:border-warning/45 dark:bg-warning/16 dark:text-warning",
  danger:
    "border border-danger/30 bg-danger/10 text-danger dark:border-danger/45 dark:bg-danger/16 dark:text-danger"
};

export function Chip(props: ChipProps) {
  const { variant = "default", interactive = false } = props;
  const base = cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/25 focus-visible:ring-2 focus-visible:ring-primary/40",
    variants[variant],
    interactive && "hover:-translate-y-px hover:shadow-sm hover:border-border"
  );

  if (props.as === "span") {
    const { as, className, ...rest } = props;
    return <span className={cn(base, className)} {...rest} />;
  }

  const { as, className, type = "button", ...rest } = props;
  return <button type={type} className={cn(base, interactive && "cursor-pointer", className)} {...rest} />;
}
