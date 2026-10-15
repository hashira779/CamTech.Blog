"use client";

import type { Article } from "@/types";
import { useI18n } from "@/lib/i18n";
import { NewsCard, type NewsCardVariant } from "@/components/shared/news-card";

/**
 * Compatibility shim.
 *
 * The card itself lives in `components/shared/news-card.tsx` and is a server
 * component. This wrapper only resolves the active language from the i18n
 * context, which requires a client boundary. Call sites that already know the
 * language should import the shared card directly and pass `lang`.
 */
export function NewsCardWithLang({
  article,
  compact = false,
  variant,
  ...rest
}: {
  article: Article;
  compact?: boolean;
  variant?: NewsCardVariant;
  rank?: number;
  priority?: boolean;
  showSummary?: boolean;
  showCredit?: boolean;
  className?: string;
}) {
  const { lang } = useI18n();

  return (
    <NewsCard
      article={article}
      lang={lang}
      variant={variant ?? (compact ? "compact" : "standard")}
      {...rest}
    />
  );
}

export { NewsCardWithLang as NewsCard };
