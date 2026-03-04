import * as React from "react";
import { cn } from "@/lib/cn";

type AlertVariant = "info" | "success" | "warning" | "danger";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

const variants: Record<AlertVariant, string> = {
  info: "ui-panel-soft border border-lilac/25 bg-lilac/8 text-text",
  success: "border border-success/25 bg-success/10 text-success",
  warning: "border border-warning/30 bg-warning/10 text-text",
  danger: "border border-danger/25 bg-danger/10 text-danger"
};

export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return <div role="status" className={cn("rounded-xl px-3 py-2 text-sm shadow-sm", variants[variant], className)} {...props} />;
}
