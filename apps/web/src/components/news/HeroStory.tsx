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
    <article className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 text-white shadow-2xl group transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        
        {/* Visual Background / Image Container */}
        <div className="lg:col-span-7 relative h-72 lg:h-full overflow-hidden">
          <img
            src={article.hero_image_url || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 lg:bg-gradient-to-r lg:from-transparent lg:to-neutral-950" />
          
          {/* Breaking / Featured Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-lg">
              {article.is_breaking ? "Breaking Story" : "Featured Lead"}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-neutral-200 text-[11px] font-medium border border-white/10">
              {article.country === "KH" ? "🇰🇭 Cambodia" : "🌐 World"}
            </span>
          </div>

          {article.hero_image_credit && (
            <div className="absolute bottom-2 left-4 text-[10px] text-white/60 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded">
              Credit: {article.hero_image_credit}
            </div>
          )}
        </div>

        {/* Story Details Container */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-neutral-950">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="font-semibold text-rose-400 uppercase tracking-wider">
                {article.category?.name || "Special Report"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Today"}
              </span>
            </div>

            <Link href={url} className="block group-hover:text-rose-400 transition-colors">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {title}
              </h2>
            </Link>

            {article.subheadline && (
              <p className="text-sm font-medium text-neutral-300 leading-snug line-clamp-2">
                {article.subheadline}
              </p>
            )}

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed line-clamp-3">
              {summary}
            </p>
          </div>

          {/* Attribution & Read Link */}
          <div className="pt-6 mt-6 border-t border-neutral-800/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">Source Attribution</span>
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {article.source_attribution_text || "Verified Reporting"}
              </span>
            </div>

            <Link
              href={url}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-900 font-bold text-xs hover:bg-rose-50 hover:text-rose-600 transition-colors shadow"
            >
              {t("home.read_full")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </article>
  );
}
