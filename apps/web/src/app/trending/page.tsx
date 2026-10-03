import Link from "next/link";
import { TrendingUp, MapPin, Globe2 } from "lucide-react";
import { getTrending } from "@/lib/api";

export const revalidate = 60;

export default async function TrendingPage() {
  const trendingData = await getTrending();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto text-center border-b-[1px] border-neutral-300 pb-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-normal font-serif text-neutral-900 tracking-tight">
          Trending Analytics
        </h1>
        <p className="mt-4 text-neutral-500 font-sans text-sm leading-relaxed">
          Our trending engine calculates authentic reader engagement using recent views, shares, saves, and time-decay algorithms. No manufactured virality or artificial inflation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Cambodia Trending List */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 border-b-[1px] border-neutral-900 pb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-900">
            <MapPin className="h-4 w-4" />
            <span>Trending in Cambodia</span>
          </div>

          <div className="space-y-6 divide-y-[1px] divide-neutral-200">
            {trendingData.cambodia.map((item, idx) => (
              <Link
                key={item.id}
                href={item.url}
                className="flex items-start gap-6 pt-6 first:pt-0 group"
              >
                <span className="text-4xl font-serif font-normal text-neutral-300 group-hover:text-neutral-900 transition-colors">
                  0{idx + 1}
                </span>
                <div className="space-y-2 flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 group-hover:text-neutral-500 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 font-serif italic pt-1">
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
        <div className="space-y-8">
          <div className="flex items-center gap-2 border-b-[1px] border-neutral-900 pb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-900">
            <Globe2 className="h-4 w-4" />
            <span>Trending Worldwide</span>
          </div>

          <div className="space-y-6 divide-y-[1px] divide-neutral-200">
            {trendingData.world.map((item, idx) => (
              <Link
                key={item.id}
                href={item.url}
                className="flex items-start gap-6 pt-6 first:pt-0 group"
              >
                <span className="text-4xl font-serif font-normal text-neutral-300 group-hover:text-neutral-900 transition-colors">
                  0{idx + 1}
                </span>
                <div className="space-y-2 flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 group-hover:text-neutral-500 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 font-serif italic pt-1">
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
