"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Share2,
  Bookmark,
  Check,
  Send,
  Compass,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Wrench
} from "lucide-react";
import { Article } from "@/types";
import { KeyPoints } from "./KeyPoints";
import { TimelineView } from "./TimelineView";
import { AttributionBox } from "./AttributionBox";
import { AdSlot } from "@/components/ads/AdSlot";
import { useI18n } from "@/lib/i18n";

export function ArticleReader({ article }: { article: Article }) {
  const { lang, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const title = lang === "km" && article.title_km ? article.title_km : article.title;
  const summary = lang === "km" && article.summary_km ? article.summary_km : article.summary;
  
  let keyPointsList: string[] = [];
  try {
    if (article.key_points) keyPointsList = JSON.parse(article.key_points);
  } catch (e) {}

  let timelineList: any[] = [];
  try {
    if (article.timeline) timelineList = JSON.parse(article.timeline);
  } catch (e) {}

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareSocial = (platform: "fb" | "tg" | "x") => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    if (platform === "fb") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    } else if (platform === "tg") {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
    } else if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="hover:text-rose-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={article.country === "KH" ? "/cambodia" : "/world"}
          className="hover:text-rose-600 transition-colors font-medium text-neutral-600 dark:text-neutral-300"
        >
          {article.country === "KH" ? "Cambodia" : "World"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-neutral-400 truncate max-w-[200px]">{article.category?.name || "News"}</span>
      </nav>

      {/* 2. Header & Headline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
            {article.category?.name || "News Analysis"}
          </span>
          {article.province_or_city && (
            <span className="text-xs text-neutral-400 font-medium">
              📍 {article.province_or_city}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
          {title}
        </h1>

        {article.subheadline && (
          <p className="text-base sm:text-lg font-medium text-neutral-600 dark:text-neutral-300 leading-snug">
            {article.subheadline}
          </p>
        )}

        {/* Byline & Timestamps */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            {article.author?.avatar_url && (
              <img
                src={article.author.avatar_url}
                alt={article.author.name}
                className="h-9 w-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              />
            )}
            <div>
              <span className="font-bold text-neutral-900 dark:text-white block">
                {article.author?.name || "Editorial Staff"}
              </span>
              <span className="text-[11px] text-neutral-400">
                {article.author?.role || "Staff Journalist"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Published: {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Today"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Hero Visual with required Credit Attribution */}
      {article.hero_image_url && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900 aspect-[16/9]">
            <img
              src={article.hero_image_url}
              alt={article.hero_image_alt || title}
              className="w-full h-full object-cover"
            />
          </div>
          {article.hero_image_credit && (
            <div className="text-right text-[11px] text-neutral-400 italic">
              Image credit: {article.hero_image_credit} ({article.hero_image_license || "Editorial Use"})
            </div>
          )}
        </div>
      )}

      {/* Top AdSlot */}
      <AdSlot slot="ARTICLE_TOP" />

      {/* 4. Original Editorial Summary: "What Happened?" */}
      <div className="p-6 sm:p-7 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
          {t("article.what_happened")}
        </h2>
        <p className="text-sm sm:text-base font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* 5. Key Points Highlight Box */}
      {keyPointsList.length > 0 && <KeyPoints points={keyPointsList} />}

      {/* 6. Context: "Why It Matters" */}
      {article.why_it_matters && (
        <div className="p-6 rounded-2xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t("article.why_it_matters")}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {article.why_it_matters}
          </p>
        </div>
      )}

      {/* 7. Timeline */}
      {timelineList.length > 0 && <TimelineView items={timelineList} />}

      {/* 8. Full Editorial Content */}
      <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n\n/g, "<br/><br/>") }} />
      </div>

      {/* Mid AdSlot */}
      <AdSlot slot="ARTICLE_MID" />

      {/* 9. Source Attribution Box (Sections 2, 7 & 8) */}
      <AttributionBox
        sourceName={article.source_attribution_text || article.primary_source?.name}
        sourceUrl={article.primary_source_url}
        license={article.hero_image_license}
        authorName={article.author?.name}
      />

      {/* 10. Social Sharing & Bookmark Actions */}
      <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShareSocial("fb")}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            title="Share on Facebook"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button
            onClick={() => handleShareSocial("tg")}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
            title="Share on Telegram"
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Link Copied!" : "Copy Link"}
          </button>
        </div>

        <button
          onClick={() => setSaved(!saved)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            saved
              ? "bg-rose-600 text-white shadow"
              : "border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          {saved ? "Story Saved" : "Save Story"}
        </button>
      </div>

      {/* 11. Cross-Promotional Discovery & Tools */}
      <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/discover"
          className="p-5 rounded-2xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/10 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
              Curious mind?
            </span>
            <span className="font-bold text-sm text-neutral-900 dark:text-white">
              Explore Today's Visual Discoveries
            </span>
          </div>
          <Sparkles className="h-5 w-5 text-amber-500 group-hover:rotate-12 transition-transform" />
        </Link>

        <Link
          href="/tools"
          className="p-5 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/10 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              Need a quick calculation?
            </span>
            <span className="font-bold text-sm text-neutral-900 dark:text-white">
              Browse Useful Online Tools
            </span>
          </div>
          <Wrench className="h-5 w-5 text-rose-600 group-hover:rotate-12 transition-transform" />
        </Link>
      </div>

      {/* Bottom AdSlot */}
      <AdSlot slot="ARTICLE_BOTTOM" />
    </div>
  );
}
