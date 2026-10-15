"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { cleanText, formatReadingTime } from "@/lib/format";
import { Photo } from "@/components/ui/photo";
import { Byline } from "@/components/ui/byline";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";

/** "PUBLIC_DOMAIN" -> "Public domain". Pipeline tokens are not copy. */
function humanizeLicense(value?: string | null): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const spaced = cleaned.replace(/[_/]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The lead story slot on a listing page.
 *
 * Two fabrications removed: `hero_image_url` used to fall back to a hardcoded
 * Unsplash photograph, so every lead looked illustrated even when the desk had
 * no rights to an image, and an absent `published_at` printed "Today". With no
 * verified picture the slot becomes a typographic lead — headline, deck, summary,
 * byline — which is what a magazine does when it has no art.
 */
export function HeroStory({ article }: { article: Article }) {
  const { lang } = useI18n();

  const title = cleanText(lang === "km" && article.title_km ? article.title_km : article.title);
  const summary = cleanText(lang === "km" && article.summary_km ? article.summary_km : article.summary);
  const deck = cleanText(article.subheadline);
  const image = article.hero_image_url || null;
  const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;

  const sectionName = cleanText(article.category?.name) || (article.country === "KH" ? "Cambodia" : "World");

  const author = cleanText(article.author?.name);
  const source = cleanText(article.primary_source?.name || article.source_attribution_text)
    .replace(/^(?:source|reported by)\s*:\s*/i, "");
  const sourceUrl = article.primary_source_url || article.primary_source?.website_url || null;
  const date = article.published_at || article.created_at || null;
  const readingTime = formatReadingTime(article.content);

  return (
    <article
      className={cn(
        "group border-b border-border pb-10",
        image && "grid gap-6 md:grid-cols-2 md:gap-10"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {article.is_breaking && (
            <CategoryMark category="breaking" tone="chip">
              Breaking
            </CategoryMark>
          )}
          <CategoryMark
            category={categoryKey(article.category?.name || sectionName)}
            tone="dot"
          >
            {sectionName}
          </CategoryMark>
        </div>

        <div>
          <h2 className="font-display text-3xl leading-[1.12] tracking-tight text-foreground sm:text-4xl">
            <Link href={url} className="transition-colors hover:text-accent">
              {title}
            </Link>
          </h2>

          {deck && (
            <p className="mt-3 font-display text-lg leading-snug text-muted-foreground">{deck}</p>
          )}
        </div>

        {summary && (
          <p className="line-clamp-3 text-base leading-[1.8] text-muted-foreground">{summary}</p>
        )}

        <div className="mt-auto pt-2">
          <Byline
            author={author}
            source={source}
            sourceUrl={sourceUrl}
            date={date}
            dateStyle="medium"
            readingTime={readingTime}
            views={article.views_count > 0 ? article.views_count : null}
            location={cleanText(article.province_or_city) || null}
            size="md"
          />

          <Link
            href={url}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            Read the story
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      {image && (
        <figure className="self-center">
          <Link href={url} aria-label={title} className="block">
            <Photo
              src={image}
              alt={article.hero_image_alt || title}
              credit={article.hero_image_credit}
              license={humanizeLicense(article.hero_image_license)}
              ratio="4/3"
              radius="hero"
            />
          </Link>
        </figure>
      )}
    </article>
  );
}
