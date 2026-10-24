"use client";

import * as React from "react";
import Image from "next/image";
import { PhotoFill } from "@/components/ui/photo-image";

/**
 * Photographs inside the journey scenes.
 *
 * Project files under `/images/...` go through `next/image`, so the 4–6k-pixel originals in
 * `public/images` reach the reader resized for the slot (`sizes`) instead of as multi-megabyte
 * downloads. Anything else — an API URL on a remote host — falls back to `PhotoFill`, which
 * lazy-loads a plain `<img>` and shows the honest "not verified" tile when the URL is missing
 * or dies. That keeps a remote host that is not in `images.remotePatterns` from ever reaching
 * `next/image`, where it would throw.
 *
 * The wrapper is always `absolute inset-0`: the parent owns the box and its aspect ratio, so an
 * image arriving late can never move the layout or a pinned scene.
 */
export function JourneyImage({
  src,
  alt,
  sizes,
  className = "",
  eager = false,
  label,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
  label?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const local = typeof src === "string" && src.startsWith("/") && !src.startsWith("//");

  if (local && !failed) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <span className="absolute inset-0 block">
      <PhotoFill
        src={failed ? null : src}
        alt={alt}
        label={label}
        priority={eager}
        className={`h-full w-full object-cover ${className}`}
      />
    </span>
  );
}
