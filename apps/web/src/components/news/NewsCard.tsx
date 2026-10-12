"use client";

import React from "react";
import Link from "next/link";
import { Article } from "@/types";
import { useI18n } from "@/lib/i18n";

export function NewsCard({ article, compact = false }: { article: Article; compact?: boolean }) {
  const { lang } = useI18n();

  const title = lang === "km" && article.title_km ? article.title_km : article.title;
  const summary = lang === "km" && article.summary_km ? article.summary_km : article.summary;
  const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;

  const authorName = article.author?.name || article.primary_source?.name || "Editorial Desk";
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <article className="group hover-lift flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 dark:border-slate-800 hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all duration-300">
      {/* Card Thumbnail */}
      <Link href={url} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 block border border-gray-100 dark:border-slate-800/80">
        <img
          src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </Link>

      {/* Card Content */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">
            <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-900/40 text-[10px]">
              {article.country === "KH" ? "Cambodia" : "World"}
            </span>
            <span className="text-gray-300 dark:text-slate-700">•</span>
            <span className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">{article.category?.name || "General"}</span>
          </div>

          <Link href={url} className="block mt-2">
            <h3 className="text-base sm:text-lg font-bold leading-snug line-clamp-2 text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {title}
            </h3>
          </Link>

          {!compact && (
            <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        <div className="pt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium border-t border-gray-100 dark:border-slate-800/80 mt-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
            {initial}
          </div>
          <span>{authorName}</span>
          <span className="text-gray-300 dark:text-slate-700">•</span>
          <span>
            {article.published_at 
              ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) 
              : "Today"}
          </span>
        </div>
      </div>
    </article>
  );
}
