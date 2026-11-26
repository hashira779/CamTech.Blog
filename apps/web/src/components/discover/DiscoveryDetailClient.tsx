"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, Wrench } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { hasSubstantiveContent } from "@/lib/content-quality";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Photo } from "@/components/ui/photo";
import { Byline } from "@/components/ui/byline";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { cleanText, formatDate, formatReadingTime, hasKhmerText } from "@/lib/format";
import { localizeCategory, useI18n } from "@/lib/i18n";
import { safeHref, sanitizeHtml } from "@/lib/sanitize";
import type { Discovery } from "@/types";

interface VisualSection {
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  image_url?: string | null;
}

interface SourceLink {
  name?: string | null;
  url?: string | null;
}

function parseArray<T>(raw?: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function DiscoveryDetailClient({ disc }: { disc: Discovery }) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";

  const hasKmTitle = hasKhmerText(disc.title_km, 3);
  const hasKmIntro = hasKhmerText(disc.intro_km, 8);
  const hasKmBody = hasKhmerText(disc.main_explanation_km, 25);

  const title = cleanText(isKm && hasKmTitle ? disc.title_km : disc.title);
  const intro = cleanText(isKm && hasKmIntro ? disc.intro_km : disc.intro);
  const rawBody = isKm && hasKmBody ? disc.main_explanation_km : disc.main_explanation;
  const showKmNotice = isKm && !hasKmBody && Boolean((disc.main_explanation || "").trim());

  const visualSections = parseArray<VisualSection>(disc.visual_sections);
  const importantFacts = parseArray<string>(disc.important_facts).map(cleanText).filter(Boolean);
  const sourcesList = parseArray<SourceLink | string>(disc.sources);

  const credit = disc.hero_image_credit ? cleanText(disc.hero_image_credit) : null;
  const dateLabel = formatDate(disc.published_at, "long", lang);
  const readingTime = formatReadingTime(rawBody, lang);
  const views = disc.views_count > 0 ? disc.views_count : null;
  const hasMeta = Boolean(dateLabel) || Boolean(readingTime) || views !== null;

  const paragraphs = (rawBody || "")
    .split(/\n\s*\n/)
    .map((p) => sanitizeHtml(p.trim()))
    .filter(Boolean);

  return (
    <article className="flex w-full flex-1 flex-col py-8 sm:py-12" lang={isKm ? "km" : undefined}>
      <Container>
        <Breadcrumbs
          items={[
            { label: t("nav.discover"), href: "/discover" },
            ...(disc.category ? [{ label: localizeCategory(disc.category, lang) || cleanText(disc.category) }] : []),
          ]}
          className="mb-6"
        />

        <header className="mx-auto max-w-3xl">
          <CategoryMark category={categoryKey(disc.category)} tone="dot">
            {localizeCategory(disc.category, lang) || disc.category}
          </CategoryMark>

          <h1 className="mt-3 font-display text-3xl leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          {intro && (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>
          )}

          {hasMeta && (
            <div className="mt-5 border-t border-border pt-4">
              <Byline
                date={disc.published_at}
                dateStyle="long"
                readingTime={readingTime}
                views={views}
                lang={lang}
                size="md"
              />
            </div>
          )}
        </header>

        <figure className="mt-8">
          <Photo
            src={disc.hero_image_url}
            alt={disc.hero_image_alt || title}
            credit={credit}
            ratio="16/9"
            radius="hero"
            priority
            showCredit={false}
          />
          {credit && (
            <figcaption className="mt-2 text-right text-xs text-muted-foreground">
              {credit}
            </figcaption>
          )}
        </figure>

        <div className="mt-10 space-y-10">
          {showKmNotice && (
            <div className="container-reading rounded-lg border border-border bg-surface-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {t("article.km_translating_notice")}
            </div>
          )}

          {paragraphs.length > 0 && (
            <div className="container-reading space-y-5 text-base leading-[1.75] text-foreground/90 [&_a]:text-accent [&_em]:italic [&_strong]:font-semibold">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={i === 0 && !hasKmBody ? "drop-cap" : undefined}
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </div>
          )}

          <Container width="reading" className="px-0">
            <AdSlot slot="DISCOVERY_MID" eligible={hasSubstantiveContent(disc.main_explanation)} />
          </Container>

          {visualSections.length > 0 && (
            <section>
              <SectionHeader label={t("discover.anatomy")} title={t("discover.step_by_step")} />
              <ol className="space-y-5">
                {visualSections.map((sec, idx) => {
                  const secTitle = cleanText(sec.title);
                  const secDescription = cleanText(sec.description);
                  const secCaption = cleanText(sec.caption);
                  if (!secTitle && !secDescription && !sec.image_url) return null;

                  return (
                    <li
                      key={idx}
                      className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-xs sm:grid-cols-[10rem_1fr] sm:gap-6"
                    >
                      {sec.image_url && (
                        <Photo
                          src={sec.image_url}
                          alt={secTitle || title}
                          ratio="4/3"
                          radius="md"
                          showCredit={false}
                          placeholderLabel="Diagram"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="font-display text-lg leading-none text-border-strong tabular-nums">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {secTitle && (
                          <h3 className="mt-2 text-base font-semibold leading-snug text-foreground">
                            {secTitle}
                          </h3>
                        )}
                        {secDescription && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {secDescription}
                          </p>
                        )}
                        {secCaption && (
                          <p className="mt-2 text-xs italic text-muted-foreground">{secCaption}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {importantFacts.length > 0 && (
            <section className="container-reading rounded-lg border border-border bg-surface-muted p-6 sm:p-8">
              <h2 className="section-label text-accent">{t("discover.key_facts")}</h2>
              <ul className="mt-4 space-y-3">
                {importantFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
                    <CheckCircle2
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-category-discover"
                    />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sourcesList.length > 0 && (
            <section className="container-reading border-t border-border pt-6">
              <h2 className="section-label">{t("discover.sources")}</h2>
              <ul className="mt-3 space-y-2.5">
                {sourcesList.map((src, idx) => {
                  const href = safeHref(typeof src === "string" ? src : src?.url);
                  const label = cleanText(typeof src === "string" ? src : src?.name || src?.url);
                  if (!label && !href) return null;

                  return (
                    <li key={idx} className="text-sm leading-relaxed">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-start gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                        >
                          <span className="break-all">{label || href}</span>
                          <ExternalLink size={13} aria-hidden="true" className="mt-1 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <nav aria-label="Keep reading" className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
          <Link
            href="/tools"
            className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-xs hover-lift hover:border-border-strong"
          >
            <span className="min-w-0">
              <span className="section-label block">{t("discover.utilities")}</span>
              <span className="mt-1.5 block font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                {t("discover.everyday_tools")}
              </span>
            </span>
            <Wrench
              size={20}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-rotate-12"
            />
          </Link>
        </nav>
      </Container>
    </article>
  );
}
