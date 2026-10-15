import * as React from "react";
import { cn } from "@/lib/utils";
import { PhotoFill } from "@/components/ui/photo-image";

export type PhotoRatio = "16/9" | "4/3" | "3/2" | "1/1" | "21/9" | "none";
export type PhotoRadius = "none" | "md" | "lg" | "xl" | "hero";

const RATIO_CLASS: Record<PhotoRatio, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  "21/9": "aspect-[21/9]",
  none: "",
};

const RADIUS_CLASS: Record<PhotoRadius, string> = {
  none: "",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  hero: "rounded-2xl sm:rounded-3xl",
};

export interface PhotoProps {
  src?: string | null;
  alt?: string | null;
  /** Real credit from the pipeline (Wikimedia author, licence). Omitted when unknown. */
  credit?: string | null;
  license?: string | null;
  ratio?: PhotoRatio;
  radius?: PhotoRadius;
  /** Subtle scale on hover of the nearest `group` ancestor. */
  zoom?: boolean;
  priority?: boolean;
  compact?: boolean;
  showCredit?: boolean;
  placeholderLabel?: string;
  className?: string;
  imgClassName?: string;
}

/**
 * One photograph treatment for the whole site: warm placeholder tile, generous
 * radius, hairline inner ring and an attribution chip when the pipeline actually
 * knows who took the picture.
 */
export function Photo({
  src,
  alt,
  credit,
  license,
  ratio = "16/9",
  radius = "lg",
  zoom = true,
  priority = false,
  compact = false,
  showCredit = true,
  placeholderLabel,
  className,
  imgClassName,
}: PhotoProps) {
  const attribution = [credit, license].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "photo-in relative overflow-hidden bg-surface-muted",
        RATIO_CLASS[ratio],
        RADIUS_CLASS[radius],
        "shadow-[inset_0_0_0_1px_rgba(28,25,23,0.06)]",
        className
      )}
    >
      <PhotoFill
        src={src}
        alt={alt}
        priority={priority}
        compact={compact}
        label={placeholderLabel}
        className={cn("h-full w-full object-cover", zoom && "photo-zoom", imgClassName)}
      />

      {showCredit && attribution && (
        <span className="pointer-events-none absolute bottom-2 right-2 max-w-[80%] truncate rounded-md bg-background/80 px-2 py-1 text-xs leading-none text-muted-foreground backdrop-blur-sm">
          {attribution}
        </span>
      )}
    </div>
  );
}
