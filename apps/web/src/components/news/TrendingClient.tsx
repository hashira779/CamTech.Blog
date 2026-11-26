"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import type { TrendingItemSummary, TrendingResponse } from "@/types";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { cleanText, formatCount, formatDate, hasKhmerText } from "@/lib/format";
import { localizeCategory, useI18n } from "@/lib/i18n";
import { AdSlot } from "@/components/ads/AdSlot";

const byViews = (a: TrendingItemSummary, b: TrendingItemSummary) => (b.views_count || 0) - (a.views_count || 0);

function dedupe(items: TrendingItemSummary[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function RankedRail({
  heading,
  title,
  emptyText,
  items,
  readsLabel,
  lang,
}: {
  heading: string;
  title: string;
  emptyText: string;
  items: TrendingItemSummary[];
  readsLabel: string;
  lang: "en" | "km";
}) {
  return (
    <div>
      <SectionHeader label={heading} title={title} />

      {items.length === 0 ? (
        <p className="py-6 text-sm leading-relaxed text-muted-foreground">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {items.map((item, index) => {
            const views = item.views_count > 0 ? formatCount(item.views_count) : "";
            const date = formatDate(item.published_at, "medium", lang);
            const rowTitle = cleanText(
              lang === "km" && hasKhmerText(item.title_km, 3) ? item.title_km : item.title
            );

            return (
              <Reveal as="li" key={item.id} index={index} variant="left">
                <Link
                  href={item.url}
                  className="group flex items-start gap-4 py-4 transition-colors hover:bg-surface-muted/60"
                >
                  <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <CategoryMark category={categoryKey(item.category)}>
                      {localizeCategory(item.category, lang) || item.category}
                    </CategoryMark>
                    <span className="mt-1.5 block font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                      {rowTitle}
                    </span>
                    {(views || date) && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {views && <span className="tabular-nums">{views} {readsLabel}</span>}
                        {views && date && <span aria-hidden="true">·</span>}
                        {date && <span className="tabular-nums">{date}</span>}
                      </span>
                    )}
                  </span>

                  {item.hero_image_url && (
                    <Photo
                      src={item.hero_image_url}
                      alt=""
                      ratio="4/3"
                      radius="md"
                      compact
                      showCredit={false}
                      className="hidden h-16 w-20 shrink-0 sm:block"
                    />
                  )}
                </Link>
              </Reveal>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function TrendingClient({ trendingData }: { trendingData: TrendingResponse }) {
  const { lang, t } = useI18n();
  const readsLabel = t("trending.reads");
  const cambodia = [...(trendingData.cambodia || [])].sort(byViews);
  const world = [...(trendingData.world || [])].sort(byViews);
  const thaiCambodia = [...(trendingData.thai_cambodia || [])].sort(byViews);
  const asean = [...(trendingData.asean || [])].sort(byViews);
  const all = dedupe([...cambodia, ...thaiCambodia, ...asean, ...world]).sort(byViews);

  const lead = all[0];
  const follow = all.slice(1, 5);
  const leadViews = lead && lead.views_count > 0 ? formatCount(lead.views_count) : "";
  const leadDate = lead ? formatDate(lead.published_at, "medium", lang) : "";
  const leadTitle = lead
    ? cleanText(lang === "km" && hasKhmerText(lead.title_km, 3) ? lead.title_km : lead.title)
    : "";

  const shown = new Set(all.map((item) => item.id));
  const editorPicks = (trendingData.editor_picks || []).filter((item) => !shown.has(item.id));

  return (
    <PublicPageShell
      breadcrumbs={[{ label: t("nav.trending"), href: "/trending" }]}
      badge={
        <Badge variant="secondary" size="sm" className="gap-1.5">
          <TrendingUp size={14} aria-hidden="true" />
          {t("trending.eyebrow")}
        </Badge>
      }
      title={t("trending.title")}
      description={t("trending.description")}
    >
      {!lead && (
        <p className="py-12 text-sm leading-relaxed text-muted-foreground">
          {t("trending.empty_desk")}
        </p>
      )}

      {lead && (
        <section className="border-b border-border pb-10">
          <SectionHeader label={t("trending.top_ranking")} title={t("trending.read_most_now")} />

          <article className="group grid gap-6 sm:grid-cols-2 sm:gap-8">
            <Link href={lead.url} aria-label={leadTitle} className="block">
              <Photo
                src={lead.hero_image_url}
                alt={leadTitle}
                ratio="3/2"
                radius="lg"
                priority
              />
            </Link>

            <div className="flex flex-col justify-center gap-3">
              <CategoryMark category={categoryKey(lead.category)} tone="dot">
                {localizeCategory(lead.category, lang) || lead.category}
              </CategoryMark>

              <h2 className="font-display text-2xl leading-[1.15] tracking-tight text-foreground sm:text-3xl">
                <Link href={lead.url} className="transition-colors hover:text-accent">
                  {leadTitle}
                </Link>
              </h2>

              {(leadViews || leadDate) && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {leadViews && <span className="tabular-nums">{leadViews} {readsLabel}</span>}
                  {leadViews && leadDate && <span aria-hidden="true">·</span>}
                  {leadDate && <span className="tabular-nums">{leadDate}</span>}
                </p>
              )}
            </div>
          </article>

          {follow.length > 0 && (
            <ol className="mt-8 divide-y divide-border border-t border-border">
              {follow.map((item, index) => {
                const views = item.views_count > 0 ? formatCount(item.views_count) : "";
                const itemTitle = cleanText(
                  lang === "km" && hasKhmerText(item.title_km, 3) ? item.title_km : item.title
                );
                return (
                  <Reveal as="li" key={item.id} index={index}>
                    <Link href={item.url} className="group flex items-baseline gap-4 py-3.5">
                      <span className="w-5 shrink-0 font-display text-base leading-none text-border-strong tabular-nums">
                        {index + 2}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                        {itemTitle}
                      </span>
                      {views && (
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {views}
                        </span>
                      )}
                    </Link>
                  </Reveal>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {cambodia.length + world.length > 0 && (
        <section className="grid gap-10 pt-10 lg:grid-cols-2 lg:gap-12">
          <RankedRail
            heading={t("nav.cambodia")}
            title={t("trending.most_read_kh")}
            emptyText={t("trending.empty_desk")}
            items={cambodia}
            readsLabel={readsLabel}
            lang={lang}
          />
          <RankedRail
            heading={t("nav.world")}
            title={t("trending.most_read_world")}
            emptyText={t("trending.empty_desk")}
            items={world}
            readsLabel={readsLabel}
            lang={lang}
          />
        </section>
      )}

      {(thaiCambodia.length > 0 || asean.length > 0) && (
        <section className="grid gap-10 pt-10 lg:grid-cols-2 lg:gap-12">
          {thaiCambodia.length > 0 && (
            <RankedRail
              heading={t("nav.thailand_cambodia")}
              title={t("trending.most_read_th")}
              emptyText={t("trending.empty_desk")}
              items={thaiCambodia}
              readsLabel={readsLabel}
              lang={lang}
            />
          )}
          {asean.length > 0 && (
            <RankedRail
              heading={t("nav.asean")}
              title={t("trending.most_read_asean")}
              emptyText={t("trending.empty_desk")}
              items={asean}
              readsLabel={readsLabel}
              lang={lang}
            />
          )}
        </section>
      )}

      <AdSlot slot="TRENDING_MID" className="pt-12" />

      {editorPicks.length > 0 && (
        <section className="pt-12">
          <SectionHeader label={t("trending.editor_picks")} title={t("home.editor_picks")} />
          <ul className="divide-y divide-border border-y border-border">
            {editorPicks.map((item, index) => {
              const pickTitle = cleanText(
                lang === "km" && hasKhmerText(item.title_km, 3) ? item.title_km : item.title
              );
              return (
                <Reveal as="li" key={item.id} index={index}>
                  <Link href={item.url} className="group flex items-baseline gap-4 py-4">
                    <span className="min-w-0 flex-1">
                      <CategoryMark category={categoryKey(item.category)}>
                        {localizeCategory(item.category, lang) || item.category}
                      </CategoryMark>
                      <span className="mt-1.5 block text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                        {pickTitle}
                      </span>
                    </span>
                    {item.views_count > 0 && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatCount(item.views_count)} {readsLabel}
                      </span>
                    )}
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}
    </PublicPageShell>
  );
}
