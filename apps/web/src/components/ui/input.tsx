import * as React from "react";
import { cn } from "@/lib/utils";

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
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:outline-teal-500",
          error && "border-red-500 focus-visible:outline-red-500 dark:border-red-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        disabled={disabled}
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:outline-teal-500",
          error && "border-red-500 focus-visible:outline-red-500 dark:border-red-500",
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
        className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{helperText}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
