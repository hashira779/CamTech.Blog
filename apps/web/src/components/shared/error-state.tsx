import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to load information",
  message = "A temporary connection or service delay occurred. Please try again or check back shortly.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-lg border border-destructive/25 bg-destructive/5 p-8 text-center ${className || ""}`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle size={18} aria-hidden="true" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mb-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RotateCcw size={14} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
