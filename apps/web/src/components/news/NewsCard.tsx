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

  return (
    <article className="group flex flex-col gap-4">
      {/* Card Thumbnail */}
      <Link href={url} className="relative aspect-[4/3] overflow-hidden bg-neutral-100 block">
        <img
          src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
          alt={article.title}
          className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 ease-out"
        />
      </Link>

      {/* Card Content */}
      <div className="space-y-2 pt-1 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
          <span>
            {article.category?.name || "Design"} • {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "2026"}
          </span>
        </div>

        <Link href={url} className="block group-hover:text-neutral-500 transition-colors">
          <h3 className="font-normal text-2xl leading-snug line-clamp-3 text-neutral-900 font-serif">
            {title}
          </h3>
        </Link>

        {!compact && (
          <p className="text-sm text-neutral-500 font-sans line-clamp-2 leading-relaxed pt-2">
            {summary}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2">
           <div className="w-5 h-5 rounded-full bg-neutral-200 overflow-hidden shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${article.author?.name || article.primary_source?.name || 'Ed'}&background=random&color=fff`} className="w-full h-full object-cover" />
           </div>
           <span className="text-xs font-serif text-neutral-900 italic">By {article.author?.name || article.primary_source?.name || "Editor"}</span>
        </div>
      </div>
    </article>
  );
}
