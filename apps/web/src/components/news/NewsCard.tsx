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
    <article className="group flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      {/* Card Thumbnail */}
      <Link href={url} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 block">
        <img
          src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Card Content */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-600">
            <span>{article.country === "KH" ? "Cambodia" : "World"}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 font-medium">{article.category?.name || "General"}</span>
          </div>

          <Link href={url} className="block mt-2">
            <h3 className="text-lg font-bold leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </Link>

          {!compact && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        <div className="pt-4 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <span>{authorName}</span>
          <span className="text-gray-300">•</span>
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
