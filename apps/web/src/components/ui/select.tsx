import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, disabled, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          disabled={disabled}
          ref={ref}
          aria-invalid={error || undefined}
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border bg-surface px-3 pr-9 py-2 text-sm text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-destructive" : "border-input hover:border-border-strong",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted-foreground"
        />
      </div>
    );
  }
);
Select.displayName = "Select";
