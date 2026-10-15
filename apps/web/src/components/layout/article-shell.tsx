import * as React from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Photo } from "@/components/ui/photo";
import { Byline } from "@/components/ui/byline";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { cleanText, formatDate } from "@/lib/format";

export interface ArticleShellProps {
  breadcrumbs: BreadcrumbItem[];
  category: string;
  categorySlug?: string;
  title: string;
  subtitle?: string;
  authorName?: string;
  authorSlug?: string;
  publishedDate?: string;
  /** Only a measured figure. An unmeasured story shows no read time at all. */
  readingTimeMinutes?: number;
  heroImage?: string;
  heroImageAlt?: string;
  imageCredit?: string;
  sourceName?: string;
  sourceUrl?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  relatedContent?: React.ReactNode;
}

/**
 * Long-form shell used by guide, place and transport articles.
 *
 * Same reading language as the news article page: serif headline in the reading
 * measure, photograph wider than the text, hairline rules instead of boxes.
 *
 * The invented defaults are gone. This component used to sign every story
 * "Daily Discovery Editorial", print "4 min read" without measuring anything,
 * and date a story with no timestamp "Recently Updated"; all three now render
 * nothing when the caller has no value. Body copy is capped at the reading
 * measure and every hardcoded slate/teal class has been replaced by tokens.
 */
export function ArticleShell({
  breadcrumbs,
  category,
  title,
  subtitle,
  authorName,
  authorSlug,
  publishedDate,
  readingTimeMinutes,
  heroImage,
  heroImageAlt,
  imageCredit,
  sourceName,
  sourceUrl,
  children,
  sidebar,
  relatedContent,
}: ArticleShellProps) {
  const author = cleanText(authorName);
  const publisher = cleanText(sourceName);
  const dateLabel = formatDate(publishedDate, "long");
  const credit = cleanText(imageCredit);
  const hasMeta = Boolean(author || publisher || dateLabel || readingTimeMinutes);

  return (
    <div className="w-full py-8 sm:py-12">
      <Container className="pb-6">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      </Container>

      <div className={sidebar ? "container-page grid gap-12 lg:grid-cols-12" : "container-page"}>
        <div className={sidebar ? "lg:col-span-8" : "mx-auto max-w-3xl"}>
          <header>
            {cleanText(category) && (
              <CategoryMark category={categoryKey(category)} tone="dot">
                {category}
              </CategoryMark>
            )}

            <h1 className="mt-3 font-display text-3xl leading-[1.14] tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.08]">
              {cleanText(title)}
            </h1>

            {cleanText(subtitle) && (
              <p className="mt-4 font-display text-lg leading-snug text-muted-foreground sm:text-xl">
                {subtitle}
              </p>
            )}

            {hasMeta && (
              <div className="mt-6 border-t border-border pt-4">
                <Byline
                  author={author}
                  authorHref={authorSlug ? `/author/${authorSlug}` : null}
                  source={publisher}
                  sourceUrl={sourceUrl}
                  date={publishedDate}
                  dateStyle="long"
                  readingTime={
                    readingTimeMinutes && readingTimeMinutes > 0 ? readingTimeMinutes : null
                  }
                  size="md"
                />
              </div>
            )}
          </header>

          {heroImage && (
            <figure className="mt-8">
              <Photo
                src={heroImage}
                alt={cleanText(heroImageAlt) || cleanText(title)}
                credit={credit}
                ratio="16/9"
                radius="hero"
                priority
                showCredit={false}
              />
              {credit && (
                <figcaption className="mt-2 text-right text-xs text-muted-foreground">
                  {credit}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-8 max-w-3xl text-base leading-[1.85] text-foreground">
            {children}
          </div>

          {(publisher || sourceUrl) && (
            <div className="mt-10 flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="section-label block text-accent">Source attribution</span>
                <span className="mt-1.5 block">
                  {publisher
                    ? <>Reported against the material published by <span className="font-medium text-card-foreground">{publisher}</span>.</>
                    : <>Reported against the original publication linked below.</>}
                </span>
              </p>

              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-muted"
                >
                  View original source
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M14 4h6v6M20 4l-9 9" />
                    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {sidebar && <aside className="lg:col-span-4">{sidebar}</aside>}
      </div>

      {relatedContent && (
        <div className="mt-14 border-t border-border">
          <Container className="pt-10">{relatedContent}</Container>
        </div>
      )}
    </div>
  );
}
