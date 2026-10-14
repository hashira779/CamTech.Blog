import Link from "next/link";
import { Metadata } from "next";
import { TrendingUp, MapPin, Globe2, type LucideIcon } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { getTrending } from "@/lib/api";

export const metadata: Metadata = {
  title: "Trending Analytics | Daily Discovery",
  description:
    "Authentic reader-engagement rankings for Cambodia and the world, based on recent views, shares, saves and time-decay.",
};

export const revalidate = 60;

type TrendItem = {
  id: string;
  url: string;
  title: string;
  category?: string;
  trend_score: number;
  views_count: number;
};

function TrendingList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: TrendItem[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </header>
      <div className="p-3">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-sm text-slate-500 dark:text-slate-400">
            Nothing trending here yet — scores build up as readers view and share
            stories.
          </p>
        ) : (
          <ol className="space-y-1">
            {items.map((item, idx) => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  className="group flex items-start gap-4 rounded-md p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span className="w-6 shrink-0 text-center text-lg font-bold tabular-nums text-slate-300 transition-colors group-hover:text-teal-600 dark:text-slate-600 dark:group-hover:text-teal-400">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    {item.category && (
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {item.category}
                      </span>
                    )}
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 transition-colors group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>Score {item.trend_score.toFixed(1)}</span>
                      <span aria-hidden>•</span>
                      <span>{item.views_count} views</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export default async function TrendingPage() {
  const trendingData = await getTrending();

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Trending", href: "/trending" }]}
      badge={
        <Badge variant="warning" size="sm" className="gap-1">
          <TrendingUp size={12} />
          Live engagement rankings
        </Badge>
      }
      title="Trending Analytics"
      description="Our trending engine ranks stories by authentic reader engagement — recent views, shares, saves and time-decay. No manufactured virality or artificial inflation."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendingList
          title="Trending in Cambodia"
          icon={MapPin}
          items={trendingData.cambodia || []}
        />
        <TrendingList
          title="Trending Worldwide"
          icon={Globe2}
          items={trendingData.world || []}
        />
      </div>
    </PublicPageShell>
  );
}
