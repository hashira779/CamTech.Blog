import * as React from "react";
import Link from "next/link";
import type { Article } from "@/types";
import { cn } from "@/lib/utils";
import { Photo } from "@/components/ui/photo";
import { Byline } from "@/components/ui/byline";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { cleanText, formatReadingTime } from "@/lib/format";

export type NewsCardVariant = "hero" | "feature" | "standard" | "compact" | "list" | "text";

export interface NewsCardProps {
  article: Article;
  variant?: NewsCardVariant;
  /** "km" renders title_km / summary_km when the API supplied them. */
  lang?: string;
  /** Rank number for "most read" style rails. */
  rank?: number;
  /** Load the image eagerly — only for above-the-fold cards. */
  priority?: boolean;
  showSummary?: boolean;
  showCredit?: boolean;
  className?: string;
}

/**
 * The single news card.
 *
 * There used to be three: this one, a second in components/news/NewsCard.tsx, and
 * a third inlined in the homepage. They disagreed on radius, palette, aspect
 * ratio and metadata. Every listing now renders through these six variants.
 *
 * Data honesty rules, which the old cards broke:
 *   - no stock photograph when `hero_image_url` is missing — the card drops to a
 *     typographic treatment instead of implying a photo it does not have
 *   - no invented byline: an absent author simply is not rendered
 *   - read time is measured from the article's own word count, never defaulted
 *   - dates come from published_at or created_at, and render as nothing if both
 *     are missing rather than "Today"
 */
export function NewsCard({
  article,
  variant = "standard",
  lang = "en",
  rank,
  priority = false,
  showSummary = true,
  showCredit = true,
  className,
}: NewsCardProps) {
  const href = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;

  const title = cleanText(lang === "km" && article.title_km ? article.title_km : article.title);
  const summary = cleanText(lang === "km" && article.summary_km ? article.summary_km : article.summary);
  const image = article.hero_image_url || null;

  const categoryLabel = article.category?.name || (article.country === "KH" ? "Cambodia" : "World");
  const category = article.is_breaking ? "breaking" : categoryKey(article.category?.name || categoryLabel);

  const author = article.author?.name || null;
  const source = article.primary_source?.name || null;
  const sourceUrl = article.primary_source_url || article.primary_source?.website_url || null;
  const date = article.published_at || article.created_at || null;
  const readingTime = formatReadingTime(article.content);
  const views = article.views_count > 0 ? article.views_count : null;
  const location = article.province_or_city || null;

  // A photo-less card cannot be a hero or a feature; fall back to type.
  const effectiveVariant: NewsCardVariant = !image && ["hero", "feature", "standard"].includes(variant)
    ? "text"
    : variant;

  const meta = (tone: "default" | "invert" = "default", dateStyle: "short" | "medium" = "short") => (
    <Byline
      tone={tone}
      author={author}
      source={source}
      sourceUrl={sourceUrl}
      date={date}
      dateStyle={dateStyle}
      readingTime={readingTime}
      views={views}
      location={location}
    />
  );

  /* ── Hero: full-bleed photograph with the headline on a scrim ───────────── */
  if (effectiveVariant === "hero") {
    return (
      <Link
        href={href}
        className={cn(
          "group relative block overflow-hidden rounded-2xl bg-surface-muted shadow-md sm:rounded-3xl",
          className
        )}
      >
        <Photo
          src={image}
          alt={article.hero_image_alt || title}
          credit={article.hero_image_credit}
          license={article.hero_image_license}
          ratio="16/9"
          radius="none"
          priority={priority}
          showCredit={false}
          className="absolute inset-0 h-full w-full"
          imgClassName="sm:scale-100"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
        />

        <div className="relative flex min-h-[clamp(20rem,46vw,34rem)] flex-col justify-end gap-3 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryMark category={category} tone="chip" className="bg-white/90 text-neutral-900">
              {article.is_breaking ? "Breaking" : categoryLabel}
            </CategoryMark>
            {article.hero_image_credit && showCredit && (
              <span className="rounded-md bg-black/40 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                {article.hero_image_credit}
                {article.hero_image_license ? ` · ${article.hero_image_license}` : ""}
              </span>
            )}
          </div>

          <h2 className="max-w-3xl font-display text-3xl leading-[1.08] tracking-tight text-white sm:text-5xl">
            {title}
          </h2>

          {showSummary && summary && (
            <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {summary}
            </p>
          )}

          {meta("invert", "medium")}
        </div>
      </Link>
    );
  }

  /* ── Feature: large photograph above a serif headline ──────────────────── */
  if (effectiveVariant === "feature") {
    return (
      <article
        className={cn(
          "group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong",
          className
        )}
      >
        <Link href={href} aria-label={title} className="block">
          <Photo
            src={image}
            alt={article.hero_image_alt || title}
            credit={article.hero_image_credit}
            license={article.hero_image_license}
            ratio="3/2"
            radius="none"
            priority={priority}
            showCredit={showCredit}
          />
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-7">
          <CategoryMark category={category}>
            {article.is_breaking ? "Breaking" : categoryLabel}
          </CategoryMark>

          <h3 className="font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
            <Link href={href} className="transition-colors hover:text-accent">
              {title}
            </Link>
          </h3>

          {showSummary && summary && (
            <p className="line-clamp-3 text-base leading-relaxed text-muted-foreground">{summary}</p>
          )}

          <div className="mt-auto pt-2">{meta("default", "medium")}</div>
        </div>
      </article>
    );
  }

  /* ── Standard: the grid workhorse ──────────────────────────────────────── */
  if (effectiveVariant === "standard") {
    return (
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong",
          className
        )}
      >
        <Link href={href} aria-label={title} className="block">
          <Photo
            src={image}
            alt={article.hero_image_alt || title}
            credit={article.hero_image_credit}
            license={article.hero_image_license}
            ratio="16/9"
            radius="none"
            priority={priority}
            showCredit={showCredit}
          />
        </Link>

        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <CategoryMark category={category}>
            {article.is_breaking ? "Breaking" : categoryLabel}
          </CategoryMark>

          <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
            <Link href={href} className="line-clamp-3 transition-colors hover:text-accent">
              {title}
            </Link>
          </h3>

          {showSummary && summary && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
          )}

          <div className="mt-auto border-t border-border pt-3">{meta()}</div>
        </div>
      </article>
    );
  }

  /* ── Text: no verified photograph, so no photograph ────────────────────── */
  if (effectiveVariant === "text") {
    return (
      <article
        className={cn(
          "group flex h-full flex-col gap-2.5 rounded-lg border border-border bg-card p-5 shadow-xs hover-lift hover:border-border-strong sm:p-6",
          className
        )}
      >
        <CategoryMark category={category}>
          {article.is_breaking ? "Breaking" : categoryLabel}
        </CategoryMark>

        <h3 className="font-display text-xl leading-snug tracking-tight text-foreground sm:text-2xl">
          <Link href={href} className="transition-colors hover:text-accent">
            {title}
          </Link>
        </h3>

        {showSummary && summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>
        )}

        <div className="mt-auto border-t border-border pt-3">{meta()}</div>
      </article>
    );
  }

  /* ── List: horizontal rail row, optionally ranked ──────────────────────── */
  if (effectiveVariant === "list") {
    return (
      <article
        className={cn(
          "group flex items-start gap-4 border-b border-border py-4 last:border-b-0",
          className
        )}
      >
        {typeof rank === "number" && (
          <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
        )}

        <Link href={href} className="flex flex-1 items-start gap-4" aria-label={title}>
          {image && (
            <Photo
              src={image}
              alt={article.hero_image_alt || title}
              ratio="4/3"
              radius="md"
              compact
              showCredit={false}
              className="h-16 w-20 shrink-0 sm:h-20 sm:w-24"
            />
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
              <span className="line-clamp-2 transition-colors group-hover:text-accent">{title}</span>
            </h3>
            {meta()}
          </div>
        </Link>
      </article>
    );
  }

  /* ── Compact: dense rail / sidebar ─────────────────────────────────────── */
  return (
    <article
      className={cn(
        "group flex flex-col gap-1.5 rounded-md p-3 transition-colors hover:bg-surface-muted",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {typeof rank === "number" && (
          <span className="w-5 shrink-0 pt-0.5 font-display text-base leading-none text-border-strong tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
        )}
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
          <Link href={href} className="line-clamp-2 transition-colors group-hover:text-accent">
            {title}
          </Link>
        </h3>
      </div>
      <div className={cn(typeof rank === "number" && "pl-8")}>{meta()}</div>
    </article>
  );
}
