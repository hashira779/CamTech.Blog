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
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { NewsCard } from "@/components/shared/news-card";
import { NewsTicker } from "@/components/layout/NewsTicker";
import { Photo } from "@/components/ui/photo";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { formatCount, formatDate, cleanText } from "@/lib/format";

export const revalidate = 60;

/**
 * Front page.
 *
 * Built the way a printed front page is built: one story sets the tone, a numbered column beside
 * it says what else is in the edition, and everything below earns its place by section. Three
 * things changed beyond the styling in the earlier pass and still hold:
 *
 *   - "Breaking" only appears when the article actually has `is_breaking`.
 *   - No stock photograph stands in for a story without a verified one; the card falls back to a
 *     typographic treatment instead.
 *   - Reading figures are the real `views_count`, hidden at zero rather than padded.
 *
 * What is new: the live rail above the lead, the edition strip that counts what is actually on the
 * page, the "also today" column as an index rather than three more cards, and a travel bento where
 * the strongest photograph gets twice the room. Every number in the edition strip is a length of
 * an array fetched above, so it cannot drift from what renders below it.
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
  const alsoToday = feed.slice(1, 5);
  const latest = feed.slice(5, 11);

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

  const tickerItems = feed.slice(0, 8).map((article) => ({
    id: article.id,
    title: cleanText(article.title),
    href: articleHref(article),
    section: article.category?.name || (article.country === "KH" ? "Cambodia" : "World"),
  }));

  /* Real counts only. An edition strip that says "12 stories" has to mean there are twelve
     stories below it, so the numbers are lengths of the arrays the page actually renders. */
  const edition = [
    { label: "Filed today", value: feed.length },
    { label: "Most read", value: mostRead.length },
    { label: "Explainers", value: discoveries.length },
    { label: "Places with a photo", value: places.length },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* The masthead is the brand, not a page title; the document still needs one. */}
      <h1 className="sr-only">
        Today&rsquo;s briefing — Cambodia and world news, travel and discoveries
      </h1>

      {/* ── Live rail ─────────────────────────────────────────────────────── */}
      {tickerItems.length > 0 && <NewsTicker items={tickerItems} />}

      {/* ── Lead ──────────────────────────────────────────────────────────── */}
      {hasContent && (
        <Section className="pb-0 pt-8 sm:pt-10">
          <Container>
            {edition.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3 text-xs text-muted-foreground">
                <span className="section-label text-accent">The edition</span>
                {edition.map((entry) => (
                  <span key={entry.label} className="tabular-nums">
                    <span className="font-semibold text-foreground">{entry.value}</span>{" "}
                    {entry.label.toLowerCase()}
                  </span>
                ))}
                <span className="ml-auto hidden tabular-nums sm:inline">
                  Updated {formatDate(lead.published_at || lead.created_at, "medium")}
                </span>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-8">
                <NewsCard article={lead} variant="hero" priority showSummary />
              </div>

              {/* Also today, as an index. Three more cards in a sidebar reads as a grid; a
                  numbered list with a growing edge tick reads as "the rest of the page". */}
              <div className="flex flex-col lg:col-span-4">
                <p className="section-label mb-3 text-muted-foreground">Also in this edition</p>
                <ol className="divide-y divide-border border-y border-border">
                  {alsoToday.map((article, index) => (
                    <Reveal as="li" key={article.id} index={index} variant="left" immediate>
                      <Link
                        href={articleHref(article)}
                        className="group flex items-start gap-4 py-4 pr-1 pl-4"
                      >
                        <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums transition-colors group-hover:text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="edge-tick min-w-0 flex-1">
                          <CategoryMark category={categoryKey(article.category?.name)}>
                            {article.category?.name ||
                              (article.country === "KH" ? "Cambodia" : "World")}
                          </CategoryMark>
                          <span className="title-sweep mt-1.5 block text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                            {cleanText(article.title)}
                          </span>
                          <span className="mt-1.5 block text-xs text-muted-foreground">
                            {formatDate(article.published_at || article.created_at, "short")}
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </ol>

                <Link
                  href="/trending"
                  className="group mt-5 inline-flex items-center gap-1.5 self-start text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  Today&rsquo;s full briefing
                  <ArrowRight size={15} className="link-nudge" aria-hidden="true" />
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
                category="news"
                title="Latest reporting"
                actionHref="/cambodia"
                actionLabel="All Cambodia coverage"
              />

              <div className="grid gap-6 sm:grid-cols-2">
                {latest.map((article, index) => (
                  <Reveal key={article.id} index={index}>
                    <NewsCard article={article} variant="standard" />
                  </Reveal>
                ))}
              </div>

              {!hasContent && (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No stories are published right now. Check the briefing again shortly.
                </p>
              )}
            </div>

            <aside className="lg:col-span-4">
              <SectionHeader label="Most read" category="trending" title="What readers opened" />

              <ol className="divide-y divide-border border-y border-border">
                {mostRead.map((item, index) => {
                  const views = item.views_count > 0 ? formatCount(item.views_count) : null;
                  const published = formatDate(item.published_at, "medium");
                  return (
                    <Reveal as="li" key={`${item.id}-${index}`} index={index} variant="left">
                      <Link
                        href={item.url || articleHref({ slug: item.slug, country: "KH" })}
                        className="group flex items-start gap-4 py-4 pl-4"
                      >
                        <span className="w-6 shrink-0 pt-0.5 font-display text-xl leading-none text-border-strong tabular-nums transition-colors group-hover:text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="edge-tick min-w-0 flex-1">
                          <CategoryMark category={categoryKey(item.category)}>
                            {item.category}
                          </CategoryMark>
                          <span className="title-sweep mt-1.5 block text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
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
                    </Reveal>
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
                category="travel"
                title="Places worth planning around"
                description="Only places with a photograph we could attribute to the location itself appear here."
                actionHref="/travel"
                actionLabel="All guides"
              />

              {/* Not a row of four identical tiles. The place with the strongest photograph takes
                  the wide slot and carries its name over the picture; the rest stack beside it as
                  thumb-and-title rows. Same four places, one clear order. */}
              <div className="grid gap-5 lg:grid-cols-12">
                {places[0] && (
                  <Reveal className="lg:col-span-7">
                    <Link
                      href={`/travel/place/${places[0].slug}`}
                      className="group relative flex h-full min-h-[18rem] flex-col justify-end overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong lg:min-h-[24rem]"
                    >
                      <Photo
                        src={places[0].hero_image_url}
                        alt={places[0].name}
                        ratio="none"
                        radius="none"
                        showCredit={false}
                        className="absolute inset-0 h-full w-full"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
                      />
                      <span className="relative flex flex-col gap-2 p-5 sm:p-6">
                        <CategoryMark
                          category="travel"
                          tone="chip"
                          className="self-start bg-white/90 text-neutral-900"
                        >
                          {places[0].place_type.toLowerCase().replace(/_/g, " ")}
                        </CategoryMark>
                        <span className="title-sweep max-w-lg font-display text-2xl leading-snug text-white sm:text-3xl">
                          {places[0].name}
                        </span>
                        {places[0].destination?.name && (
                          <span className="text-sm text-white/75">{places[0].destination.name}</span>
                        )}
                      </span>
                    </Link>
                  </Reveal>
                )}

                <div className="flex flex-col gap-5 lg:col-span-5">
                  {places.slice(1).map((place, index) => (
                    <Reveal key={place.id} index={index + 1} className="h-full">
                      <Link
                        href={`/travel/place/${place.slug}`}
                        className="group flex h-full items-center gap-4 overflow-hidden rounded-lg border border-border bg-card p-3 shadow-xs hover-lift hover:border-border-strong"
                      >
                        <Photo
                          src={place.hero_image_url}
                          alt={place.name}
                          ratio="4/3"
                          radius="md"
                          compact
                          showCredit={false}
                          className="h-20 w-24 shrink-0 sm:h-24 sm:w-32"
                        />
                        <span className="min-w-0 flex-1">
                          <CategoryMark category="travel" tone="dot">
                            {place.place_type.toLowerCase().replace(/_/g, " ")}
                          </CategoryMark>
                          <span className="title-sweep mt-1 block font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                            {place.name}
                          </span>
                          {place.destination?.name && (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {place.destination.name}
                            </span>
                          )}
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
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
              category="discover"
              title="Explained, not just reported"
              actionHref="/discover"
              actionLabel="All explainers"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {discoveries.map((item, index) => (
                <Reveal key={item.id} index={index} className="h-full">
                  <Link
                    href={`/discover/${item.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
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
                      <h3 className="title-sweep font-display text-xl leading-snug text-foreground transition-colors group-hover:text-accent">
                        {cleanText(item.title)}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {cleanText(item.intro)}
                      </p>
                    </div>
                  </Link>
                </Reveal>
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
                    className="group hover-sheen flex h-full flex-col justify-between gap-6 rounded-lg border border-border bg-card p-6 shadow-xs hover-lift hover:border-border-strong sm:p-8"
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
                        <ArrowRight size={15} className="link-nudge" aria-hidden="true" />
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
                            className="group flex items-center justify-between gap-3 py-3 pl-4 text-sm"
                          >
                            <span className="edge-tick min-w-0 py-0.5">
                              <span className="title-sweep block truncate font-medium text-foreground transition-colors group-hover:text-accent">
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
