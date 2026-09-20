"use client";

import React from "react";
import { Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface TimelineItem {
  time: string;
  event: string;
}

export function TimelineView({ items }: { items: TimelineItem[] }) {
  const { t } = useI18n();
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 sm:p-6 my-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-rose-600" />
        <span>{t("article.timeline")}</span>
      </h3>
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
        {items.map((item, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-6 top-1.5 h-2 w-2 rounded-full border-2 border-rose-600 bg-white dark:bg-neutral-900" />
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              {item.time}
            </span>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
              {item.event}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
