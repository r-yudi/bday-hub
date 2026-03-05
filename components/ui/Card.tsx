import * as React from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "bento";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variants: Record<CardVariant, string> = {
  default:
    "ui-panel-soft rounded-2xl border",
  elevated:
    "ui-panel rounded-2xl border transition-all duration-150 ease-brand hover:-translate-y-px",
  bento:
    "ui-panel rounded-2xl border"
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return <div className={cn(variants[variant], className)} {...props} />;
}
