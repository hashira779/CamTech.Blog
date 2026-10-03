"use client";

import React from "react";
import Link from "next/link";
import { Clock, ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";
import { Article } from "@/types";
import { useI18n } from "@/lib/i18n";

export function HeroStory({ article }: { article: Article }) {
  const { lang, t } = useI18n();

  const title = lang === "km" && article.title_km ? article.title_km : article.title;
  const summary = lang === "km" && article.summary_km ? article.summary_km : article.summary;
  const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;

  return (
    <article className="group relative flex flex-col md:flex-row gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-12 mb-12">
      {/* Story Details Container (Left side on desktop) */}
      <div className="flex-1 flex flex-col justify-center order-2 md:order-1">
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
            <span className="text-neutral-900 dark:text-neutral-100 border-b border-neutral-900 dark:border-neutral-100 pb-0.5">
              {article.category?.name || "Special Report"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "Today"}
            </span>
          </div>

          <Link href={url} className="block group-hover:opacity-80 transition-opacity">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-neutral-900 dark:text-white font-serif">
              {title}
            </h2>
          </Link>

          {article.subheadline && (
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 font-medium leading-snug">
              {article.subheadline}
            </p>
          )}

          <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3">
            {summary}
          </p>
        </div>

        {/* Attribution & Read Link */}
        <div className="pt-8 mt-8 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="h-4 w-4 text-neutral-900 dark:text-white" />
            {article.source_attribution_text || "Verified Reporting"}
          </div>
        </div>
      </div>

      {/* Visual Background / Image Container (Right side on desktop) */}
      <div className="w-full md:w-[55%] relative aspect-[4/3] md:aspect-auto overflow-hidden bg-neutral-100 dark:bg-neutral-900 order-1 md:order-2">
        <Link href={url} className="block w-full h-full">
          <img
            src={article.hero_image_url || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"}
            alt={article.title}
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700 ease-out"
          />
        </Link>
        
        {article.hero_image_credit && (
          <div className="absolute bottom-3 right-3 text-[9px] uppercase tracking-wider text-white bg-black/60 px-2 py-1">
            Credit: {article.hero_image_credit}
          </div>
        )}
      </div>
    </article>
  );
}
