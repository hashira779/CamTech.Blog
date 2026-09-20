"use client";

import React from "react";
import Link from "next/link";
import { Clock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Article } from "@/types";
import { useI18n } from "@/lib/i18n";

export function NewsCard({ article, compact = false }: { article: Article; compact?: boolean }) {
  const { lang } = useI18n();

  const title = lang === "km" && article.title_km ? article.title_km : article.title;
  const summary = lang === "km" && article.summary_km ? article.summary_km : article.summary;
  const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 overflow-hidden hover:shadow-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300">
      <div>
        {/* Card Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
              {article.category?.name || "News"}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 text-[10px] font-semibold">
              {article.country === "KH" ? "🇰🇭 KH" : "🌐 World"}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Clock className="h-3 w-3" />
            <span>
              {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Today"}
            </span>
          </div>

          <Link href={url} className="block group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            <h3 className="font-bold text-base sm:text-lg tracking-tight leading-snug line-clamp-2 text-neutral-900 dark:text-white">
              {title}
            </h3>
          </Link>

          {!compact && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer: Source Attribution */}
      <div className="px-4 sm:px-5 py-3 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span className="truncate max-w-[170px]">
            {article.source_attribution_text || "Verified Source"}
          </span>
        </div>

        <Link
          href={url}
          className="text-neutral-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"
          aria-label={`Read ${title}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
