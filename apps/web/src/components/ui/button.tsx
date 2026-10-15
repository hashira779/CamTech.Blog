import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

/**
 * Button.
 *
 * The primary action is ink, not a saturated colour — that is what makes an
 * editorial layout feel calm. `accent` (terracotta) is reserved for the one thing
 * a page most wants you to do.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading = false, asChild = false, disabled, children, ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex cursor-pointer select-none items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

    const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary",
      accent: "bg-accent text-accent-foreground shadow-xs hover:brightness-110 active:brightness-95",
      secondary: "bg-secondary text-secondary-foreground hover:bg-muted active:bg-secondary",
      outline:
        "border border-border-strong bg-transparent text-foreground hover:border-foreground/30 hover:bg-surface-muted",
      ghost: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      destructive: "bg-destructive text-destructive-foreground shadow-xs hover:brightness-110",
      link: "h-auto bg-transparent p-0 text-accent underline-offset-4 hover:underline",
    };

    const sizeStyles = {
      sm: "h-8 gap-1.5 px-3 text-xs",
      md: "h-10 gap-2 px-4 text-sm",
      lg: "h-12 gap-2.5 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    const combinedClasses = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(combinedClasses, (children.props as { className?: string }).className),
      });
    }

    return (
      <button ref={ref} disabled={disabled || isLoading} className={combinedClasses} {...props}>
        {isLoading && (
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
