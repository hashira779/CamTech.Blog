import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, Compass } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getDiscoveries } from "@/lib/api";

export const metadata: Metadata = {
  title: "Visual Discoveries | Daily Discovery",
  description:
    "How the world actually works: from the quantum relativity behind your smartphone GPS to the underwater fiber optics that carry the internet.",
};

export const revalidate = 60;

const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors";
const CHIP_ACTIVE =
  "border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500 dark:text-slate-950";
const CHIP_IDLE =
  "border-slate-300 text-slate-600 hover:border-teal-500 hover:text-teal-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-400";

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

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Visual Discoveries", href: "/discover" }]}
      badge={
        <Badge variant="info" size="sm" className="gap-1">
          <Compass size={12} />
          How things work
        </Badge>
      }
      title="Visual Discoveries"
      description="How the world actually works — from the quantum relativity behind your smartphone GPS to the undersea fiber that carries the internet. Explainers are drafted by the AI newsroom and published after editorial review."
    >
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/discover"
            className={`${CHIP_BASE} ${!activeCategory ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            All
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
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={
            activeCategory
              ? `No discoveries in “${activeCategory}” yet`
              : "No discoveries published yet"
          }
          description="Visual explanations are drafted by the AI newsroom and published automatically after review. New topics appear here as soon as they go live."
          actionLabel="Search explanations"
          actionHref="/search?q=how+does"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((disc) => (
            <Link key={disc.id} href={`/discover/${disc.slug}`} className="group block">
              <article className="hover-lift flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:border-teal-500/50 dark:border-slate-800 dark:bg-slate-900">
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {disc.hero_image_url ? (
                    <img
                      src={disc.hero_image_url}
                      alt={disc.hero_image_alt || disc.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Compass className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {disc.category && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {disc.category}
                    </span>
                  )}
                  <h3 className="text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                    {disc.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {disc.intro}
                  </p>
                  <div className="mt-auto flex items-center pt-3 text-xs font-medium text-slate-700 transition-colors group-hover:text-teal-600 dark:text-slate-300 dark:group-hover:text-teal-400">
                    View interactive diagram
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </PublicPageShell>
  );
}
