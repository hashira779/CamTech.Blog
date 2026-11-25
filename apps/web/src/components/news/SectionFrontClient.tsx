"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Container, Section } from "@/components/ui/container";
import { CategoryMark, categoryKey, type CategoryKey } from "@/components/ui/category-mark";
import { NewsCard } from "@/components/shared/news-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { cleanText, formatCount, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Article, TrendingResponse } from "@/types";

type RailItem = TrendingResponse["cambodia"][number];

export interface SectionFrontClientProps {
  items: Article[];
  total: number;
  unavailable?: boolean;
  mostRead: RailItem[];
  country: "KH" | "WORLD";
  trendingKey: "cambodia" | "world";
  storyBase: "/cambodia/news" | "/world/news";
  category: CategoryKey;
  defaultEyebrow: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultSecondaryTitle: string;
  defaultLatestTitle: string;
  defaultAttribution: string;
  emptyTitle: string;
  emptyDescription: string;
  emptySearch: string;
}

export function SectionFrontClient({
  items,
  total,
  unavailable,
  mostRead,
  country,
  storyBase,
  category,
  defaultEyebrow,
  defaultTitle,
  defaultDescription,
  defaultSecondaryTitle,
  defaultLatestTitle,
  defaultAttribution,
  emptyTitle,
  emptyDescription,
  emptySearch,
}: SectionFrontClientProps) {
  const { lang, t } = useI18n();

  // Dynamic localization
  const isKm = lang === "km";
  const eyebrow = isKm
    ? (country === "KH" ? t("cambodia.eyebrow") : t("world.eyebrow"))
    : defaultEyebrow;
  const title = isKm
    ? (country === "KH" ? t("cambodia.title") : t("world.title"))
    : defaultTitle;
  const description = isKm
    ? (country === "KH" ? t("cambodia.description") : t("world.description"))
    : defaultDescription;
  const secondaryTitle = isKm
    ? (country === "KH" ? t("cambodia.secondary_title") : t("world.secondary_title"))
    : defaultSecondaryTitle;
  const latestTitle = isKm
    ? (country === "KH" ? t("cambodia.latest_title") : t("world.latest_title"))
    : defaultLatestTitle;
  const attribution = isKm
    ? (country === "KH" ? t("cambodia.attribution") : t("world.attribution"))
    : defaultAttribution;

  const inThisIssueLabel = t("section.in_this_issue");
  const latestLabel = t("section.latest");
  const mostReadLabel = t("section.most_read");
  const openedMostOftenLabel = t("section.opened_most_often");
  const howWeAttributeLabel = t("section.how_we_attribute");
  const sourceRegistryLabel = t("section.source_registry");
  const attributionLabel = t("section.attribution");
  const storiesCountLabel = isKm
    ? `${total} ${t("section.stories_count")}`
    : `${formatCount(total)} ${t("section.stories_count")}`;

  const lead = items[0];
  const secondary = items.slice(1, 3);
  const latest = items.slice(3, 14);

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        breadcrumbs={[{ label: title }]}
        category={category}
        eyebrow={eyebrow}
        title={title}
        description={description}
        aside={
          <>
            {total > 0 && <span className="tabular-nums">{storiesCountLabel}</span>}
            <Link
              href="/sources"
              className="group inline-flex items-center gap-1.5 font-medium text-accent transition-colors hover:text-foreground"
            >
              {howWeAttributeLabel}
              <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
            </Link>
          </>
        }
      />

      {items.length === 0 ? (
        <Section>
          <Container>
            <EmptyState
              title={unavailable ? (isKm ? "មិនអាចផ្ទុកព័ត៌មានបានទេ" : "Stories could not be loaded") : emptyTitle}
              description={
                unavailable
                  ? (isKm ? "ប្រព័ន្ធកំពុងដំណើរការ។ សូមព្យាយាមម្តងទៀតក្នុងរយៈពេលបន្តិចទៀត។" : "The newsroom is not answering right now. Please try again in a minute.")
                  : emptyDescription
              }
              actionLabel={isKm ? "ស្វែងរកបណ្ណសារ" : "Search the archive"}
              actionHref={`/search?q=${encodeURIComponent(emptySearch)}`}
            />
          </Container>
        </Section>
      ) : (
        <Container className="pb-16 pt-10 sm:pt-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            {/* ── Lead, features, latest ──────────────────────────────────── */}
            <div className="min-w-0 lg:col-span-8">
              {lead && (
                <div className="scroll-zoom">
                  <NewsCard article={lead} variant="feature" priority showSummary lang={lang} />
                </div>
              )}

              <AdSlot slot="HOME_TOP" />

              {secondary.length > 0 && (
                <div className="mt-12">
                  <SectionHeader label={inThisIssueLabel} title={secondaryTitle} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    {secondary.map((article, index) => (
                      <Reveal key={article.id} index={index} className="h-full">
                        <NewsCard article={article} variant="standard" lang={lang} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {latest.length > 0 && (
                <div className="mt-12">
                  <SectionHeader label={latestLabel} title={latestTitle} />
                  <div>
                    {latest.map((article, index) => (
                      <Reveal key={article.id} index={index}>
                        <NewsCard article={article} variant="list" rank={index + 1} lang={lang} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar rail ────────────────────────────────────────────── */}
            <aside className="lg:col-span-4">
              <div className="space-y-10 lg:sticky lg:top-24">
                <div>
                  <SectionHeader label={mostReadLabel} title={openedMostOftenLabel} />
                  {mostRead.length > 0 ? (
                    <Reveal as="ol" variant="left" className="divide-y divide-border">
                      {mostRead.map((item, index) => (
                        <RailRow key={`${item.id}-${index}`} item={item} rank={index + 1} storyBase={storyBase} lang={lang} />
                      ))}
                    </Reveal>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("section.reading_figures")}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
                  <p className="section-label text-muted-foreground">{attributionLabel}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{attribution}</p>
                  <Link
                    href="/sources"
                    className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                  >
                    {sourceRegistryLabel}
                    <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                  </Link>
                </div>

                <AdSlot slot="SIDEBAR" />
              </div>
            </aside>
          </div>
        </Container>
      )}
    </div>
  );
}

function RailRow({ item, rank, storyBase, lang }: { item: RailItem; rank: number; storyBase: string; lang: string }) {
  const href = item.url || `${storyBase}/${item.slug}`;
  const title = cleanText(lang === "km" && item.title_km ? item.title_km : item.title);

  return (
    <li>
      <Link href={href} className="group flex items-start gap-4 py-4">
        <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <CategoryMark category={categoryKey(item.category)}>{item.category}</CategoryMark>
          <span className="mt-1.5 block text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
            {title}
          </span>
        </span>
      </Link>
    </li>
  );
}
