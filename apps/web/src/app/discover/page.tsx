import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getDiscoveries } from "@/lib/api";

export const revalidate = 60;

export default async function DiscoverHubPage() {
  const { items } = await getDiscoveries();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950 via-neutral-900 to-rose-950 text-white space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span>Curiosity & Science Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Visual Discoveries
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
          How the world actually works: from the quantum relativity in your smartphone GPS to underwater internet fiber optics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((disc) => (
          <Link
            key={disc.id}
            href={`/discover/${disc.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img
                src={disc.hero_image_url}
                alt={disc.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                {disc.category}
              </div>
            </div>
            <div className="p-6 sm:p-8 space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                {disc.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                {disc.intro}
              </p>
              <div className="pt-4 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 border-t border-neutral-100 dark:border-neutral-800">
                <span>View Full Interactive Diagram</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
