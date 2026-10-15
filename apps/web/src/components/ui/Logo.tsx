"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Sun, Moon, Download, Sparkles, ShieldCheck, Compass } from "lucide-react";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full" | "wordmark";
  showTagline?: boolean;
  priority?: boolean;
  showPopupOnHover?: boolean;
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
  showPopupOnHover = false,
}: LogoProps) {
  const currentSize = SIZE_MAP[size];
  const [isHovered, setIsHovered] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<"auto" | "light" | "dark">("auto");
  const [copiedNotification, setCopiedNotification] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!showPopupOnHover) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!showPopupOnHover) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 240); // 240ms grace period so moving cursor to popup feels smooth
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Dual-mode Emblem: Light mode shows /logo-light.svg on warm ivory; Dark mode shows /logo-dark.svg on rich obsidian
  const emblem = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden transition-all duration-300",
        // Light mode aesthetics: warm ceramic squircle with terracotta copper border
        "bg-gradient-to-br from-[#ffffff] via-[#fbf8f5] to-[#f2eae1] border border-[#c96637]/35 shadow-xs shadow-amber-950/5",
        // Dark mode aesthetics: obsidian squircle with metallic copper border & subtle aura
        "dark:bg-gradient-to-br dark:from-[#1c1815] dark:via-[#241e19] dark:to-[#151210] dark:border-accent/40 dark:shadow-none",
        "group-hover:scale-105 group-hover:border-accent group-hover:shadow-md",
        size === "sm" && "h-7 w-7 rounded-lg",
        size === "md" && "h-9 w-9 rounded-xl",
        size === "lg" && "h-12 w-12 rounded-2xl",
        size === "xl" && "h-16 w-16 rounded-2xl"
      )}
    >
      {/* Light Mode Logo Image */}
      <Image
        src="/logo-light.svg"
        alt="CamTech Logo"
        width={currentSize.icon * 2}
        height={currentSize.icon * 2}
        priority={priority}
        className="h-full w-full object-contain p-0.5 dark:hidden transition-transform duration-300"
      />
      {/* Dark Mode Logo Image */}
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Primary Logo Trigger */}
      <div className={cn("inline-flex items-center gap-2.5 group cursor-pointer", className)} aria-label="CamTech.Blog">
        {variant !== "wordmark" && emblem}
        {variant !== "icon" && wordmark}
      </div>

      {/* Interactive Hover Popup Showcase */}
      {showPopupOnHover && isHovered && (
        <div
          role="dialog"
          aria-label="CamTech Brand Identity"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute left-0 top-full pt-3 z-[100] w-[340px] sm:w-[380px] pointer-events-auto",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-5 shadow-2xl backdrop-blur-xl transition-all">
            {/* Ambient Background Aura */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-category-travel/15 blur-2xl" />

            {/* Header Badge & Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                <Sparkles size={11} className="animate-spin-slow" />
                <span>Brand Identity</span>
              </div>

              {/* Theme Preview Selector */}
              <div className="inline-flex items-center rounded-lg border border-border/60 bg-surface-muted/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTheme("light")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors",
                    previewTheme === "light"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="View Light Mode Logo"
                >
                  <Sun size={12} className="text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme("dark")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors",
                    previewTheme === "dark"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="View Dark Mode Logo"
                >
                  <Moon size={12} className="text-indigo-400" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme("auto")}
                  className={cn(
                    "px-1.5 py-0.5 rounded-md font-medium text-[11px] transition-colors",
                    previewTheme === "auto"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Follow Current System Theme"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Central Showcase Card */}
            <div className="my-4 flex flex-col items-center text-center">
              {/* High-Resolution Emblem Preview Box */}
              <div className="relative group/emblem mb-3">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent/30 via-category-travel/30 to-accent/30 blur-md opacity-70 group-hover/emblem:opacity-100 transition-opacity" />
                
                <div
                  className={cn(
                    "relative h-24 w-24 rounded-2xl p-2.5 transition-all duration-300 shadow-xl",
                    // Preview conditional styling
                    previewTheme === "light"
                      ? "bg-gradient-to-br from-[#ffffff] via-[#fbf8f5] to-[#f2eae1] border-2 border-[#c96637]/40"
                      : previewTheme === "dark"
                      ? "bg-gradient-to-br from-[#1c1815] via-[#241e19] to-[#151210] border-2 border-accent/50"
                      : "bg-gradient-to-br from-[#ffffff] via-[#fbf8f5] to-[#f2eae1] border-2 border-[#c96637]/40 dark:bg-gradient-to-br dark:from-[#1c1815] dark:via-[#241e19] dark:to-[#151210] dark:border-accent/50"
                  )}
                >
                  {previewTheme === "light" ? (
                    <Image
                      src="/logo-light.svg"
                      alt="CamTech Logo (Light)"
                      width={96}
                      height={96}
                      priority
                      className="h-full w-full object-contain"
                    />
                  ) : previewTheme === "dark" ? (
                    <Image
                      src="/logo-dark.svg"
                      alt="CamTech Logo (Dark)"
                      width={96}
                      height={96}
                      priority
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <>
                      <Image
                        src="/logo-light.svg"
                        alt="CamTech Logo (Light)"
                        width={96}
                        height={96}
                        priority
                        className="h-full w-full object-contain dark:hidden"
                      />
                      <Image
                        src="/logo-dark.svg"
                        alt="CamTech Logo (Dark)"
                        width={96}
                        height={96}
                        priority
                        className="hidden h-full w-full object-contain dark:block"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Brand Typography */}
              <h4 className="font-display text-xl font-bold tracking-tight text-foreground">
                CamTech<span className="text-accent">.Blog</span>
              </h4>
              <p className="mt-0.5 font-khmer text-xs font-semibold text-accent/90">
                បច្ចេកវិទ្យា និងការរុករកកម្ពុជា
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-[280px]">
                Cambodia&apos;s premier platform for attributed tech journalism, 25-province travel, and everyday web tools.
              </p>
            </div>

            {/* Feature Pills Grid */}
            <div className="grid grid-cols-3 gap-1.5 py-3 border-y border-border/60 text-center text-[10px]">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-muted/50 p-2">
                <Compass size={14} className="text-category-travel" />
                <span className="font-medium text-foreground">25 Provinces</span>
                <span className="text-[9px] text-muted-foreground">Travel Guides</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-muted/50 p-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="font-medium text-foreground">100% Privacy</span>
                <span className="text-[9px] text-muted-foreground">Client-Side Tools</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-muted/50 p-2">
                <Sparkles size={14} className="text-accent" />
                <span className="font-medium text-foreground">Verified AI</span>
                <span className="text-[9px] text-muted-foreground">Source Attributed</span>
              </div>
            </div>

            {/* Quick Assets Download / View Footer */}
            <div className="mt-3 flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-muted-foreground">Download brand logo:</span>
              <div className="flex items-center gap-1.5">
                <a
                  href="/logo-light.svg"
                  download="camtech-logo-light.svg"
                  className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  title="Download Light Mode Vector SVG"
                >
                  <Download size={11} />
                  <span>Light SVG</span>
                </a>
                <a
                  href="/logo-dark.svg"
                  download="camtech-logo-dark.svg"
                  className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  title="Download Dark Mode Vector SVG"
                >
                  <Download size={11} />
                  <span>Dark SVG</span>
                </a>
                <a
                  href="/logo.png"
                  download="camtech-logo.png"
                  className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                  title="Download High-Res PNG"
                >
                  <Download size={11} />
                  <span>PNG</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
