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
    <article className="group flex flex-col gap-3">
      {/* Card Thumbnail */}
      <Link href={url} className="relative aspect-[16/10] overflow-hidden bg-neutral-100 border border-neutral-200 block">
        <img
          src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        />
      </Link>

      {/* Card Content */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-semibold">
            <span className="text-neutral-900 font-bold">{article.country === "KH" ? "Cambodia" : "World"}</span>
            <span>•</span>
            <span>{article.category?.name || "General"}</span>
          </div>

          <Link href={url} className="block mt-1">
            <h3 className="text-lg font-serif font-bold leading-snug line-clamp-2 text-neutral-950 group-hover:text-neutral-700 transition-colors">
              {title}
            </h3>
          </Link>

          {!compact && (
            <p className="mt-1.5 text-xs text-neutral-600 font-sans line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        <div className="pt-3 flex items-center gap-2 text-[11px] text-neutral-500 font-serif italic">
          <div className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 text-[9px] font-bold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <span>By {authorName}</span>
          <span>•</span>
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
