"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function KeyPoints({ points }: { points: string[] }) {
  const { t } = useI18n();
  if (!points || points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/40 dark:bg-rose-950/10 p-5 sm:p-6 my-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2">
        <span>{t("article.key_points")}</span>
      </h3>
      <ul className="space-y-2.5">
        {points.map((pt, idx) => (
          <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
