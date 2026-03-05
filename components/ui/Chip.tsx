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
    "border border-border/80 bg-surface text-text",
  subtle:
    "border border-border/70 bg-surface2/70 text-text/90",
  accent:
    "border border-primary/30 bg-primary/12 text-primary",
  warning:
    "border border-warning/35 bg-warning/12 text-text",
  danger:
    "border border-danger/30 bg-danger/10 text-danger"
};

export function Chip(props: ChipProps) {
  const { variant = "default", interactive = false } = props;
  const base = cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/25 focus-visible:ring-2 focus-visible:ring-primary/40",
    variants[variant],
    interactive && "hover:-translate-y-px hover:shadow-sm hover:border-border"
  );

  if (props.as === "span") {
    const { as, className, interactive: _interactive, ...rest } = props;
    return <span className={cn(base, className)} {...rest} />;
  }

  const { as, className, type = "button", interactive: _interactive, ...rest } = props;
  return <button type={type} className={cn(base, interactive && "cursor-pointer", className)} {...rest} />;
}
