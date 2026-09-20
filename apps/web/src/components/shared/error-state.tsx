import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS } from "@/lib/tokens";

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
      className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20 ${className || ""}`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 mb-3">
        <AlertCircle size={DESIGN_TOKENS.iconSize.lg} />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RotateCcw size={DESIGN_TOKENS.iconSize.xs} />
          Try Again
        </Button>
      )}
    </div>
  );
}
