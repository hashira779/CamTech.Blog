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
  ArrowRight,
  Zap,
  Coins,
  ShieldCheck,
  Sparkles,
  LayoutTemplate,
  Languages,
  QrCode,
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

  // Featured utilities for the top Bento Spotlight (CV Builder promoted as #1 top flagship tool)
  const cvTool = tools.find((t) => t.slug === "cv-builder");
  const videoTool = tools.find((t) => t.slug === "universal-video-downloader");
  const taxTool = tools.find((t) => t.slug === "cambodia-salary-tax-calculator");
  const edcTool = tools.find((t) => t.slug === "edc-electricity-calculator");
  const changeTool = tools.find((t) => t.slug === "cambodia-change-calculator");

  const bentoHeroSlugs = new Set([
    "cv-builder",
    "universal-video-downloader",
    "cambodia-salary-tax-calculator",
    "edc-electricity-calculator",
    "cambodia-change-calculator",
  ]);

  const regularTools = useMemo(() => {
    if (group !== "ALL" || query.trim() !== "") {
      return matches;
    }
    return matches.filter((t) => !bentoHeroSlugs.has(t.slug));
  }, [matches, group, query]);

  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* ── Search & Filter Console (Clean Standard Palette) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-2xs sm:p-7">
        <div className="space-y-5">
          {/* Header Tagline & Count */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CamTech Everyday Toolbox · 2026 Utilities
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {tools.length} Utilities · Zero Account Required
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center rounded-xl border border-border bg-background transition-all focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/10">
            <div className="pointer-events-none pl-3.5 text-muted-foreground">
              <Search size={18} />
            </div>
            <input
              type="text"
              role="searchbox"
              aria-label="Search tools"
              placeholder="Search tools by name, platform (TikTok, YouTube, Tax, EDC) or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-3.5 pl-3 pr-10 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-base"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear tool search"
                className="absolute right-3 rounded-lg p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Tool categories">
              {groups.map(({ key, label, icon: GroupIcon }) => {
                const isSelected = group === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setGroup(key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-foreground bg-foreground text-background font-semibold shadow-2xs"
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    <GroupIcon size={13} className="shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <span className="font-mono text-xs text-muted-foreground" role="status">
              {matches.length} {matches.length === 1 ? "tool" : "tools"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Featured Bento Grid (Standard Monochromatic Design) ── */}
      {group === "ALL" && !query && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Featured Everyday Utilities
            </h3>
            <span className="text-xs text-muted-foreground">Most accessed tools</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* ── #1 Top Tool: Free Khmer & English CV Builder (Full Width Top Card) ── */}
            {cvTool && (
              <Link
                href="/tools/cv-builder"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-strong bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/40 hover:shadow-sm md:col-span-3"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-surface-muted px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                      <Sparkles size={12} aria-hidden="true" />
                      #1 Top Tool · Bilingual CV Studio
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                      <ShieldCheck size={13} aria-hidden="true" />
                      Zero Login · Private in Browser
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-serif text-xl font-bold text-foreground transition-colors group-hover:text-accent sm:text-2xl">
                      Free Khmer &amp; English CV Builder
                    </h4>
                    <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      Build clean A4 studio or ATS-ready résumés in English, Khmer, or Bilingual mode across 30+ free templates. Automatically loads a realistic example preview when choosing a template, exports crisp PDF immediately, or sends to your phone via Telegram QR.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                      <LayoutTemplate size={14} aria-hidden="true" />
                      <span>30+ A4 Templates</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                      <Languages size={14} aria-hidden="true" />
                      <span>EN · ខ្មែរ · Bilingual</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                      <QrCode size={14} aria-hidden="true" />
                      <span>Instant PDF &amp; Telegram QR</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-semibold text-accent">
                  <span>Open CV Builder</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 1: Universal Video Downloader (Spans 2 Cols) ── */}
            {videoTool && (
              <Link
                href="/tools/universal-video-downloader"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xs md:col-span-2"
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Media Extractor
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      1080p Full HD · MP3 Audio
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-serif text-xl font-bold text-foreground transition-colors group-hover:text-accent sm:text-2xl">
                      Universal Video &amp; Audio Downloader
                    </h4>
                    <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      Download watermark-free videos and high-quality MP3 audio from TikTok, YouTube, Facebook, Instagram Reels, Twitter/X, and Douyin without software installation.
                    </p>
                  </div>

                  {/* Brand Vector SVGs */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                      <TikTokBrandIcon className="h-3.5 w-3.5" />
                      <span>TikTok</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                      <YouTubeBrandIcon className="h-3.5 w-3.5" />
                      <span>YouTube</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                      <FacebookBrandIcon className="h-3.5 w-3.5" />
                      <span>Facebook</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                      <InstagramBrandIcon className="h-3.5 w-3.5" />
                      <span>Instagram</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                      <XTwitterBrandIcon className="h-3.5 w-3.5" />
                      <span>Twitter / X</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                      <DouyinBrandIcon className="h-3.5 w-3.5" />
                      <span>Douyin</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-semibold text-accent">
                  <span>Open Downloader</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 2: Cambodia Salary & Tax ToS (Spans 1 Col) ── */}
            {taxTool && (
              <Link
                href="/tools/cambodia-salary-tax-calculator"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xs md:col-span-1"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground">
                      <Calculator size={19} />
                    </span>
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Official GDT
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground transition-colors group-hover:text-accent">
                      Salary &amp; Tax on Salary (ToS)
                    </h4>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      Calculate official General Department of Taxation progressive tax tiers, NSSF pension deductions, and net take-home pay.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-semibold text-accent">
                  <span>Calculate Salary</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 3: EDC Electricity Tariff (Spans 1 Col) ── */}
            {edcTool && (
              <Link
                href="/tools/edc-electricity-calculator"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xs md:col-span-1"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground">
                      <Zap size={19} />
                    </span>
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      EDC Tariffs
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground transition-colors group-hover:text-accent">
                      EDC Electricity Bill Calculator
                    </h4>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      Calculate residential and commercial electricity bills according to official tiered Electricité du Cambodge (EDC) rates.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-semibold text-accent">
                  <span>Calculate Bill</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            )}

            {/* ── Bento Card 4: USD ↔ KHR Dual Currency Change (Spans 2 Cols) ── */}
            {changeTool && (
              <Link
                href="/tools/cambodia-change-calculator"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xs md:col-span-2"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground">
                        <Coins size={19} />
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-foreground transition-colors group-hover:text-accent sm:text-lg">
                          USD ↔ KHR Dual-Currency Change Counter
                        </h4>
                        <span className="font-mono text-xs text-muted-foreground">Cambodian Retail &amp; Market Cash Helper</span>
                      </div>
                    </div>
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Cash Utility
                    </span>
                  </div>

                  <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                    Instant cash change solver for mixed USD and Riel transactions across local markets with banknote denomination counters (50k, 20k, 10k, 5k, 2k, 1k, 500, 100 Riel).
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-semibold text-accent">
                  <span>Calculate Change</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Catalog Grid (Clean Standard Monochrome Cards) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-serif text-lg font-bold tracking-tight text-foreground">
            {group === "ALL" && !query ? "All Tools & Utilities" : `Results (${matches.length})`}
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {group === "ALL" ? "Full catalog" : groups.find((g) => g.key === group)?.label}
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
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <h4 className="font-serif text-lg font-bold text-foreground">No utilities found.</h4>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Try adjusting your search terms or view all categories.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-2xs hover:opacity-90"
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
