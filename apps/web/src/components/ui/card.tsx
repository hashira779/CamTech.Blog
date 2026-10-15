import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  /** Removes the border, leaving elevation only — used for image-led cards. */
  borderless?: boolean;
  /**
   * Applies body padding directly. Off by default so `CardHeader` / `CardContent`
   * keep owning the padding, which is how every existing card is built.
   */
  padded?: boolean;
  dense?: boolean;
}

/**
 * Card surface.
 *
 * Warm paper rather than cool slate, hairline borders instead of heavy ones, and
 * elevation from the token shadow scale. `hoverEffect` now lifts with a warm
 * shadow; the old version added a neon teal glow in dark mode.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, borderless = false, padded = false, dense = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col bg-card text-card-foreground transition-colors duration-300",
        borderless ? "rounded-lg" : "rounded-lg border border-border shadow-xs",
        hoverEffect && "hover-lift hover:border-border-strong",
        padded && (dense ? "p-4" : "p-5 sm:p-6"),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 px-5 pt-5 sm:px-6 sm:pt-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-snug tracking-tight text-foreground", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 sm:p-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-auto flex items-center gap-3 border-t border-border px-5 py-4 sm:px-6", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
