"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Discovery } from "@/types";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { Byline } from "@/components/ui/byline";
import { cleanText, formatReadingTime, hasKhmerText } from "@/lib/format";
import { localizeCategory, useI18n } from "@/lib/i18n";

const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors";
const CHIP_ACTIVE = "border-accent bg-accent text-accent-foreground";
const CHIP_IDLE =
  "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground";

export function DiscoverHubClient({
  items,
  categories,
  activeCategory,
}: {
  items: Discovery[];
  categories: string[];
  activeCategory: string;
}) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";
  const [lead, ...rest] = items;

  const titleOf = (d: Discovery) =>
    cleanText(isKm && hasKhmerText(d.title_km, 3) ? d.title_km : d.title);
  const introOf = (d: Discovery) =>
    cleanText(isKm && hasKhmerText(d.intro_km, 8) ? d.intro_km : d.intro);
  const bodyOf = (d: Discovery) =>
    isKm && hasKhmerText(d.main_explanation_km, 25) ? d.main_explanation_km : d.main_explanation;

  return (
    <PublicPageShell
      breadcrumbs={[{ label: t("nav.discover"), href: "/discover" }]}
      badge={
        <Badge variant="secondary" size="sm" className="gap-1.5">
          <Compass size={14} aria-hidden="true" />
          {t("discover.eyebrow")}
        </Badge>
      }
      title={t("discover.title")}
      description={t("discover.description")}
    >
      {categories.length > 0 && (
        <nav aria-label="Explainer topics" className="mb-8 flex flex-wrap items-center gap-2">
          <Link href="/discover" className={`${CHIP_BASE} ${!activeCategory ? CHIP_ACTIVE : CHIP_IDLE}`}>
            {t("discover.all_topics")}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/discover?category=${encodeURIComponent(cat)}`}
              className={`${CHIP_BASE} ${activeCategory === cat ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {localizeCategory(cat, lang) || cat}
            </Link>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={isKm ? "មិនទាន់មានអត្ថបទពន្យល់នៅឡើយទេ" : "No explainers published yet"}
          description={
            isKm
              ? "សូមជ្រើសរើសប្រធានបទផ្សេងទៀត ឬរុករកឧបករណ៍មានប្រយោជន៍។"
              : "There are no published explainers in this collection yet."
          }
          actionLabel={t("nav.tools")}
          actionHref="/tools"
        />
      ) : (
        <>
          <SectionHeader
            label={t("nav.discover")}
            title={activeCategory ? (localizeCategory(activeCategory, lang) || activeCategory) : t("discover.latest")}
            description={
              isKm
                ? `អត្ថបទពន្យល់ចំនួន ${items.length}`
                : `${items.length} ${items.length === 1 ? "explainer" : "explainers"} available.`
            }
            className="mb-6 sm:mb-8"
          />

          {lead && (
            <article className="group grid gap-6 border-b border-border pb-10 sm:grid-cols-2 sm:gap-8">
              <Link href={`/discover/${lead.slug}`} aria-label={titleOf(lead)} className="block">
                <Photo
                  zoom
                  src={lead.hero_image_url}
                  alt={lead.hero_image_alt || titleOf(lead)}
                  credit={lead.hero_image_credit}
                  ratio="3/2"
                  radius="lg"
                />
              </Link>
              <div className="flex flex-col justify-center gap-3">
                <CategoryMark category={categoryKey(lead.category)} tone="dot">
                  {localizeCategory(lead.category, lang) || lead.category}
                </CategoryMark>
                <h2 className="font-display text-2xl leading-[1.15] tracking-tight text-foreground sm:text-3xl">
                  <Link href={`/discover/${lead.slug}`} className="transition-colors hover:text-accent">
                    {titleOf(lead)}
                  </Link>
                </h2>
                {introOf(lead) && (
                  <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{introOf(lead)}</p>
                )}
                <div className="pt-1">
                  <Byline
                    date={lead.published_at}
                    dateStyle="medium"
                    readingTime={formatReadingTime(bodyOf(lead), lang)}
                    views={lead.views_count > 0 ? lead.views_count : null}
                    lang={lang}
                    size="md"
                  />
                </div>
                <Link
                  href={`/discover/${lead.slug}`}
                  className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  {t("discover.read_explainer")}
                  <ArrowRight size={15} aria-hidden="true" className="link-nudge" />
                </Link>
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <div className="grid gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((disc, index) => {
                const title = titleOf(disc);
                const intro = introOf(disc);
                return (
                  <Reveal key={disc.id} index={index} className="h-full">
                    <Link
                      href={`/discover/${disc.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
                      aria-label={title}
                    >
                      <Photo
                        zoom
                        src={disc.hero_image_url}
                        alt={disc.hero_image_alt || title}
                        credit={disc.hero_image_credit}
                        ratio="16/9"
                        radius="none"
                      />
                      <div className="flex flex-1 flex-col gap-2.5 p-5">
                        <CategoryMark category={categoryKey(disc.category)}>
                          {localizeCategory(disc.category, lang) || disc.category}
                        </CategoryMark>
                        <h3 className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                          {title}
                        </h3>
                        {intro && (
                          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{intro}</p>
                        )}
                        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
                          <Byline
                            date={disc.published_at}
                            readingTime={formatReadingTime(bodyOf(disc), lang)}
                            lang={lang}
                          />
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                            {t("discover.read_explainer")}
                            <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </>
      )}
    </PublicPageShell>
  );
}
