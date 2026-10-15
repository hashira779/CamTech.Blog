import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container, Section } from "@/components/ui/container";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { NewsCard } from "@/components/shared/news-card";
import { SectionHeader } from "@/components/ui/section-header";
import { getArticles, getTrending } from "@/lib/api";
import { cleanText, formatCount, formatDate } from "@/lib/format";
import type { TrendingResponse } from "@/types";

export const metadata: Metadata = {
  title: "Cambodia & Regional News",
  description:
    "In-depth reporting, verified government updates, economy, infrastructure and technology across Phnom Penh and every province.",
};

export const revalidate = 60;

type RailItem = TrendingResponse["cambodia"][number];

/**
 * Cambodia section front.
 *
 * The old page hand-rolled its own row markup and filled a missing
 * `hero_image_url` with a hardcoded Unsplash photograph, then signed stories
 * "By … Editor" and dated them "Today" when the API had neither. Every story
 * now goes through `NewsCard`, which drops to a typographic card when there is
 * no image and renders nothing when there is no author or date.
 */
export default async function CambodiaNewsPage() {
  const [{ items, total }, trending] = await Promise.all([
    getArticles({ country: "KH", limit: 20 }),
    getTrending(),
  ]);

  const lead = items[0];
  const secondary = items.slice(1, 3);
  const latest = items.slice(3, 14);
  const mostRead = (trending.cambodia || []).slice(0, 6);

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* ── Section masthead ──────────────────────────────────────────────── */}
      <Container className="pt-8 sm:pt-12">
        <Breadcrumbs items={[{ label: "Cambodia & regional" }]} />

        <div className="mt-6 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <CategoryMark category="news" tone="dot">
              Cambodia
            </CategoryMark>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Cambodia &amp; regional
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Reporting from Phnom Penh and the provinces. Each story is summarised here and
              credited to the publisher it came from, with a link back to the original.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {total > 0 && (
              <span className="tabular-nums">{formatCount(total)} stories in this section</span>
            )}
            <Link
              href="/sources"
              className="group inline-flex items-center gap-1.5 font-medium text-accent transition-colors hover:text-foreground"
            >
              How we attribute
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </Container>

      {items.length === 0 ? (
        <Section>
          <Container>
            <EmptyState
              title="No Cambodia stories published yet"
              description="Reporting appears here as soon as the first stories clear review."
              actionLabel="Search the archive"
              actionHref="/search?q=Cambodia"
            />
          </Container>
        </Section>
      ) : (
        <>
          <Container className="pb-4 pt-10 sm:pt-12">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
              {/* ── Lead, features, latest ────────────────────────────────── */}
              <div className="lg:col-span-8">
                <NewsCard article={lead} variant="feature" priority showSummary />

                <AdSlot slot="HOME_TOP" />

                {secondary.length > 0 && (
                  <div className="mt-10">
                    <SectionHeader label="In this issue" title="More from Cambodia" />
                    <div className="grid gap-6 sm:grid-cols-2">
                      {secondary.map((article) => (
                        <NewsCard key={article.id} article={article} variant="standard" />
                      ))}
                    </div>
                  </div>
                )}

                {latest.length > 0 && (
                  <div className="mt-12">
                    <SectionHeader label="Latest" title="Lately from the provinces" />
                    <div>
                      {latest.map((article, index) => (
                        <NewsCard
                          key={article.id}
                          article={article}
                          variant="list"
                          rank={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sidebar rail ──────────────────────────────────────────── */}
              <aside className="lg:col-span-4">
                <div className="space-y-10 lg:sticky lg:top-8">
                  <div>
                    <SectionHeader label="Most read" title="Opened most often" />

                    {mostRead.length > 0 ? (
                      <ol className="divide-y divide-border">
                        {mostRead.map((item, index) => (
                          <RailRow key={`${item.id}-${index}`} item={item} rank={index + 1} />
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Reading figures appear once stories have been opened.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
                    <p className="section-label text-muted-foreground">Attribution</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Cambodia stories are gathered from named publishers and links out to the
                      original report. The feeds we draw on are listed in the source registry.
                    </p>
                    <Link
                      href="/sources"
                      className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                    >
                      Source registry
                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>

                  <AdSlot slot="SIDEBAR" />
                </div>
              </aside>
            </div>
          </Container>
        </>
      )}
    </div>
  );
}

/** Trending rows are a narrower API shape than `Article`, so they are not cards. */
function RailRow({ item, rank }: { item: RailItem; rank: number }) {
  const href = item.url || `/cambodia/news/${item.slug}`;
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
