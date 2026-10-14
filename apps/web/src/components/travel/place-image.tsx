import React from "react";
import { CameraOff } from "lucide-react";

/**
 * Place photo with an honest empty state.
 *
 * Tourism galleries now store only images verified to actually depict the place, so a place can
 * legitimately have no photo. The previous fallback showed a stock picture of Angkor Wat on every
 * place without an image — which read as a wrong photo, exactly like the generic gallery padding.
 * A neutral "not verified yet" tile replaces it.
 */
export default function PlaceImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  compact = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  compact?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${alt} — photo not verified yet`}
        className={`${className} flex flex-col items-center justify-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600`}
      >
        <CameraOff className={compact ? "w-4 h-4" : "w-7 h-7"} strokeWidth={1.5} />
        {!compact && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-3 text-center">
            Photo not verified yet
          </span>
        )}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}
