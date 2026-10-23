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
import { getArticles, getTrending } from "@/lib/api";
import { cleanText, formatCount, formatDate } from "@/lib/format";
import type { TrendingResponse } from "@/types";

type RailItem = TrendingResponse["cambodia"][number];

export interface SectionFrontProps {
  /** API country filter: "KH" or "WORLD". */
  country: "KH" | "WORLD";
  /** Which trending list feeds the "Most read" rail. */
  trendingKey: "cambodia" | "world";
  /** Base path for story links when a trending row has no URL. */
  storyBase: "/cambodia/news" | "/world/news";
  category: CategoryKey;
  eyebrow: string;
  title: string;
  description: string;
  secondaryTitle: string;
  latestTitle: string;
  attribution: string;
  emptyTitle: string;
  emptyDescription: string;
  emptySearch: string;
}

/**
 * A news section front (/cambodia, /world).
 *
 * The two routes were the same 200-line page copied twice, so a fix to one
 * never reached the other. One layout now serves both: the shared page header,
 * then an 8/4 grid — lead story, two features and a ranked latest list on the
 * left, a sticky "Most read" rail on the right.
 *
 * The lead card sits in its own wrapper on purpose. The feature variant is
 * `h-full` so it can fill grid cells; placed straight in the column it took the
 * column's full height and pushed everything after it out of the column, where
 * the footer then drew over it.
 */
export async function SectionFront({
  country,
  trendingKey,
  storyBase,
  category,
  eyebrow,
  title,
  description,
  secondaryTitle,
  latestTitle,
  attribution,
  emptyTitle,
  emptyDescription,
  emptySearch,
}: SectionFrontProps) {
  const [{ items, total }, trending] = await Promise.all([
    getArticles({ country, limit: 20 }),
    getTrending(),
  ]);

  const lead = items[0];
  const secondary = items.slice(1, 3);
  const latest = items.slice(3, 14);
  const mostRead = (trending[trendingKey] || []).slice(0, 6);

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
            {total > 0 && <span className="tabular-nums">{formatCount(total)} stories in this section</span>}
            <Link
              href="/sources"
              className="group inline-flex items-center gap-1.5 font-medium text-accent transition-colors hover:text-foreground"
            >
              How we attribute
              <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
            </Link>
          </>
        }
      />

      {items.length === 0 ? (
        <Section>
          <Container>
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              actionLabel="Search the archive"
              actionHref={`/search?q=${encodeURIComponent(emptySearch)}`}
            />
          </Container>
        </Section>
      ) : (
        <Container className="pb-16 pt-10 sm:pt-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            {/* ── Lead, features, latest ──────────────────────────────────── */}
            <div className="min-w-0 lg:col-span-8">
              <div className="scroll-zoom">
                <NewsCard article={lead} variant="feature" priority showSummary />
              </div>

              <AdSlot slot="HOME_TOP" />

              {secondary.length > 0 && (
                <div className="mt-12">
                  <SectionHeader label="In this issue" title={secondaryTitle} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    {secondary.map((article, index) => (
                      <Reveal key={article.id} index={index} className="h-full">
                        <NewsCard article={article} variant="standard" />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {latest.length > 0 && (
                <div className="mt-12">
                  <SectionHeader label="Latest" title={latestTitle} />
                  <div>
                    {latest.map((article, index) => (
                      <Reveal key={article.id} index={index}>
                        <NewsCard article={article} variant="list" rank={index + 1} />
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
                  <SectionHeader label="Most read" title="Opened most often" />
                  {mostRead.length > 0 ? (
                    <Reveal as="ol" variant="left" className="divide-y divide-border">
                      {mostRead.map((item, index) => (
                        <RailRow key={`${item.id}-${index}`} item={item} rank={index + 1} storyBase={storyBase} />
                      ))}
                    </Reveal>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Reading figures appear once stories have been opened.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
                  <p className="section-label text-muted-foreground">Attribution</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{attribution}</p>
                  <Link
                    href="/sources"
                    className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                  >
                    Source registry
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

/** Trending rows are a narrower API shape than `Article`, so they are not cards. */
function RailRow({ item, rank, storyBase }: { item: RailItem; rank: number; storyBase: string }) {
  const href = item.url || `${storyBase}/${item.slug}`;
  const views = item.views_count > 0 ? formatCount(item.views_count) : null;
  const published = formatDate(item.published_at, "medium");

  return (
    <li>
      <Link href={href} className="group flex items-start gap-4 py-4">
        <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <CategoryMark category={categoryKey(item.category)}>{item.category}</CategoryMark>
          <span className="mt-1.5 block text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
            {cleanText(item.title)}
          </span>
          {(views || published) && (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {views && <span>{views} reads</span>}
              {views && published && <span aria-hidden="true">·</span>}
              {published && <span>{published}</span>}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
