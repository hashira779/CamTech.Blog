"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Check, Compass, Link2, Send, Share2, Wrench } from "lucide-react";
import type { Article } from "@/types";
import { cn } from "@/lib/utils";
import {
  cleanText,
  estimateReadingMinutes,
  formatDate,
  formatReadingTime,
} from "@/lib/format";
import { safeHref, sanitizeHtml } from "@/lib/sanitize";
import { useI18n } from "@/lib/i18n";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Photo } from "@/components/ui/photo";
import { Byline } from "@/components/ui/byline";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AdSlot } from "@/components/ads/AdSlot";
import { KeyPoints } from "./KeyPoints";
import { TimelineView, type TimelineItem } from "./TimelineView";
import { AttributionBox } from "./AttributionBox";

/* ── Body copy ──────────────────────────────────────────────────────────────
   `content` arrives in two shapes: plain text from the RSS pipeline (paragraphs
   split on blank lines, `-` bullets, occasional `###` subheads) and HTML from
   the CMS. The old reader ran both through
   `innerHTML.replace(/\n\n/g, "<br/><br/>")`, so real paragraphs became one wall
   of line breaks and a drop cap was impossible. Both shapes now become blocks. */

type BlockKind = "heading" | "list" | "quote" | "paragraph";

interface Block {
  kind: BlockKind;
  text: string;
  items?: string[];
  html?: boolean;
}

const HTML_CONTENT = /<(?:p|h[1-6]|ul|ol|li|blockquote)\b/i;
const LEAD_TAG = /^\s*<(h[1-6]|ul|ol|blockquote|p)\b/i;
const KHMER_SCRIPT = /[\u1780-\u17FF]/;

function kindOfTag(tag: string): BlockKind {
  if (tag.startsWith("h")) return "heading";
  if (tag === "ul" || tag === "ol") return "list";
  if (tag === "blockquote") return "quote";
  return "paragraph";
}

function kindOfPlainText(chunk: string): BlockKind {
  if (/^#{1,6}\s/.test(chunk)) return "heading";
  if (/^>\s?/.test(chunk)) return "quote";
  if (/^\s*[-*•]\s+\S/.test(chunk)) return "list";
  return "paragraph";
}

/**
 * Inline markup inside a body block.
 *
 * This used to be a blacklist: drop `script`, `style`, `iframe`, `object`, `embed` and any `on*`
 * attribute, and rewrite a `href="javascript:` prefix. Everything else was printed as received, so
 * `<img src=x onerror=...>`, `<svg onload=...>`, `<form action>`, `<base href>` and
 * `<a href="&#106;avascript:...">` all survived it. `sanitizeHtml` from `@/lib/sanitize` is an
 * allowlist over the same text, and `scripts/security-checks.mjs` proves those payloads come out
 * inert.
 */

function toBlocks(content?: string | null): Block[] {
  const raw = (content || "").replace(/\r/g, "").trim();
  if (!raw) return [];

  const chunks = HTML_CONTENT.test(raw)
    ? raw.split(/<\/(?:p|h[1-6]|ul|ol|blockquote)>/gi).map((c) => c.trim()).filter(Boolean)
    : raw.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);

  const blocks: Block[] = [];

  for (const chunk of chunks) {
    const tag = chunk.match(LEAD_TAG)?.[1]?.toLowerCase();
    const kind = tag ? kindOfTag(tag) : kindOfPlainText(chunk);

    if (kind === "list") {
      const items = tag
        ? [...chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => cleanText(match[1]))
        : chunk.split("\n").map((line) => cleanText(line.replace(/^\s*[-*•]\s+/, "")));

      const cleaned = items.filter(Boolean);
      if (cleaned.length) blocks.push({ kind: "list", text: "", items: cleaned });
      continue;
    }

    const inner = tag
      ? chunk.replace(/^\s*<[^>]*>/i, "").replace(/\s*<\/[^>]*>\s*$/i, "")
      : chunk.replace(/^#{1,6}\s*/, "").replace(/^>\s?/, "");

    const text = tag ? inner.trim() : cleanText(inner);
    if (!text) continue;

    blocks.push({ kind, text, html: Boolean(tag) });
  }

  /* Consecutive `-` lines become one list, not one list per line. */
  const merged: Block[] = [];
  for (const block of blocks) {
    const previous = merged[merged.length - 1];
    if (block.kind === "list" && previous?.kind === "list") {
      previous.items = [...(previous.items || []), ...(block.items || [])];
      continue;
    }
    merged.push({ ...block, items: block.items ? [...block.items] : undefined });
  }

  return merged;
}

/** JSON columns are stored as text and are frequently null or malformed. */
function parseJsonArray<T>(value?: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** "UNSPLASH_LICENSE" -> "Unsplash license". Pipeline tokens are not copy. */
function humanizeLicense(value?: string | null): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const spaced = cleaned.replace(/[_/]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** "Source: BBC World News" is stored with its own label; do not print it twice. */
function stripSourceLabel(value?: string | null): string {
  return cleanText(value).replace(/^(?:source|reported by|original reporting)\s*:\s*/i, "");
}

/**
 * Syndicated links carry `?at_medium=RSS&utm_source=…`. Keep the article URL, and keep it only
 * if it is a web URL: this value comes from the feed and ends up in an `href`.
 */
function cleanUrl(value?: string | null): string {
  const safe = safeHref(value);
  if (!safe || !/^https?:/i.test(safe)) return "";
  try {
    const url = new URL(safe);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_|at_|pk_|mc_|ref)/i.test(key)) url.searchParams.delete(key);
    }
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return safe;
  }
}

function sameDay(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return formatDate(a, "long") === formatDate(b, "long");
}

/** Scroll depth of the document, 0 → 1. Drives the `.reading-progress` rule. */
function useReadingProgress(): number {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const root = document.documentElement;
      const total = root.scrollHeight - window.innerHeight;
      if (total <= 8) {
        setProgress(0);
        return;
      }
      const top = window.scrollY || root.scrollTop || 0;
      setProgress(Math.min(1, Math.max(0, top / total)));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

/**
 * The article page.
 *
 * Rebuilt as a magazine spread: a letterhead block in the reading measure, the
 * photograph wider than the column it illustrates, then the copy at ~68
 * characters with a 1.85 line-height, a drop cap on the opener and a terracotta
 * progress rule pinned to the top of the window.
 *
 * What used to be invented and now simply is not rendered: the "Editorial Staff"
 * byline and "Staff Journalist" role (this API returns `author: null`), the
 * "Today" date, "News Analysis" as a fallback category, "Editorial Use" as a
 * fallback licence, and the "What Happened?" card when it only repeats the
 * opening paragraph of the body.
 */
export function ArticleReader({ article }: { article: Article }) {
  const { lang, t } = useI18n();
  const progress = useReadingProgress();
  /* An estimate of where the reader is, derived from the same word count the byline
     publishes. It is a countdown of position, not a claim about the story. */
  const readingMinutes = estimateReadingMinutes(article.content);

  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const title = cleanText(lang === "km" && article.title_km ? article.title_km : article.title);
  const summary = cleanText(lang === "km" && article.summary_km ? article.summary_km : article.summary);
  const deck = cleanText(article.subheadline);
  const heroImage = article.hero_image_url || null;
  const heroCredit = cleanText(article.hero_image_credit);
  const heroLicense = humanizeLicense(article.hero_image_license);

  const blocks = React.useMemo(() => toBlocks(article.content), [article.content]);
  const leadIndex = blocks.findIndex((block) => block.kind === "paragraph");
  const leadParagraph = leadIndex === -1 ? "" : blocks[leadIndex].text;
  const bodyText = blocks
    .flatMap((block) => (block.kind === "list" ? block.items || [] : [block.text]))
    .join(" ");

  /* Ad density. Google's rule is that ads must not exceed or crowd the content, and a 250-word
     wire brief wearing three units reads as an ad page with a paragraph in it — which is also how
     accounts get limited. The second in-body unit therefore only appears on a real article: 1,800
     characters is roughly 300 words, about where a reader starts noticing a break rather than
     resenting one. */
  const isLongRead = bodyText.length >= 1800;

  /* Khmer stacks taller and takes no Latin drop cap, so the body's own script —
     not the interface language — decides the reading typography. */
  const khmerCopy = KHMER_SCRIPT.test(article.content || "") || article.language === "km";

  /* Wires copy the summary verbatim as the first paragraph, and paste the key
     points into the body as a bullet list. Showing both says the same thing
     twice, so the brief only appears when it adds something. */
  const showSummary = Boolean(summary) && cleanText(leadParagraph) !== summary;
  const keyPoints = parseJsonArray<string>(article.key_points)
    .map((point) => cleanText(point))
    .filter(Boolean);
  const pointsAlreadyInBody =
    keyPoints.length > 0 && keyPoints.every((point) => bodyText.includes(point));
  const showKeyPoints = !pointsAlreadyInBody;

  const timeline = parseJsonArray<TimelineItem>(article.timeline);
  const whyItMatters = cleanText(article.why_it_matters);

  const author = cleanText(article.author?.name);
  const authorRole = cleanText(article.author?.role);
  const publisher = stripSourceLabel(article.primary_source?.name || article.source_attribution_text);
  const sourceUrl = cleanUrl(article.primary_source_url || article.primary_source?.website_url);
  const publishedAt = article.published_at || article.created_at || null;
  const updatedLabel =
    article.updated_at && !sameDay(article.updated_at, publishedAt)
      ? formatDate(article.updated_at, "medium")
      : "";

  const sectionName = cleanText(article.category?.name) || (article.country === "KH" ? "Cambodia" : "World");
  const sectionHref = article.country === "KH" ? "/cambodia" : "/world";

  const actionClasses =
    "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-foreground";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard is blocked outside secure contexts — the address bar still works. */
    }
  };

  const handleShareSocial = (platform: "fb" | "tg" | "x") => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    const target =
      platform === "fb"
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : platform === "tg"
          ? `https://t.me/share/url?url=${url}&text=${text}`
          : `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex w-full flex-1 flex-col" lang={lang === "km" ? "km" : undefined}>
      <div
        aria-hidden="true"
        className="reading-progress"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* ── Letterhead ───────────────────────────────────────────────────── */}
      <Container width="reading" className="pt-6 pb-8 sm:pt-10">
        <Breadcrumbs
          items={[
            { label: sectionName, href: sectionHref },
            { label: title },
          ]}
        />

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="kicker section-label text-accent">{sectionName}</span>
          <span
            aria-hidden="true"
            className="h-px min-w-8 flex-1 bg-border"
          />
          {article.is_breaking && (
            <CategoryMark category="breaking" tone="chip">
              Breaking
            </CategoryMark>
          )}
          {article.category?.name && (
            <CategoryMark
              category={categoryKey(article.category.name)}
              tone="dot"
            >
              {cleanText(article.category.name)}
            </CategoryMark>
          )}
        </div>

        <h1 className="page-enter mt-4 font-display text-[32px] leading-[1.1] tracking-tight text-foreground sm:text-5xl sm:leading-[1.04] lg:text-6xl lg:leading-[1.02]">
          {title}
        </h1>

        {deck && (
          <p className="mt-4 max-w-2xl font-display text-lg leading-snug text-muted-foreground sm:text-xl">
            {deck}
          </p>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <Byline
            author={author}
            source={publisher}
            sourceUrl={sourceUrl}
            date={publishedAt}
            dateStyle="long"
            readingTime={formatReadingTime(article.content)}
            views={article.views_count > 0 ? article.views_count : null}
            location={cleanText(article.province_or_city) || null}
            size="md"
          />
          {(authorRole || updatedLabel) && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {authorRole && <span>{authorRole}</span>}
              {authorRole && updatedLabel && <span> · </span>}
              {updatedLabel && <span>Updated {updatedLabel}</span>}
            </p>
          )}
        </div>
      </Container>

      {/* ── Photograph, wider than the text it illustrates ───────────────── */}
      {heroImage && (
        <Container className="pb-8">
          <figure>
            <Photo
              src={heroImage}
              alt={article.hero_image_alt || title}
              ratio="16/9"
              radius="hero"
              priority
              showCredit={false}
            />
            {(heroCredit || heroLicense) && (
              <figcaption className="mt-2 text-right text-xs text-muted-foreground">
                {[heroCredit, heroLicense].filter(Boolean).join(" · ")}
              </figcaption>
            )}
          </figure>
        </Container>
      )}

      <Container width="reading">
        <AdSlot slot="ARTICLE_TOP" />
      </Container>

      {/* ── The brief ────────────────────────────────────────────────────── */}
      {(showSummary || showKeyPoints) && (
        <Container width="reading" className="flex flex-col gap-5 pt-4 pb-2">
          {showSummary && (
            <Reveal
              as="section"
              className="rounded-lg border border-border bg-surface-muted p-5 sm:p-6"
            >
              <h2 className="section-label text-accent">{cleanText(t("article.what_happened"))}</h2>
              <p className="mt-2.5 text-sm leading-[1.8] text-card-foreground sm:text-base">
                {summary}
              </p>
            </Reveal>
          )}

          {showKeyPoints && <KeyPoints points={keyPoints} />}
        </Container>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <Container width="reading" className="pt-6 pb-12">
        <div className="lg:grid lg:grid-cols-[44px_minmax(0,1fr)] lg:gap-6">
          {/* The share rail rides alongside the copy on a desktop, where the reading measure
              has room for it, and the same actions appear as a labelled band under the copy
              everywhere else. One set of controls, two shapes — never both. */}
          <aside
            aria-label={cleanText(t("article.share_article"))}
            className="hidden lg:block"
          >
            <div className="sticky top-28 flex flex-col items-center gap-1.5">
              <RailButton
                label="Share on Facebook"
                onClick={() => handleShareSocial("fb")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </RailButton>
              <RailButton label="Share on Telegram" onClick={() => handleShareSocial("tg")}>
                <Send className="h-4 w-4" aria-hidden="true" />
              </RailButton>
              <RailButton label="Share on X" onClick={() => handleShareSocial("x")}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </RailButton>
              <RailButton
                label={copied ? "Link copied" : "Copy link"}
                onClick={handleCopyLink}
                active={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                )}
              </RailButton>
              <RailButton
                label={saved ? "Saved" : "Save"}
                onClick={() => setSaved(!saved)}
                pressed={saved}
              >
                <Bookmark
                  className={cn("h-4 w-4", saved && "fill-current")}
                  aria-hidden="true"
                />
              </RailButton>

              {readingMinutes !== null && (
                <span className="section-label mt-2 whitespace-nowrap text-center leading-tight">
                  {Math.max(1, Math.ceil(readingMinutes * (1 - progress)))}
                  <span className="block">min left</span>
                </span>
              )}
            </div>
          </aside>

          <div
            className={cn("space-y-6 text-foreground", khmerCopy ? "leading-[2]" : "leading-[1.85]")}
          >
          {blocks.map((block, index) => {
            if (block.kind === "list") {
              return (
                <ul key={index} className="space-y-2.5 border-l border-border-strong pl-5">
                  {(block.items || []).map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-sm leading-[1.8] text-muted-foreground sm:text-base"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }

            if (block.kind === "heading") {
              return (
                <h2
                  key={index}
                  className="pt-4 font-display text-xl leading-snug tracking-tight text-foreground sm:text-2xl"
                >
                  {block.text}
                </h2>
              );
            }

            if (block.kind === "quote") {
              return (
                <blockquote
                  key={index}
                  className="border-l-2 border-accent pl-5 font-display text-lg leading-snug text-foreground sm:text-xl"
                >
                  {block.html ? (
                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.text) }} />
                  ) : (
                    block.text
                  )}
                </blockquote>
              );
            }

            const isLead = index === leadIndex;

            return (
              <p
                key={index}
                className={cn(
                  "text-base sm:text-lg",
                  isLead && !khmerCopy && /^[A-Za-z]/.test(block.text) && "drop-cap"
                )}
              >
                {block.html ? (
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.text) }} />
                ) : (
                  block.text
                )}
              </p>
            );
          })}

          {blocks.length === 0 && (
            <p className="text-base leading-[1.85] text-muted-foreground">
              The full text of this story is still being filed.
            </p>
          )}
          </div>
        </div>
      </Container>

      {/* ── Context ──────────────────────────────────────────────────────── */}
      {(whyItMatters || timeline.length > 0) && (
        <Container width="reading" className="flex flex-col gap-5 pb-12">
          {whyItMatters && (
            <Reveal
              as="section"
              className="rounded-lg border border-border bg-surface-muted p-5 sm:p-6"
            >
              <h2 className="section-label text-accent">{cleanText(t("article.why_it_matters"))}</h2>
              <p className="mt-2.5 text-sm leading-[1.8] text-card-foreground sm:text-base">
                {whyItMatters}
              </p>
            </Reveal>
          )}

          <TimelineView items={timeline} />
        </Container>
      )}

      {isLongRead && (
        <Container width="reading">
          <AdSlot slot="ARTICLE_MID" />
        </Container>
      )}

      {/* ── Attribution ──────────────────────────────────────────────────── */}
      <Container width="reading" className="pt-2 pb-10">
        <AttributionBox
          sourceName={publisher}
          sourceUrl={sourceUrl}
          license={article.primary_source?.license_notes}
          authorName={author || undefined}
          authorRole={authorRole || undefined}
        />
      </Container>

      {/* ── Share (narrow: the desktop rail above replaces this) ──────────── */}
      <Container width="reading" className="pb-12 lg:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <span className="section-label">{cleanText(t("article.share_article"))}</span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleShareSocial("fb")}
              className={actionClasses}
              aria-label="Share on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleShareSocial("tg")}
              className={actionClasses}
              aria-label="Share on Telegram"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleShareSocial("x")}
              className={actionClasses}
              aria-label="Share on X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            <button type="button" onClick={handleCopyLink} className={actionClasses}>
              {copied ? (
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{copied ? "Link copied" : "Copy link"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSaved(!saved)}
              aria-pressed={saved}
              className={cn(
                actionClasses,
                saved
                  ? "border-transparent bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                  : "bg-surface"
              )}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </Container>

      {/* ── Elsewhere on the site ────────────────────────────────────────── */}
      <Container width="reading" className="pb-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <PromoLink
            href="/discover"
            label="Discover"
            title="Explainers that show the mechanism"
            icon={<Compass className="h-5 w-5" aria-hidden="true" />}
          />
          <PromoLink
            href="/tools"
            label="Tools"
            title="Calculators that work without an account"
            icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      </Container>

      <Container width="reading" className="pb-12">
        <AdSlot slot="ARTICLE_BOTTOM" />
      </Container>
    </div>
  );
}

/** A single icon in the desktop share rail. Labelled, square, keyboard-reachable. */
function RailButton({
  label,
  onClick,
  pressed,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "pressable grid h-9 w-9 place-items-center rounded-full border bg-surface text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground",
        active || pressed ? "border-accent text-accent" : "border-border"
      )}
    >
      {children}
    </button>
  );
}

function PromoLink({
  href,
  label,
  title,
  icon,
}: {
  href: string;
  label: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-xs hover-lift hover:border-border-strong"
    >
      <span className="min-w-0">
        <CategoryMark category={categoryKey(label)} tone="dot">
          {label}
        </CategoryMark>
        <span className="mt-1.5 block font-display text-base leading-snug text-foreground transition-colors group-hover:text-accent sm:text-lg">
          {title}
        </span>
      </span>
      <span className="shrink-0 text-border-strong transition-colors group-hover:text-accent">
        {icon}
      </span>
    </Link>
  );
}
