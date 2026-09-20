"use client";

import React from "react";
import { ExternalLink, ShieldCheck, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AttributionBoxProps {
  sourceName?: string;
  sourceUrl: string;
  license?: string;
  authorName?: string;
  authorRole?: string;
}

export function AttributionBox({
  sourceName,
  sourceUrl,
  license,
  authorName,
  authorRole
}: AttributionBoxProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/40 p-5 sm:p-6 my-8 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>{t("article.source_attribution")}</span>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Daily Discovery adheres to strict editorial attribution standards. We provide verified synthesis, context,
        and analysis while directing readers to original reporting and official primary documentation.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80">
        <div>
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
            {t("article.original_reporting_by")}
          </span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">
            {sourceName || "Original Publisher / Press Wire"}
          </span>
          {license && (
            <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
              {license}
            </span>
          )}
        </div>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-colors"
        >
          <span>{t("article.view_original_source")}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
