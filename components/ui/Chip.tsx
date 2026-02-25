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
  default: "border border-border bg-surface text-text",
  subtle: "border border-border bg-surface2 text-muted",
  accent: "border border-primary/20 bg-primary/10 text-primary",
  warning: "border border-warning/25 bg-warning/10 text-warning",
  danger: "border border-danger/20 bg-danger/10 text-danger"
};

export function Chip(props: ChipProps) {
  const { variant = "default", interactive = false } = props;
  const base = cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-brand",
    variants[variant],
    interactive && "hover:-translate-y-px hover:shadow-sm"
  );

  if (props.as === "span") {
    const { as, className, ...rest } = props;
    return <span className={cn(base, className)} {...rest} />;
  }

  const { as, className, type = "button", ...rest } = props;
  return <button type={type} className={cn(base, interactive && "cursor-pointer", className)} {...rest} />;
}
