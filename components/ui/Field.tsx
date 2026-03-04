import * as React from "react";
import { cn } from "@/lib/cn";

export function FieldGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-text", className)} {...props} />;
}

const controlBase =
  "w-full rounded-xl border border-border/80 bg-surface/90 px-3 py-2.5 text-sm text-text shadow-sm outline-none placeholder:text-muted/80 focus-visible:border-border focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border/90 dark:bg-surface2/75 dark:placeholder:text-muted/90 dark:focus-visible:ring-primary/45";

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean };
export function TextInput({ className, hasError, ...props }: TextInputProps) {
  return <input className={cn(controlBase, hasError && "border-danger/50", className)} {...props} />;
}

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean };
export function TextArea({ className, hasError, ...props }: TextAreaProps) {
  return <textarea className={cn(controlBase, "min-h-24", hasError && "border-danger/50", className)} {...props} />;
}

export type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean };
export function SelectField({ className, hasError, ...props }: SelectFieldProps) {
  return <select className={cn(controlBase, hasError && "border-danger/50", className)} {...props} />;
}

export function FieldHelper({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted", className)} {...props} />;
}

export function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-danger", className)} {...props} />;
}
