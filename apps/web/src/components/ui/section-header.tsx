import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  /** Small uppercase mark above the title, e.g. "Cambodia" or "In this issue". */
  label?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned link or control. Rendered as a quiet text link, not a button. */
  action?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  /** Heading level for the title. */
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
  /** Draws the hairline rule through the label row. */
  rule?: boolean;
}

/**
 * The single section heading treatment.
 *
 * "Trending Now" was rendered three different ways (a rose pill in the header, a
 * teal dot on the homepage, a plain h3 in the sidebar) and every listing page
 * invented its own. One component, one rule, one type pair.
 */
export function SectionHeader({
  label,
  title,
  description,
  action,
  actionHref,
  actionLabel,
  as: TitleTag = "h2",
  align = "left",
  className,
  rule = true,
}: SectionHeaderProps) {
  const actionNode = action ?? (actionHref && actionLabel ? (
    <Link
      href={actionHref}
      className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
    >
      {actionLabel}
      <ArrowRight
        size={15}
        strokeWidth={2}
        className="link-nudge"
        aria-hidden="true"
      />
    </Link>
  ) : null);

  return (
    <header
      className={cn(
        "mb-6 sm:mb-8",
        align === "center" && "text-center",
        className
      )}
    >
      {(label || actionNode) && (
        <div
          className={cn(
            "flex items-center gap-4",
            align === "center" && "justify-center"
          )}
        >
          {label && (
            <span className="section-label shrink-0 text-accent">{label}</span>
          )}
          {rule && label && (
            <span
              aria-hidden="true"
              className="hidden h-px flex-1 bg-border sm:block"
            />
          )}
          {actionNode && <div className="ml-auto shrink-0 sm:ml-0">{actionNode}</div>}
        </div>
      )}

      <TitleTag
        className={cn(
          "mt-2 font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl",
          !label && !actionNode && "mt-0"
        )}
      >
        {title}
      </TitleTag>

      {description && (
        <p
          className={cn(
            "mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
