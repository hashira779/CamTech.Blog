import Link from "next/link";
import { ArrowRight, Compass, HelpCircle, Wrench, TrendingUp, Globe2, MapPin, ShieldCheck, Star } from "lucide-react";
import { getArticles, getTrending, getDiscoveries, getDailyQuiz, getTools, getPlaces, getTrips } from "@/lib/api";
import { HeroStory } from "@/components/news/HeroStory";
import { NewsCard } from "@/components/news/NewsCard";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 60;

export default async function HomePage() {
  const [articlesData, trendingData, discoveriesData, dailyQuiz, tools, placesData, trips] = await Promise.all([
    getArticles({ limit: 12 }),
    getTrending(),
    getDiscoveries(),
    getDailyQuiz(),
    getTools(),
    getPlaces({ limit: 4, featured: true }),
    getTrips({ featured: true })
  ]);

  const allArticles = articlesData.items;
  const heroArticle = allArticles.find((a) => a.is_featured) || allArticles[0];
  const secondaryArticles = allArticles.filter((a) => a.id !== heroArticle?.id).slice(0, 4);

  const cambodiaArticles = allArticles.filter((a) => a.country === "KH").slice(0, 6);
  const worldArticles = allArticles.filter((a) => a.country !== "KH").slice(0, 6);
  const popularTools = tools.filter((t) => t.is_popular).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-20">
      
      {/* 1. HERO AREA: "The Latest" */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-4">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase font-serif">
            The Latest
          </h1>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-widest">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {heroArticle && <HeroStory article={heroArticle} />}

        {/* 4 Secondary Stories */}
        {secondaryArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {secondaryArticles.map((article) => (
              <NewsCard key={article.id} article={article} compact />
            ))}
          </div>
        )}
      </section>

      {/* MID AD SLOT */}
      <AdSlot slot="HOME_TOP" />

      {/* 2. TRENDING SECTION */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
            Trending Analysis
          </h2>
          <Link href="/trending" className="text-xs font-bold text-neutral-900 dark:text-white hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Cambodia Trending */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">
              Cambodia
            </h3>
            <div className="space-y-5">
              {trendingData.cambodia.slice(0, 4).map((item, idx) => (
                <Link key={item.id} href={item.url} className="group flex gap-4 items-start">
                  <span className="text-2xl font-black text-neutral-200 dark:text-neutral-800 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:underline leading-snug font-serif line-clamp-3">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* World Trending */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">
              Global
            </h3>
            <div className="space-y-5">
              {trendingData.world.slice(0, 4).map((item, idx) => (
                <Link key={item.id} href={item.url} className="group flex gap-4 items-start">
                  <span className="text-2xl font-black text-neutral-200 dark:text-neutral-800 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:underline leading-snug font-serif line-clamp-3">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Editor's Picks */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">
              Editor's Picks
            </h3>
            <div className="space-y-5">
              {trendingData.editor_picks.slice(0, 4).map((item, idx) => (
                <Link key={item.id} href={item.url} className="group flex gap-4 items-start">
                  <span className="text-sm font-black text-neutral-400 mt-0.5">
                    —
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:underline leading-snug font-serif line-clamp-3">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AdSlot slot="HOME_MID" />

      {/* 5. LATEST CAMBODIA & WORLD FEEDS (Separated) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Cambodia Feed */}
        <div className="space-y-8">
          <div className="border-b-2 border-neutral-900 dark:border-white pb-3">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase font-serif">
              Cambodia
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
            {cambodiaArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        {/* World Feed */}
        <div className="space-y-8">
          <div className="border-b-2 border-neutral-900 dark:border-white pb-3">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase font-serif">
              World
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
            {worldArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. DAILY QUIZ & POPULAR TOOLS (Clean Editorial Layout) */}
      <section className="border-t border-b border-neutral-200 dark:border-neutral-800 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Daily Quiz */}
          {dailyQuiz && (
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white font-serif">
                The Daily Quiz
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400">
                {dailyQuiz.description} Test your knowledge on today's headlines.
              </p>
              <Link
                href={`/quiz/${dailyQuiz.slug}`}
                className="inline-flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 font-bold text-sm hover:opacity-80 transition-opacity"
              >
                Play Now
              </Link>
            </div>
          )}

          {/* Popular Tools Grid */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                Interactive Utilities
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {popularTools.map((t) => (
                <Link
                  key={t.id}
                  href={`/tools/${t.slug}`}
                  className="group block space-y-2 border-l-2 border-transparent hover:border-neutral-900 dark:hover:border-white pl-4 transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    {t.category}
                  </span>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white font-serif">
                    {t.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
