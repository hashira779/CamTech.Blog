import Link from "next/link";
import { Metadata } from "next";
import { Globe2, Clock, Newspaper } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getArticles, getTrending } from "@/lib/api";
import { NewsCard } from "@/components/news/NewsCard";
import { AdSlot } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "World News | Daily Discovery",
  description:
    "Global perspectives on geopolitics, international markets, and the major events reshaping our world.",
};

export const revalidate = 60;

export default async function WorldNewsPage() {
  const [{ items }, trending] = await Promise.all([
    getArticles({ country: "WORLD", limit: 20 }),
    getTrending(),
  ]);
  const featuredArticles = items.slice(0, 2);
  const latestArticles = items.slice(2, 10);
  const topInsights =
    trending.world?.length > 0
      ? trending.world.slice(0, 4)
      : items.slice(10, 14);

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "World News", href: "/world" }]}
      badge={
        <Badge variant="info" size="sm" className="gap-1">
          <Globe2 size={12} />
          Global
        </Badge>
      }
      title="World News"
      description="Global perspectives on geopolitics, international markets, and major breaking events reshaping our world."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-10 lg:col-span-8">
          {items.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No world stories published yet"
              description="International reporting is drafted by the newsroom and appears here as soon as it clears review."
              actionLabel="Search the archive"
              actionHref="/search?q=world"
            />
          ) : (
            <>
              {featuredArticles.length > 0 && (
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {featuredArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </section>
              )}

              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                  <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Latest Updates
                  </h2>
                </div>

                {latestArticles.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
                    More stories are scheduled to publish soon.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {latestArticles.map((article) => {
                      const href = `/world/news/${article.slug}`;
                      return (
                        <article
                          key={article.id}
                          className="group grid grid-cols-1 gap-5 py-6 first:pt-0 sm:grid-cols-3"
                        >
                          <Link
                            href={href}
                            className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-100 aspect-[4/3] sm:col-span-1 dark:border-slate-800 dark:bg-slate-800"
                          >
                            <img
                              src={
                                article.hero_image_url ||
                                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
                              }
                              alt={article.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          </Link>
                          <div className="flex flex-col justify-center sm:col-span-2">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                              {article.category?.name || "Global"}
                            </span>
                            <Link href={href}>
                              <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                                {article.title}
                              </h3>
                            </Link>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                              {article.summary}
                            </p>
                            <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                              By{" "}
                              {article.author?.name ||
                                article.primary_source?.name ||
                                "Editor"}{" "}
                              •{" "}
                              {article.published_at
                                ? new Date(article.published_at).toLocaleDateString()
                                : "Today"}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="mb-2 block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Advertisement
              </span>
              <AdSlot slot="HOME_TOP" />
            </div>

            {topInsights.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  Global Insights
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topInsights.map((art: any) => {
                    const insightHref = art.url || `/world/news/${art.slug}`;
                    const catName =
                      typeof art.category === "object"
                        ? art.category?.name
                        : art.category || "Geopolitics";
                    return (
                      <Link
                        key={art.id}
                        href={insightHref}
                        className="group block py-4 first:pt-0 last:pb-0"
                      >
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          {catName}
                        </span>
                        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 transition-colors group-hover:text-teal-600 dark:text-slate-200 dark:group-hover:text-teal-400">
                          {art.title}
                        </h4>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="mb-2 block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Advertisement
              </span>
              <AdSlot slot="SIDEBAR" />
            </div>
          </div>
        </aside>
      </div>
    </PublicPageShell>
  );
}
