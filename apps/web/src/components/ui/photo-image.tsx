"use client";

import * as React from "react";
import { CameraOff } from "lucide-react";

/**
 * Client island for photograph fills, so `Photo` itself can stay a server
 * component.
 *
 * Two rules the site did not used to follow:
 *   1. A missing photo shows an honest "not verified yet" tile. The old card
 *      silently substituted an Unsplash stock picture, which reads as a wrong
 *      photo rather than an absent one.
 *   2. A URL that dies at render time falls back to that same tile instead of a
 *      broken-image glyph.
 */
export function PhotoFill({
  src,
  alt,
  className,
  priority = false,
  compact = false,
  label = "Photo not verified yet",
}: {
  src?: string | null;
  alt?: string | null;
  className?: string;
  priority?: boolean;
  compact?: boolean;
  label?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const showPlaceholder = !src || failed;

  if (showPlaceholder) {
    return (
      <span
        role="img"
        aria-label={`${alt || label} — ${label.toLowerCase()}`}
        className={`${className ?? ""} flex flex-col items-center justify-center gap-1.5 bg-surface-muted text-muted-foreground/60`}
      >
        <CameraOff className={compact ? "h-4 w-4" : "h-6 w-6"} strokeWidth={1.5} aria-hidden="true" />
        {!compact && (
          <span className="section-label px-4 text-center text-muted-foreground/70">{label}</span>
        )}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
