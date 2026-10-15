"use client";

import * as React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { cleanText } from "@/lib/format";
import { safeHref } from "@/lib/sanitize";

interface AttributionBoxProps {
  sourceName?: string;
  sourceUrl: string;
  license?: string;
  authorName?: string;
  authorRole?: string;
  className?: string;
}

/** "UNSPLASH_LICENSE" -> "Unsplash license". Tokens are data, not copy. */
function humanizeLicense(value?: string | null): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const spaced = cleaned.replace(/[_/]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Source attribution.
 *
 * Two honesty problems lived here: a hardcoded publisher string
 * ("Original Publisher / Press Wire") printed whenever the pipeline knew
 * nothing, and a link to `sourceUrl` even when the field was empty, which
 * pointed at the article page itself. Both are gone — the box now renders only
 * the fields that exist, and returns null when there is no source, no author
 * and no link to show. The claim of "strict editorial standards" became one
 * plain sentence about what this desk actually does.
 */
export function AttributionBox({
  sourceName,
  sourceUrl,
  license,
  authorName,
  authorRole,
  className,
}: AttributionBoxProps) {
  const { t } = useI18n();

  const source = cleanText(sourceName);
  const author = cleanText(authorName);
  const role = cleanText(authorRole);
  const licence = humanizeLicense(license);
  const url = safeHref(sourceUrl);

  if (!source && !author && !url) return null;

  const publisher = source || author;

  return (
    <section
      aria-label={cleanText(t("article.source_attribution"))}
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-xs sm:p-6",
        className
      )}
    >
      <h3 className="section-label flex items-center gap-2 text-accent">
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
        <span>{cleanText(t("article.source_attribution"))}</span>
      </h3>

      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        This desk summarises and adds context. The reporting belongs to the publisher below, and we
        link it so you can read it in full.
      </p>

      <dl className="mt-4">
        {(publisher || author || licence || role) && (
          <div className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-baseline sm:gap-6">
            <dt className="section-label w-48 shrink-0">
              {cleanText(t("article.original_reporting_by"))}
            </dt>
            <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-card-foreground">
              {publisher && <span className="font-medium">{publisher}</span>}
              {author && publisher && author !== publisher && <span>{author}</span>}
              {role && <span className="text-muted-foreground">{role}</span>}
              {licence && <span className="text-muted-foreground">{licence}</span>}
            </dd>
          </div>
        )}
      </dl>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group mt-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-muted"
        >
          <span>{cleanText(t("article.view_original_source"))}</span>
          <ExternalLink
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-y-0.5"
          />
        </a>
      )}
    </section>
  );
}
