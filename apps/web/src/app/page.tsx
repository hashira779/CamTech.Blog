import Link from "next/link";
import { ArrowRight, Compass, HelpCircle } from "lucide-react";
import {
  getArticles,
  getDailyQuiz,
  getDiscoveries,
  getPlaces,
  getTools,
  getTrending,
} from "@/lib/api";
import type { Article } from "@/types";
import { AdSlot } from "@/components/ads/AdSlot";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { NewsCard } from "@/components/shared/news-card";
import { Photo } from "@/components/ui/photo";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { formatCount, formatDate, cleanText } from "@/lib/format";

export const revalidate = 60;

/**
 * Front page.
 *
 * Three things changed beyond the styling. The lead story used to be labelled
 * "Breaking" whatever it was; that mark now only appears when the article has
 * `is_breaking`. Both image slots used to fall back to a hardcoded Unsplash
 * photograph, so a story without a verified picture still showed one — those
 * fallbacks are gone, and the card drops to a typographic treatment instead.
 * And the "reads" figures are the real `views_count`, hidden when they are zero
 * rather than replaced with "Trending story".
 */
function articleHref(article: Pick<Article, "slug" | "country">) {
  return article.country === "KH"
    ? `/cambodia/news/${article.slug}`
    : `/world/news/${article.slug}`;
}

function dedupe(articles: Article[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });
}

export default async function HomePage() {
  const [cambodia, world, trending, discoveryFeed, placeFeed, quiz, tools] = await Promise.all([
    getArticles({ country: "KH", limit: 8 }),
    getArticles({ limit: 10 }),
    getTrending(),
    getDiscoveries(),
    getPlaces({ limit: 8 }),
    getDailyQuiz(),
    getTools(),
  ]);

  const feed = dedupe([...(cambodia.items || []), ...(world.items || [])]).slice(0, 10);
  const lead = feed[0];
  const features = feed.slice(1, 3);
  const latest = feed.slice(3, 9);

  const mostRead = [
    ...(trending?.cambodia || []),
    ...(trending?.world || []),
  ]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5);

  const discoveries = (discoveryFeed?.items || []).slice(0, 3);
  const places = (placeFeed?.items || []).filter((place) => place.hero_image_url).slice(0, 4);
  const popularTools = [...(tools || [])]
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 4);

  const hasContent = Boolean(lead);

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* The masthead is the brand, not a page title; the document still needs one. */}
      <h1 className="sr-only">
        Today&rsquo;s briefing — Cambodia and world news, travel and discoveries
      </h1>

      {/* ── Lead ──────────────────────────────────────────────────────────── */}
      {hasContent && (
        <Section className="pb-0 pt-8 sm:pt-10">
          <Container>
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-8">
                <NewsCard article={lead} variant="hero" priority showSummary />
              </div>

              <div className="flex flex-col gap-6 lg:col-span-4">
                <p className="section-label text-muted-foreground">Also today</p>
                {features.map((article) => (
                  <NewsCard key={article.id} article={article} variant="compact" />
                ))}
                <Link
                  href="/trending"
                  className="group mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  Today&rsquo;s full briefing
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      )}

      <Container>
        <AdSlot slot="HOME_TOP" />
      </Container>

      {/* ── Latest + most read ────────────────────────────────────────────── */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <SectionHeader
                label="News"
                title="Latest reporting"
                actionHref="/cambodia"
                actionLabel="All Cambodia coverage"
              />

              <div className="grid gap-6 sm:grid-cols-2">
                {latest.map((article) => (
                  <NewsCard key={article.id} article={article} variant="standard" />
                ))}
              </div>

              {!hasContent && (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No stories are published right now. Check the briefing again shortly.
                </p>
              )}
            </div>

            <aside className="lg:col-span-4">
              <SectionHeader label="Most read" title="What readers opened" />

              <ol className="divide-y divide-border">
                {mostRead.map((item, index) => {
                  const views = item.views_count > 0 ? formatCount(item.views_count) : null;
                  const published = formatDate(item.published_at, "medium");
                  return (
                    <li key={`${item.id}-${index}`}>
                      <Link
                        href={item.url || articleHref({ slug: item.slug, country: "KH" })}
                        className="group flex items-start gap-4 py-4"
                      >
                        <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <CategoryMark category={categoryKey(item.category)}>
                            {item.category}
                          </CategoryMark>
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
                })}
              </ol>

              {mostRead.length === 0 && (
                <p className="py-8 text-sm text-muted-foreground">
                  Reading figures appear once stories have been opened.
                </p>
              )}

              <AdSlot slot="SIDEBAR" />
            </aside>
          </div>
        </Container>
      </Section>

      {/* ── Travel ───────────────────────────────────────────────────────── */}
      {places.length > 0 && (
        <div className="border-y border-border bg-surface-muted/50">
          <Section>
            <Container>
              <SectionHeader
                label="Travel"
                title="Places worth planning around"
                description="Only places with a photograph we could attribute to the location itself appear here."
                actionHref="/travel"
                actionLabel="All guides"
              />

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {places.map((place) => (
                  <Link
                    key={place.id}
                    href={`/travel/place/${place.slug}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
                  >
                    <Photo
                      src={place.hero_image_url}
                      alt={place.name}
                      ratio="4/3"
                      radius="none"
                      showCredit={false}
                    />
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      <CategoryMark category="travel" tone="dot">
                        {place.place_type.toLowerCase().replace(/_/g, " ")}
                      </CategoryMark>
                      <h3 className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                        {place.name}
                      </h3>
                      {place.destination?.name && (
                        <p className="text-xs text-muted-foreground">{place.destination.name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </Section>
        </div>
      )}

      {/* ── Discover ─────────────────────────────────────────────────────── */}
      {discoveries.length > 0 && (
        <Section>
          <Container>
            <SectionHeader
              label="Discover"
              title="Explained, not just reported"
              actionHref="/discover"
              actionLabel="All explainers"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {discoveries.map((item) => (
                <Link
                  key={item.id}
                  href={`/discover/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
                >
                  <Photo
                    src={item.hero_image_url}
                    alt={item.hero_image_alt || item.title}
                    credit={item.hero_image_credit}
                    ratio="16/9"
                    radius="none"
                  />
                  <div className="flex flex-1 flex-col gap-2.5 p-5">
                    <CategoryMark category={categoryKey(item.category)}>{item.category}</CategoryMark>
                    <h3 className="font-display text-xl leading-snug text-foreground transition-colors group-hover:text-accent">
                      {cleanText(item.title)}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {cleanText(item.intro)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── Quiz + tools ──────────────────────────────────────────────────── */}
      {(quiz || popularTools.length > 0) && (
        <Section className="pt-0">
          <Container>
            <div className="grid gap-6 lg:grid-cols-12">
              {quiz && (
                <div className="lg:col-span-7">
                  <Link
                    href={`/quiz/${quiz.slug}`}
                    className="group flex h-full flex-col justify-between gap-6 rounded-lg border border-border bg-card p-6 shadow-xs hover-lift hover:border-border-strong sm:p-8"
                  >
                    <div>
                      <CategoryMark category="quiz" tone="dot">
                        Daily quiz
                      </CategoryMark>
                      <h2 className="mt-3 max-w-xl font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
                        {cleanText(quiz.title)}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {cleanText(quiz.description)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <HelpCircle size={14} aria-hidden="true" />
                        {quiz.questions?.length ?? 0} questions
                      </span>
                      {quiz.estimated_minutes > 0 && <span>· about {quiz.estimated_minutes} min</span>}
                      <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-accent">
                        Start
                        <ArrowRight
                          size={15}
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {popularTools.length > 0 && (
                <div className="lg:col-span-5">
                  <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-xs sm:p-8">
                    <CategoryMark category="tools" tone="dot">
                      Tools
                    </CategoryMark>
                    <h2 className="mt-3 font-display text-xl leading-snug tracking-tight text-foreground">
                      Useful today
                    </h2>
                    <ul className="mt-4 divide-y divide-border">
                      {popularTools.map((tool) => (
                        <li key={tool.id}>
                          <Link
                            href={`/tools/${tool.slug}`}
                            className="group flex items-center justify-between gap-3 py-3 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-foreground transition-colors group-hover:text-accent">
                                {tool.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {tool.category.toLowerCase()}
                              </span>
                            </span>
                            {tool.usage_count > 0 && (
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {formatCount(tool.usage_count)} uses
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/tools"
                      className="group mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-accent transition-colors hover:text-foreground"
                    >
                      <Compass size={15} className="transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
                      All tools
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}
