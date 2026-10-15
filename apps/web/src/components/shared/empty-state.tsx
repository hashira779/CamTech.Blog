import * as React from "react";
import { LucideIcon, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Compass,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-muted/50 p-8 text-center sm:p-12 ${className || ""}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted-foreground">
        <Icon size={20} />
      </div>
      <h3 className="mb-1 font-display text-base text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <Button variant="primary" size="sm" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
