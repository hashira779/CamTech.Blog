import * as React from "react";
import Link from "next/link";
import { ExternalLink, Eye, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/sanitize";
import { formatDate, formatCount, toIsoString, type DateStyle } from "@/lib/format";

/**
 * Byline and metadata row.
 *
 * Every part is conditional. The previous cards printed "Editorial Desk" or
 * "Senior Editorial Desk" whenever the API returned no author, and "Today" /
 * "Recently" whenever there was no date — invented attribution on a news site.
 * This component renders nothing instead.
 */
export function MetaDot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("text-border-strong select-none", className)}>
      ·
    </span>
  );
}

export interface BylineProps {
  author?: string | null;
  authorHref?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  date?: string | number | Date | null;
  dateStyle?: DateStyle;
  /** Pre-formatted string ("3 min read") or a minute count. Omitted when falsy. */
  readingTime?: string | number | null;
  views?: number | string | null;
  location?: string | null;
  showAvatar?: boolean;
  size?: "sm" | "md";
  /** "invert" flips the palette for text sitting on a photograph. */
  tone?: "default" | "invert";
  className?: string;
}

export function Byline({
  author,
  authorHref,
  source,
  sourceUrl,
  date,
  dateStyle = "medium",
  readingTime,
  views,
  location,
  showAvatar = false,
  size = "sm",
  tone = "default",
  className,
}: BylineProps) {
  const invert = tone === "invert";
  const dateLabel = formatDate(date, dateStyle);
  const readLabel =
    typeof readingTime === "number" ? `${readingTime} min read` : readingTime || "";
  const viewsLabel = formatCount(views);

  const parts: React.ReactNode[] = [];

  if (author) {
    parts.push(
      authorHref ? (
        <Link
          key="author"
          href={authorHref}
          className={cn(
            "font-medium transition-colors hover:text-accent",
            invert ? "text-white" : "text-foreground"
          )}
        >
          {author}
        </Link>
      ) : (
        <span key="author" className={cn("font-medium", invert ? "text-white" : "text-foreground/90")}>
          {author}
        </span>
      )
    );
  }

  if (source) {
    // `sourceUrl` is the publisher's own link, taken from the feed. Five components pass it here,
    // so the scheme is checked once, at the place it becomes an `href`.
    const link = safeHref(sourceUrl);
    parts.push(
      link ? (
        <a
          key="source"
          href={link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 transition-colors hover:text-accent"
        >
          {source}
          <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
        </a>
      ) : (
        <span key="source">{source}</span>
      )
    );
  }

  if (location) {
    parts.push(
      <span key="location" className="inline-flex items-center gap-1">
        <MapPin size={12} strokeWidth={2} aria-hidden="true" />
        {location}
      </span>
    );
  }

  if (dateLabel) {
    parts.push(
      <time key="date" dateTime={toIsoString(date)} className="tabular-nums">
        {dateLabel}
      </time>
    );
  }

  if (readLabel) {
    parts.push(<span key="read">{readLabel}</span>);
  }

  if (viewsLabel) {
    parts.push(
      <span key="views" className="inline-flex items-center gap-1 tabular-nums">
        <Eye size={12} strokeWidth={2} aria-hidden="true" />
        {viewsLabel}
      </span>
    );
  }

  if (parts.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1",
        size === "sm" ? "text-xs" : "text-sm",
        invert ? "text-white/70" : "text-muted-foreground",
        className
      )}
    >
      {showAvatar && author && (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            invert ? "bg-white/20 text-white" : "bg-secondary text-secondary-foreground"
          )}
        >
          {author.trim().charAt(0).toUpperCase()}
        </span>
      )}
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <MetaDot className={invert ? "text-white/40" : undefined} />}
          {part}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Quiet "reported by" attribution used beside a lead story. */
export function SourceChip({
  source,
  sourceUrl,
  className,
}: {
  source?: string | null;
  sourceUrl?: string | null;
  className?: string;
}) {
  if (!source) return null;

  const link = safeHref(sourceUrl);

  const inner = (
    <>
      <span className="section-label text-muted-foreground">Source</span>
      <span className="font-medium text-foreground">{source}</span>
      {link && <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />}
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs",
    className
  );

  return link ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(classes, "transition-colors hover:border-border-strong hover:bg-surface-muted")}
    >
      {inner}
    </a>
  ) : (
    <span className={classes}>{inner}</span>
  );
}
