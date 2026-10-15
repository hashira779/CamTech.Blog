import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "accent"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "info";
  size?: "sm" | "md";
}

/**
 * Badge. Variant names are unchanged so existing call sites keep compiling; the
 * colours now come from tokens instead of per-page teal/slate/emerald picks.
 */
export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex select-none items-center gap-1.5 rounded-md border text-xs font-semibold tracking-[0.02em] transition-colors";

  const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border-border bg-secondary text-secondary-foreground",
    accent: "border-transparent bg-accent text-accent-foreground",
    secondary: "border-border bg-muted text-muted-foreground",
    outline: "border-border-strong bg-transparent text-foreground",
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/25 bg-warning/10 text-warning",
    destructive: "border-destructive/25 bg-destructive/10 text-destructive",
    info: "border-info/25 bg-info/10 text-info",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5",
    md: "px-2.5 py-1",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </span>
  );
}
