import * as React from "react";
import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "flex w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        disabled={disabled}
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          FIELD_CLASS,
          "h-10",
          error ? "border-destructive" : "border-input hover:border-border-strong",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        disabled={disabled}
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          FIELD_CLASS,
          "min-h-20 leading-relaxed",
          error ? "border-destructive" : "border-input hover:border-border-strong",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  id,
  error,
  helperText,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide text-foreground"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        )}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs leading-normal text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
