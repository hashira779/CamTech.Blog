import Link from "next/link";
import { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { getTrending } from "@/lib/api";
import type { TrendingResponse } from "@/types";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { cleanText, formatCount, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Trending",
  description:
    "Authentic reader-engagement rankings for Cambodia and the world, based on recent views, shares, saves and time-decay.",
};

export const revalidate = 60;

type Story = TrendingResponse["cambodia"][number];

const byViews = (a: Story, b: Story) => (b.views_count || 0) - (a.views_count || 0);

function dedupe(items: Story[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * A ranked rail.
 *
 * `trend_score` is deliberately not printed: it is an internal engine figure
 * (the live feed contains a story at 0.0), while `views_count` is something a
 * reader can check. When a story has no views, the row renders no figure at all
 * rather than "0 reads" or an invented label.
 */
function RankedRail({ heading, region, items }: { heading: string; region: string; items: Story[] }) {
  return (
    <div>
      <SectionHeader label={heading} title={`Most read ${region}`} />

      {items.length === 0 ? (
        <p className="py-6 text-sm leading-relaxed text-muted-foreground">
          Nothing is ranked {region} yet — the order builds up as readers open
          stories.
        </p>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {items.map((item, index) => {
            const views = item.views_count > 0 ? formatCount(item.views_count) : "";
            const date = formatDate(item.published_at, "medium");
            const title = cleanText(item.title);

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
                    <CategoryMark category={categoryKey(item.category)}>{item.category}</CategoryMark>
                    <span className="mt-1.5 block font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                      {title}
                    </span>
                    {(views || date) && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {views && <span className="tabular-nums">{views} reads</span>}
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

export default async function TrendingPage() {
  const trendingData = await getTrending();

  const cambodia = [...(trendingData.cambodia || [])].sort(byViews);
  const world = [...(trendingData.world || [])].sort(byViews);
  const all = dedupe([...cambodia, ...world]).sort(byViews);

  const lead = all[0];
  const follow = all.slice(1, 5);
  const leadViews = lead && lead.views_count > 0 ? formatCount(lead.views_count) : "";
  const leadDate = lead ? formatDate(lead.published_at, "medium") : "";

  /* Editor's picks only earn a block when they add a story the rails are not
     already showing; the live feed repeats the top two, so it stays hidden. */
  const shown = new Set(all.map((item) => item.id));
  const editorPicks = (trendingData.editor_picks || []).filter((item) => !shown.has(item.id));

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Trending", href: "/trending" }]}
      badge={
        <Badge variant="secondary" size="sm" className="gap-1.5">
          <TrendingUp size={14} aria-hidden="true" />
          Reader engagement
        </Badge>
      }
      title="Trending & Most Read"
      description="Ranked by what readers actually opened — recent views with a time decay applied, for Cambodia and the world. No manufactured virality and no inflated counts: a story with no readings simply shows no figure."
    >
      {!lead && (
        <p className="py-12 text-sm leading-relaxed text-muted-foreground">
          No stories have been read yet today, so there is nothing to rank. The
          order appears as soon as readers start opening stories.
        </p>
      )}

      {lead && (
        <section className="border-b border-border pb-10">
          <SectionHeader label="Top of the ranking" title="Read most, right now" />

          <article className="group grid gap-6 sm:grid-cols-2 sm:gap-8">
            <Link href={lead.url} aria-label={cleanText(lead.title)} className="block">
              <Photo
                src={lead.hero_image_url}
                alt={cleanText(lead.title)}
                ratio="3/2"
                radius="lg"
                priority
              />
            </Link>

            <div className="flex flex-col justify-center gap-3">
              <CategoryMark category={categoryKey(lead.category)} tone="dot">
                {lead.category}
              </CategoryMark>

              <h2 className="font-display text-2xl leading-[1.15] tracking-tight text-foreground sm:text-3xl">
                <Link href={lead.url} className="transition-colors hover:text-accent">
                  {cleanText(lead.title)}
                </Link>
              </h2>

              {(leadViews || leadDate) && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {leadViews && <span className="tabular-nums">{leadViews} reads</span>}
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
                return (
                  <Reveal as="li" key={item.id} index={index}>
                    <Link
                      href={item.url}
                      className="group flex items-baseline gap-4 py-3.5"
                    >
                      <span className="w-5 shrink-0 font-display text-base leading-none text-border-strong tabular-nums">
                        {index + 2}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                        {cleanText(item.title)}
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
          <RankedRail heading="Cambodia" region="in Cambodia" items={cambodia} />
          <RankedRail heading="Worldwide" region="worldwide" items={world} />
        </section>
      )}

      {editorPicks.length > 0 && (
        <section className="pt-12">
          <SectionHeader
            label="Editor’s picks"
            title="Chosen by the desk, not counted"
            description="Stories put forward by hand, outside the engagement ranking."
          />
          <ul className="divide-y divide-border border-y border-border">
            {editorPicks.map((item, index) => (
              <Reveal as="li" key={item.id} index={index}>
                <Link href={item.url} className="group flex items-baseline gap-4 py-4">
                  <span className="min-w-0 flex-1">
                    <CategoryMark category={categoryKey(item.category)}>
                      {item.category}
                    </CategoryMark>
                    <span className="mt-1.5 block text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                      {cleanText(item.title)}
                    </span>
                  </span>
                  {item.views_count > 0 && (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatCount(item.views_count)} reads
                    </span>
                  )}
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}
    </PublicPageShell>
  );
}
