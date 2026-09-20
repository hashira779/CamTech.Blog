import * as React from "react";
import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DESIGN_TOKENS, TYPOGRAPHY } from "@/lib/tokens";

export interface NewsCardProps {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroImage?: string;
  category?: string;
  country?: string;
  primarySource?: string;
  primarySourceUrl?: string;
  publishedAt?: string;
  readingTimeMinutes?: number;
  featured?: boolean;
}

export function NewsCard({
  slug,
  title,
  summary,
  heroImage,
  category = "Cambodia",
  country,
  primarySource,
  publishedAt,
  readingTimeMinutes = 3,
  featured = false,
}: NewsCardProps) {
  const articleHref = country === "KH" ? `/cambodia/news/${slug}` : `/world/news/${slug}`;
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <Card hoverEffect className={`overflow-hidden flex flex-col h-full ${featured ? "lg:col-span-2" : ""}`}>
      {/* 16:9 Image container */}
      <Link href={articleHref} className="block overflow-hidden relative group">
        <div className={`${DESIGN_TOKENS.aspectRatio.news} bg-slate-100 dark:bg-slate-800 w-full overflow-hidden`}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
              <span className="text-xs uppercase tracking-wider font-semibold">Daily Discovery News</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category & Timestamp */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Badge variant="default" size="sm">
            {category}
          </Badge>
          <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 gap-1 shrink-0">
            <Clock size={DESIGN_TOKENS.iconSize.xs} />
            <span>{readingTimeMinutes} min read</span>
          </div>
        </div>

        {/* Title */}
        <Link href={articleHref} className="group mb-2">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {summary}
        </p>

        {/* Metadata Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium truncate max-w-[140px]">
            {primarySource || "Editorial Desk"}
          </span>
          <time dateTime={publishedAt} className="shrink-0">
            {formattedDate}
          </time>
        </div>
      </div>
    </Card>
  );
}
