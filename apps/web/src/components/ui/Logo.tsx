"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full" | "wordmark";
  showTagline?: boolean;
  priority?: boolean;
  showPopupOnHover?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 28, text: "text-lg", tagline: "text-xs" },
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
  showPopupOnHover = false,
}: LogoProps) {
  const currentSize = SIZE_MAP[size];
  const [isHovered, setIsHovered] = useState(false);

  // Dual-mode Emblem: Light mode shows /logo-light.svg; Dark mode shows /logo-dark.svg
  const emblem = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-surface via-background to-secondary border border-accent/35 shadow-xs",
        "dark:bg-gradient-to-br dark:from-surface-elevated dark:via-surface dark:to-surface-muted dark:border-accent/40 dark:shadow-none",
        "group-hover:scale-105 group-hover:border-accent group-hover:shadow-md",
        size === "sm" && "h-7 w-7 rounded-lg",
        size === "md" && "h-9 w-9 rounded-xl",
        size === "lg" && "h-12 w-12 rounded-2xl",
        size === "xl" && "h-16 w-16 rounded-2xl"
      )}
    >
      <Image
        src="/logo-light.svg"
        alt="CamTech Logo"
        width={currentSize.icon * 2}
        height={currentSize.icon * 2}
        priority={priority}
        className="h-full w-full object-contain p-0.5 dark:hidden transition-transform duration-300"
      />
      <Image
        src="/logo-dark.svg"
        alt="CamTech Logo"
        width={currentSize.icon * 2}
        height={currentSize.icon * 2}
        priority={priority}
        className="hidden h-full w-full object-contain p-0.5 dark:block transition-transform duration-300"
      />
    </div>
  );

  const wordmark = (
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
  );

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => showPopupOnHover && setIsHovered(true)}
      onMouseLeave={() => showPopupOnHover && setIsHovered(false)}
    >
      <div
        className="inline-flex items-center gap-2.5 group cursor-pointer"
        aria-label="CamTech.Blog"
      >
        {variant !== "wordmark" && emblem}
        {variant !== "icon" && wordmark}
      </div>

      {/* Simple, sleek hover preview with logo only */}
      {showPopupOnHover && isHovered && (
        <div
          role="tooltip"
          aria-label="CamTech Logo"
          className="absolute left-1/2 -translate-x-1/2 top-full pt-2.5 z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-br from-surface via-background to-secondary p-1.5 shadow-xs dark:border-accent/40 dark:from-surface-elevated dark:via-surface dark:to-surface-muted">
              <Image
                src="/logo-light.svg"
                alt="CamTech Logo"
                width={80}
                height={80}
                priority
                className="h-full w-full object-contain dark:hidden"
              />
              <Image
                src="/logo-dark.svg"
                alt="CamTech Logo"
                width={80}
                height={80}
                priority
                className="hidden h-full w-full object-contain dark:block"
              />
            </div>
            <span className="font-display text-xs font-bold tracking-tight text-foreground whitespace-nowrap">
              CamTech<span className="text-accent">.Blog</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
