import Link from "next/link";
import { TrendingUp, MapPin, Globe2, Sparkles, ArrowRight } from "lucide-react";
import { getTrending } from "@/lib/api";

export const revalidate = 60;

export default async function TrendingPage() {
  const trendingData = await getTrending();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-950 via-neutral-900 to-indigo-950 text-white space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-400">
          <TrendingUp className="h-4 w-4" />
          <span>Real Time-Decay Metrics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Trending Analytics Board
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
          Our trending engine calculates authentic reader engagement using recent views, shares, saves, and time-decay algorithms. No manufactured virality or artificial inflation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Cambodia Trending List */}
        <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <MapPin className="h-4 w-4" />
            <span>Trending in Cambodia</span>
          </div>

          <div className="space-y-4">
            {trendingData.cambodia.map((item, idx) => (
              <Link
                key={item.id}
                href={item.url}
                className="flex items-start gap-4 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
              >
                <span className="text-3xl font-black text-neutral-200 dark:text-neutral-800 group-hover:text-rose-600 transition-colors">
                  0{idx + 1}
                </span>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1">
                    <span>Score: {item.trend_score.toFixed(1)}</span>
                    <span>•</span>
                    <span>{item.views_count} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* World Trending List */}
        <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Globe2 className="h-4 w-4" />
            <span>Trending Worldwide</span>
          </div>

          <div className="space-y-4">
            {trendingData.world.map((item, idx) => (
              <Link
                key={item.id}
                href={item.url}
                className="flex items-start gap-4 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
              >
                <span className="text-3xl font-black text-neutral-200 dark:text-neutral-800 group-hover:text-indigo-600 transition-colors">
                  0{idx + 1}
                </span>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1">
                    <span>Score: {item.trend_score.toFixed(1)}</span>
                    <span>•</span>
                    <span>{item.views_count} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
