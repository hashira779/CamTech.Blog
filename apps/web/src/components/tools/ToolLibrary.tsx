"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  LayoutGrid,
  Calculator,
  Code2,
  Video,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  Coins,
} from "lucide-react";
import type { Tool } from "@/types";
import { ToolCard } from "@/components/shared/tool-card";
import {
  TikTokBrandIcon,
  YouTubeBrandIcon,
  FacebookBrandIcon,
  InstagramBrandIcon,
  XTwitterBrandIcon,
  DouyinBrandIcon,
} from "@/components/tools/UniversalVideoDownloader";

const groups = [
  { key: "ALL", label: "All utilities", icon: LayoutGrid },
  { key: "IMAGE", label: "Media & Video", icon: Video },
  { key: "CALCULATOR", label: "Calculators", icon: Calculator },
  { key: "DEVELOPER", label: "Developer", icon: Code2 },
  { key: "TEXT", label: "Writing & text", icon: FileText },
];

export function ToolLibrary({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");

  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return tools.filter((tool) => {
      const inCategory = group === "ALL" || tool.category === group;
      const inQuery = words.every((word) =>
        `${tool.name} ${tool.description} ${tool.name_km || ""} ${tool.slug}`
          .toLowerCase()
          .includes(word)
      );
      return inCategory && inQuery;
    });
  }, [tools, query, group]);

  // Featured flagship tools for Nuxt-style Bento Grid
  const videoTool = tools.find((t) => t.slug === "universal-video-downloader");
  const khqrTool = tools.find((t) => t.slug === "khqr-generator");
  const taxTool = tools.find((t) => t.slug === "cambodia-salary-tax-calculator");
  const changeTool = tools.find((t) => t.slug === "cambodia-change-calculator");

  // Remaining tools not in the top hero bento
  const bentoHeroSlugs = new Set([
    "universal-video-downloader",
    "khqr-generator",
    "cambodia-salary-tax-calculator",
    "cambodia-change-calculator",
  ]);

  const regularTools = useMemo(() => {
    if (group !== "ALL" || query.trim() !== "") {
      return matches;
    }
    return matches.filter((t) => !bentoHeroSlugs.has(t.slug));
  }, [matches, group, query]);

  return (
    <div className="space-y-10 py-6 sm:py-8">
      {/* ── Nuxt DevTools Inspired Search & Filter Console ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-surface via-surface/95 to-surface-muted/30 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        {/* Ambient subtle glow background */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Top Pill & Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
              </span>
              <span>CamTech Toolbox v4.2</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {tools.length} Production Utilities · Zero Account Required
            </span>
          </div>

          {/* Search Box with Ambient Glow */}
          <div className="relative flex items-center rounded-2xl border-2 border-border/80 bg-background/80 shadow-xs transition-all focus-within:border-accent focus-within:shadow-md focus-within:ring-4 focus-within:ring-accent/15">
            <div className="pointer-events-none pl-4 text-muted-foreground">
              <Search size={19} />
            </div>
            <input
              type="text"
              role="searchbox"
              aria-label="Search tools"
              placeholder="Search by name, platform (TikTok, YouTube, KHQR, Tax) or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-4 pl-3.5 pr-12 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-base"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear tool search"
                className="absolute right-3.5 rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2" aria-label="Tool categories">
              {groups.map(({ key, label, icon: GroupIcon }) => {
                const isSelected = group === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setGroup(key)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-accent bg-accent text-accent-foreground shadow-xs"
                        : "border-border/80 bg-surface text-muted-foreground hover:border-border-strong hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <GroupIcon size={14} className="shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <span className="font-mono text-xs text-muted-foreground" role="status">
              {matches.length} {matches.length === 1 ? "tool" : "tools"} available
            </span>
          </div>
        </div>
      </div>

      {/* ── Nuxt-Grade Bento Grid (Shown on Default Full View) ── */}
      {group === "ALL" && !query && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Featured Flagship Utilities
            </h3>
            <span className="text-xs text-muted-foreground">Curated for everyday speed</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* ── Bento Card 1: Universal Video Downloader (Spans 2 Cols) ── */}
            {videoTool && (
              <Link
                href="/tools/universal-video-downloader"
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-surface via-surface to-accent/5 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-xl md:col-span-2"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles size={12} />
                      <span>FLAGSHIP 2026 MEDIA ENGINE</span>
                    </span>
                    <span className="rounded-full border border-border/80 bg-surface px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      No Watermark HD
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif text-xl font-bold text-foreground transition-colors group-hover:text-accent sm:text-2xl">
                      Universal Video &amp; Audio Downloader
                    </h4>
                    <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      Extract watermark-free MP4 videos (1080p, 720p, 480p) and MP3 music streams from TikTok, YouTube, Facebook, Instagram Reels, Twitter/X, and Douyin with zero accounts.
                    </p>
                  </div>

                  {/* Brand Icons Row Preview */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                      <TikTokBrandIcon className="h-3.5 w-3.5" />
                      <span>TikTok</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                      <YouTubeBrandIcon className="h-3.5 w-3.5" />
                      <span>YouTube</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                      <FacebookBrandIcon className="h-3.5 w-3.5" />
                      <span>Facebook</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                      <InstagramBrandIcon className="h-3.5 w-3.5" />
                      <span>Instagram</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                      <XTwitterBrandIcon className="h-3.5 w-3.5" />
                      <span>Twitter / X</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                      <DouyinBrandIcon className="h-3.5 w-3.5" />
                      <span>Douyin</span>
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4 text-xs font-bold text-accent">
                  <span>Open Downloader Studio</span>
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 2: Bakong KHQR Generator (Spans 1 Col) ── */}
            {khqrTool && (
              <Link
                href="/tools/khqr-generator"
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-surface via-surface to-emerald-500/5 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl md:col-span-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <QrCode size={22} />
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      NBC EMVCo
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-lg font-bold text-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Bakong KHQR Generator
                    </h4>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      Generate official National Bank of Cambodia (NBC) KHQR codes with EMVCo CRC-16 checksums, plus instant restaurant bill splitting.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Generate QR</span>
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 3: Cambodia Salary Tax ToS (Spans 1 Col) ── */}
            {taxTool && (
              <Link
                href="/tools/cambodia-salary-tax-calculator"
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-surface via-surface to-blue-500/5 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl md:col-span-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Calculator size={22} />
                    </span>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      GDT &amp; NSSF
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-lg font-bold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Salary &amp; Tax on Salary (ToS)
                    </h4>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      Calculate official General Department of Taxation (GDT) tiered progressive tax brackets, pension deductions, and net salary.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Calculate Tax</span>
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 4: USD ↔ KHR Dual Currency Change (Spans 2 Cols) ── */}
            {changeTool && (
              <Link
                href="/tools/cambodia-change-calculator"
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-surface/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-xl md:col-span-2"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Coins size={22} />
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                          USD ↔ KHR Cash Change Calculator
                        </h4>
                        <span className="font-mono text-xs text-muted-foreground">Market-Ready Dual Currency Solver</span>
                      </div>
                    </div>
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Cash Helper
                    </span>
                  </div>

                  <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                    Instant change breakdown for dual-currency transactions across Cambodian markets with banknote denomination counters (50k, 20k, 10k, 5k, 2k, 1k, 500, 100 Riel).
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4 text-xs font-bold text-accent">
                  <span>Open Cash Counter</span>
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── All Utilities Bento Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {group === "ALL" && !query ? "Explore Entire Catalog" : `Results (${matches.length})`}
          </h3>
          <span className="text-xs text-muted-foreground">
            {group === "ALL" ? "All categories" : groups.find((g) => g.key === group)?.label}
          </span>
        </div>

        {regularTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regularTools.map((tool) => (
              <ToolCard
                key={tool.id}
                slug={tool.slug}
                name={tool.name}
                description={tool.description}
                category={tool.category}
                popular={tool.is_popular}
                usageCount={tool.usage_count}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <h4 className="font-serif text-xl font-bold text-foreground">No utilities found for that.</h4>
            <p className="mt-2 text-xs text-muted-foreground">
              Try adjusting your search query or reset category filter.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:opacity-90"
              onClick={() => {
                setQuery("");
                setGroup("ALL");
              }}
            >
              Show all utilities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
