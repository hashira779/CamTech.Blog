import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, Compass } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getDiscoveries } from "@/lib/api";
import type { Discovery } from "@/types";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { Byline } from "@/components/ui/byline";
import { cleanText, formatDate, formatReadingTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Visual Discoveries",
  description:
    "How the world actually works: from the quantum relativity behind your smartphone GPS to the underwater fiber optics that carry the internet.",
};

export const revalidate = 60;

const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors";
const CHIP_ACTIVE = "border-accent bg-accent text-accent-foreground";
const CHIP_IDLE =
  "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground";

/**
 * The card used to say "View interactive diagram" on every explainer. Only some
 * of them have one, so the affordance is now the honest one: read the explainer.
 */
function ExplainerCard({ item }: { item: Discovery }) {
  const title = cleanText(item.title);
  const intro = cleanText(item.intro);

  return (
    <Link
      href={`/discover/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
      aria-label={title}
    >
      <Photo zoom
        src={item.hero_image_url}
        alt={item.hero_image_alt || title}
        credit={item.hero_image_credit}
        ratio="16/9"
        radius="none"
      />
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <CategoryMark category={categoryKey(item.category)}>{item.category}</CategoryMark>
        <h3 className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
          {title}
        </h3>
        {intro && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{intro}</p>
        )}
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
          <Byline
            date={item.published_at}
            readingTime={formatReadingTime(item.main_explanation)}
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
            Read the explainer
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="link-nudge"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LeadExplainer({ item }: { item: Discovery }) {
  const title = cleanText(item.title);
  const intro = cleanText(item.intro);

  return (
    <article className="group grid gap-6 border-b border-border pb-10 sm:grid-cols-2 sm:gap-8">
      <Link href={`/discover/${item.slug}`} aria-label={title} className="block">
        <Photo zoom
          src={item.hero_image_url}
          alt={item.hero_image_alt || title}
          credit={item.hero_image_credit}
          ratio="3/2"
          radius="lg"
        />
      </Link>

      <div className="flex flex-col justify-center gap-3">
        <CategoryMark category={categoryKey(item.category)} tone="dot">
          {item.category}
        </CategoryMark>

        <h2 className="font-display text-2xl leading-[1.15] tracking-tight text-foreground sm:text-3xl">
          <Link href={`/discover/${item.slug}`} className="transition-colors hover:text-accent">
            {title}
          </Link>
        </h2>

        {intro && (
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{intro}</p>
        )}

        <div className="pt-1">
          <Byline
            date={item.published_at}
            dateStyle="medium"
            readingTime={formatReadingTime(item.main_explanation)}
            views={item.views_count > 0 ? item.views_count : null}
            size="md"
          />
        </div>

        <Link
          href={`/discover/${item.slug}`}
          className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
        >
          Read the explainer
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="link-nudge"
          />
        </Link>
      </div>
    </article>
  );
}

export default async function DiscoverHubPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolved = await searchParams;
  const activeCategory = resolved.category || "";
  const { items } = await getDiscoveries(activeCategory || undefined);
  const { items: allItems } = activeCategory ? await getDiscoveries() : { items };

  const categories = Array.from(
    new Set(allItems.map((d) => d.category).filter(Boolean))
  ).slice(0, 12);

  const [lead, ...rest] = items;

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Visual Discoveries", href: "/discover" }]}
      badge={
        <Badge variant="secondary" size="sm" className="gap-1.5">
          <Compass size={14} aria-hidden="true" />
          How things work
        </Badge>
      }
      title="Visual Discoveries"
      description="How the world actually works — from the relativistic correction inside your smartphone GPS to the undersea fiber that carries the internet. Explainers are drafted by the AI newsroom and published after editorial review."
    >
      {categories.length > 0 && (
        <nav
          aria-label="Explainer topics"
          className="mb-8 flex flex-wrap items-center gap-2"
        >
          <Link href="/discover" className={`${CHIP_BASE} ${!activeCategory ? CHIP_ACTIVE : CHIP_IDLE}`}>
            All topics
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/discover?category=${encodeURIComponent(cat)}`}
              className={`${CHIP_BASE} ${activeCategory === cat ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {cat}
            </Link>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={
            activeCategory
              ? `No explainers in “${activeCategory}” yet`
              : "No explainers published yet"
          }
          description="Visual explanations are drafted by the AI newsroom and published automatically after review. New topics appear here as soon as they go live."
          actionLabel="Search explanations"
          actionHref="/search?q=how+does"
        />
      ) : (
        <>
          <SectionHeader
            label="Discover"
            title={activeCategory ? `Everything in ${activeCategory}` : "Latest explainers"}
            description={
              activeCategory
                ? `${items.length} ${items.length === 1 ? "explainer" : "explainers"} filed under this topic.`
                : `${items.length} explainers published so far, new ones landing as editorial review clears them.`
            }
            className="mb-6 sm:mb-8"
          />

          {lead && <LeadExplainer item={lead} />}

          {rest.length > 0 && (
            <div className="grid gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((disc, index) => (
                <Reveal key={disc.id} index={index} className="h-full">
                  <ExplainerCard item={disc} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </PublicPageShell>
  );
}
