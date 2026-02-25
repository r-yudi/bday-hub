import * as React from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "bento";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variants: Record<CardVariant, string> = {
  default: "rounded-xl border border-border bg-surface shadow-sm",
  elevated: "rounded-xl border border-border bg-surface shadow-md transition-all duration-150 ease-brand hover:-translate-y-px hover:shadow-lg",
  bento: "rounded-xl border border-border bg-gradient-to-b from-surface to-surface2 shadow-md"
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return <div className={cn(variants[variant], className)} {...props} />;
}
