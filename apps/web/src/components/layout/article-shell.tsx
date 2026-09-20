import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Clock, Calendar, User, Share2, ShieldCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS } from "@/lib/tokens";

export interface ArticleShellProps {
  breadcrumbs: BreadcrumbItem[];
  category: string;
  categorySlug?: string;
  title: string;
  subtitle?: string;
  authorName?: string;
  authorSlug?: string;
  publishedDate?: string;
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

export function ArticleShell({
  breadcrumbs,
  category,
  title,
  subtitle,
  authorName = "Daily Discovery Editorial",
  publishedDate,
  readingTimeMinutes = 4,
  heroImage,
  heroImageAlt,
  imageCredit,
  sourceName,
  sourceUrl,
  children,
  sidebar,
  relatedContent,
}: ArticleShellProps) {
  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Updated";

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Article Column - Controlled readable width */}
          <article className="lg:col-span-8 flex flex-col">
            {/* Category & Metadata Header */}
            <div className="mb-4">
              <Badge variant="default" size="md" className="mb-3">
                {category}
              </Badge>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {subtitle}
                </p>
              )}

              {/* Author & Timestamp Bar */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User size={14} className="text-teal-600" />
                    {authorName}
                  </span>
                  <span>•</span>
                  <time dateTime={publishedDate} className="flex items-center gap-1">
                    <Calendar size={13} />
                    {formattedDate}
                  </time>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {readingTimeMinutes} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            {heroImage && (
              <figure className="mb-8 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                <div className={`${DESIGN_TOKENS.aspectRatio.news} w-full overflow-hidden`}>
                  <img
                    src={heroImage}
                    alt={heroImageAlt || title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {imageCredit && (
                  <figcaption className="px-4 py-2 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80">
                    Photo Credit: {imageCredit}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Reading Column: Strictly capped at max-w-3xl for optimal typography */}
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 sm:text-base">
              {children}
            </div>

            {/* Source Attribution Box */}
            {sourceName && (
              <div className="mt-8 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    Source Attribution & Fact Check
                  </span>
                  Reported with primary verification from <span className="font-medium">{sourceName}</span>.
                </div>
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 shrink-0"
                  >
                    View Original Source
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}
          </article>

          {/* Secondary Sidebar Column */}
          {sidebar && (
            <aside className="lg:col-span-4 space-y-6">
              {sidebar}
            </aside>
          )}
        </div>

        {/* Related Content section */}
        {relatedContent && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            {relatedContent}
          </div>
        )}
      </div>
    </div>
  );
}
