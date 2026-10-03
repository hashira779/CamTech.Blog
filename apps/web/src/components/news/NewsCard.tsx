"use client";

import React from "react";
import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";
import { Article } from "@/types";
import { useI18n } from "@/lib/i18n";

export function NewsCard({ article, compact = false }: { article: Article; compact?: boolean }) {
  const { lang } = useI18n();

  const title = lang === "km" && article.title_km ? article.title_km : article.title;
  const summary = lang === "km" && article.summary_km ? article.summary_km : article.summary;
  const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;

  return (
    <article className="group flex flex-col gap-3">
      {/* Card Thumbnail */}
      <Link href={url} className="relative aspect-[3/2] overflow-hidden bg-neutral-100 dark:bg-neutral-900 block">
        <img
          src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
          alt={article.title}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 ease-out"
        />
      </Link>

      {/* Card Content */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          <span className="text-neutral-900 dark:text-neutral-100">
            {article.category?.name || "News"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Today"}
          </span>
        </div>

        <Link href={url} className="block group-hover:opacity-75 transition-opacity">
          <h3 className="font-bold text-lg leading-snug line-clamp-3 text-neutral-900 dark:text-white font-serif">
            {title}
          </h3>
        </Link>

        {!compact && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed pt-1">
            {summary}
          </p>
        )}
      </div>
    </article>
  );
}
