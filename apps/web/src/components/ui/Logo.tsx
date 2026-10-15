"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full" | "wordmark";
  showTagline?: boolean;
  priority?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 28, text: "text-lg", tagline: "text-[10px]" },
  md: { icon: 36, text: "text-xl sm:text-2xl", tagline: "text-xs" },
  lg: { icon: 48, text: "text-2xl sm:text-3xl", tagline: "text-xs" },
  xl: { icon: 64, text: "text-3xl sm:text-4xl", tagline: "text-sm" },
};

export function Logo({
  className,
  size = "md",
  variant = "full",
  showTagline = false,
  priority = true,
}: LogoProps) {
  const currentSize = SIZE_MAP[size];

  // The Emblem Icon: Rendered as a sharp, styled image referencing /logo.png with fallback to SVG
  const emblem = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-accent/25 shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:border-accent/50",
        size === "sm" && "h-7 w-7 rounded-lg",
        size === "md" && "h-9 w-9 rounded-xl",
        size === "lg" && "h-12 w-12 rounded-2xl",
        size === "xl" && "h-16 w-16 rounded-2xl"
      )}
      style={{
        background: "linear-gradient(135deg, #1c1815 0%, #28211b 50%, #151210 100%)",
      }}
    >
      <Image
        src="/logo.png"
        alt="CamTech Logo"
        width={currentSize.icon * 2}
        height={currentSize.icon * 2}
        priority={priority}
        className="h-full w-full object-contain p-0.5"
      />
    </div>
  );

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center", className)} aria-label="CamTech Logo">
        {emblem}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 group", className)} aria-label="CamTech.Blog">
      {variant !== "wordmark" && emblem}

      <div className="flex flex-col">
        <span
          className={cn(
            "font-display font-bold leading-none tracking-tight text-foreground transition-colors group-hover:text-foreground",
            currentSize.text
          )}
        >
          CamTech<span className="text-accent transition-colors group-hover:text-accent-foreground/90">.Blog</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 font-medium uppercase tracking-[0.14em] text-muted-foreground",
              currentSize.tagline
            )}
          >
            Technology &amp; Cambodia
          </span>
        )}
      </div>
    </div>
  );
}
