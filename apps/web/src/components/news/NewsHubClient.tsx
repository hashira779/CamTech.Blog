"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Globe2, Landmark, Newspaper, ShieldAlert } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { NewsCard } from "@/components/shared/news-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { cleanText, formatCount } from "@/lib/format";
import { localizeCategory, localizeDesk, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Article, TrendingResponse } from "@/types";

export type DeskKey = "ALL" | "KH" | "TH" | "ASEAN" | "WORLD";

interface NewsHubClientProps {
  initialDesk: DeskKey;
  allItems: Article[];
  khItems: Article[];
  thItems: Article[];
  aseanItems: Article[];
  worldItems: Article[];
  trending: TrendingResponse;
  unavailable?: boolean;
}

const DESK_LIST: {
  key: DeskKey;
  labelKey: string;
  noteKey: string;
  sectionHref?: string;
}[] = [
  { key: "ALL", labelKey: "news.desk_all", noteKey: "news.description" },
  { key: "KH", labelKey: "news.desk_kh", noteKey: "news.desk_kh_note", sectionHref: "/cambodia" },
  { key: "TH", labelKey: "news.desk_th", noteKey: "news.desk_th_note" },
  { key: "ASEAN", labelKey: "news.desk_asean", noteKey: "news.desk_asean_note" },
  { key: "WORLD", labelKey: "news.desk_world", noteKey: "news.desk_world_note", sectionHref: "/world" },
];

export function NewsHubClient({
  initialDesk,
  allItems,
  khItems,
  thItems,
  aseanItems,
  worldItems,
  trending,
  unavailable,
}: NewsHubClientProps) {
  const searchParams = useSearchParams();
  const { lang, t } = useI18n();
  const isKm = lang === "km";

  const paramDesk = (searchParams.get("desk") || "").toUpperCase();
  const desk: DeskKey =
    paramDesk === "KH" || paramDesk === "TH" || paramDesk === "ASEAN" || paramDesk === "WORLD" || paramDesk === "ALL"
      ? (paramDesk as DeskKey)
      : initialDesk;

  const itemsByDesk: Record<DeskKey, Article[]> = useMemo(
    () => ({
      ALL: allItems,
      KH: khItems,
      TH: thItems,
      ASEAN: aseanItems,
      WORLD: worldItems,
    }),
    [allItems, khItems, thItems, aseanItems, worldItems]
  );

  const items = itemsByDesk[desk] || [];
  const activeMeta = DESK_LIST.find((d) => d.key === desk) || DESK_LIST[0];

  const handleDeskSwitch = (nextDesk: DeskKey) => {
    const nextUrl = nextDesk === "ALL" ? "/news" : `/news?desk=${nextDesk}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const railItems = useMemo(() => {
    if (desk === "KH") return trending.cambodia || [];
    if (desk === "TH" && (trending.thai_cambodia || []).length > 0) return trending.thai_cambodia || [];
    if (desk === "ASEAN" && (trending.asean || []).length > 0) return trending.asean || [];
    if (desk === "WORLD") return trending.world || [];
    return [...(trending.cambodia || []).slice(0, 3), ...(trending.world || []).slice(0, 3)];
  }, [desk, trending]);

  const lead = items[0];
  const secondary = items.slice(1, 3);
  const latest = items.slice(3, 18);

  const countLabel = isKm
    ? `${items.length} ${t("section.stories_count")}`
    : `${formatCount(items.length)} ${t("section.stories_count")}`;

  return (
    <div className="flex w-full flex-1 flex-col" lang={isKm ? "km" : undefined}>
      <PageHeader
        breadcrumbs={[
          { label: t("nav.news"), href: "/news" },
          ...(desk !== "ALL" ? [{ label: t(activeMeta.labelKey) }] : []),
        ]}
        category={desk === "WORLD" ? "world" : "news"}
        eyebrow={t("news.eyebrow")}
        title={desk === "ALL" ? t("news.title") : t(activeMeta.labelKey)}
        description={t(activeMeta.noteKey)}
        aside={
          <>
            {items.length > 0 && <span className="tabular-nums">{countLabel}</span>}
            {activeMeta.sectionHref && (
              <Link
                href={activeMeta.sectionHref}
                className="group inline-flex items-center gap-1.5 font-medium text-accent transition-colors hover:text-foreground"
              >
                {t("news.open_section")}
                <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
              </Link>
            )}
            <Link
              href="/sources"
              className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("section.source_registry")}
              <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
            </Link>
          </>
        }
      />

      {/* Clean Desk Switcher Bar */}
      <Container className="pt-6">
        <nav
          aria-label={t("news.switch_desk")}
          className="flex flex-wrap items-center gap-2 border-b border-border pb-5"
        >
          {DESK_LIST.map((entry) => {
            const active = desk === entry.key;
            const count = itemsByDesk[entry.key]?.length || 0;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => handleDeskSwitch(entry.key)}
                aria-pressed={active}
                className={cn(
                  "pressable inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors cursor-pointer",
                  active
                    ? "border-accent bg-accent text-accent-foreground shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                <span>{t(entry.labelKey)}</span>
                <span
                  className={cn(
                    "tabular-nums text-xs",
                    active ? "opacity-85" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Highlight Banner for Thai News on Cambodia or ASEAN context */}
        {(desk === "TH" || desk === "ASEAN") && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
            {desk === "TH" ? (
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            ) : (
              <Globe2 size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            )}
            <p className="leading-relaxed">{t(activeMeta.noteKey)}</p>
          </div>
        )}
      </Container>

      {items.length === 0 ? (
        <Container className="py-12">
          <EmptyState
            icon={desk === "KH" ? Landmark : Newspaper}
            title={
              unavailable
                ? (isKm ? "មិនអាចផ្ទុកព័ត៌មានបានទេ" : "Stories could not be loaded")
                : t("news.empty_desk")
            }
            description={
              unavailable
                ? (isKm ? "ប្រព័ន្ធកំពុងដំណើរការ។ សូមព្យាយាមម្តងទៀតក្នុងរយៈពេលបន្តិចទៀត។" : "The newsroom is temporarily unreachable. Please try again in a moment.")
                : t("news.empty_desk_desc")
            }
            actionLabel={t("news.desk_all")}
            actionHref="/news"
          />
        </Container>
      ) : (
        <Container className="pb-16 pt-8 sm:pt-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-8">
              {lead && (
                <div className="scroll-zoom">
                  <NewsCard article={lead} variant="feature" priority showSummary lang={lang} />
                </div>
              )}

              <AdSlot slot="HOME_TOP" eligible={items.length > 0} />

              {secondary.length > 0 && (
                <div className="mt-12">
                  <SectionHeader label={t("section.in_this_issue")} title={t(activeMeta.labelKey)} />
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
                  <SectionHeader label={t("section.latest")} title={t("common.latest_news")} />
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

            <aside className="lg:col-span-4">
              <div className="space-y-10 lg:sticky lg:top-24">
                {/* Desk Snapshot Directory */}
                {desk === "ALL" && thItems.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="section-label text-accent">{t("nav.thailand_cambodia")}</p>
                      <button
                        type="button"
                        onClick={() => handleDeskSwitch("TH")}
                        className="text-xs font-medium text-accent hover:underline cursor-pointer"
                      >
                        {t("home.view_all")}
                      </button>
                    </div>
                    <ul className="mt-3 divide-y divide-border">
                      {thItems.slice(0, 3).map((item) => {
                        const dTitle = cleanText(isKm && item.title_km ? item.title_km : item.title);
                        return (
                          <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                            <Link
                              href={`/world/news/${item.slug}`}
                              className="text-sm font-medium leading-snug text-foreground transition-colors hover:text-accent line-clamp-2"
                            >
                              {dTitle}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div>
                  <SectionHeader label={t("section.most_read")} title={t("section.opened_most_often")} />
                  {railItems.length > 0 ? (
                    <Reveal as="ol" variant="left" className="divide-y divide-border">
                      {railItems.slice(0, 6).map((item, index) => {
                        const rowTitle = cleanText(isKm && item.title_km ? item.title_km : item.title);
                        const deskInfo = localizeDesk(item.country, lang);
                        return (
                          <li key={`${item.id}-${index}`}>
                            <Link href={item.url} className="group flex items-start gap-4 py-4">
                              <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="min-w-0 flex-1">
                                <CategoryMark category={categoryKey(item.category)}>
                                  {localizeCategory(item.category, lang) || deskInfo.label}
                                </CategoryMark>
                                <span className="mt-1.5 block text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                                  {rowTitle}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </Reveal>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("section.reading_figures")}
                    </p>
                  )}
                </div>

                <AdSlot slot="SIDEBAR" eligible={items.length > 0} />
              </div>
            </aside>
          </div>
        </Container>
      )}
    </div>
  );
}
