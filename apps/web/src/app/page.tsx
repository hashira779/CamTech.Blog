import Link from "next/link";
import { ArrowRight, Compass, Sparkles, HelpCircle, Wrench, TrendingUp, Globe2, MapPin, ShieldCheck, ChevronRight, Navigation, Star } from "lucide-react";
import { getArticles, getTrending, getDiscoveries, getDailyQuiz, getTools, getDestinations, getPlaces, getTrips } from "@/lib/api";
import { HeroStory } from "@/components/news/HeroStory";
import { NewsCard } from "@/components/news/NewsCard";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 60; // SSR with 60s ISR

export default async function HomePage() {
  const [articlesData, trendingData, discoveriesData, dailyQuiz, tools, destinations, placesData, trips] = await Promise.all([
    getArticles({ limit: 10 }),
    getTrending(),
    getDiscoveries(),
    getDailyQuiz(),
    getTools(),
    getDestinations(),
    getPlaces({ limit: 4, featured: true }),
    getTrips({ featured: true })
  ]);

  const allArticles = articlesData.items;
  const heroArticle = allArticles.find((a) => a.is_featured) || allArticles[0];
  const secondaryArticles = allArticles.filter((a) => a.id !== heroArticle?.id).slice(0, 4);

  const cambodiaArticles = allArticles.filter((a) => a.country === "KH").slice(0, 3);
  const worldArticles = allArticles.filter((a) => a.country !== "KH").slice(0, 3);
  const popularTools = tools.filter((t) => t.is_popular).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Optional Top AdSlot (Dormant placeholder initially) */}
      <AdSlot slot="HOME_TOP" />

      {/* 1. HERO AREA: "What's happening today" (Section 6) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-rose-600 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
              What's Happening Today
            </h1>
          </div>
          <span className="text-xs text-neutral-400 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {heroArticle && <HeroStory article={heroArticle} />}

        {/* 4 Secondary Stories */}
        {secondaryArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {secondaryArticles.map((article) => (
              <NewsCard key={article.id} article={article} compact />
            ))}
          </div>
        )}
      </section>

      {/* 2. TRENDING SECTION (Real metric time-decay) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Trending Stories
            </h2>
          </div>
          <Link href="/trending" className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700">
            View Metrics Board <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cambodia Trending */}
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <MapPin className="h-4 w-4" />
              <span>Trending in Cambodia</span>
            </div>
            <div className="space-y-3">
              {trendingData.cambodia.slice(0, 3).map((item, idx) => (
                <Link key={item.id} href={item.url} className="group block space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-black text-neutral-300 dark:text-neutral-700 group-hover:text-rose-600">
                      0{idx + 1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-rose-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 pl-6 block">
                    Score: {item.trend_score.toFixed(1)} • {item.views_count} views
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* World Trending */}
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Globe2 className="h-4 w-4" />
              <span>Trending Worldwide</span>
            </div>
            <div className="space-y-3">
              {trendingData.world.slice(0, 3).map((item, idx) => (
                <Link key={item.id} href={item.url} className="group block space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-black text-neutral-300 dark:text-neutral-700 group-hover:text-indigo-600">
                      0{idx + 1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 pl-6 block">
                    Score: {item.trend_score.toFixed(1)} • {item.views_count} views
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Editor's Picks */}
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Sparkles className="h-4 w-4" />
              <span>Editor's Picks</span>
            </div>
            <div className="space-y-3">
              {trendingData.editor_picks.slice(0, 3).map((item, idx) => (
                <Link key={item.id} href={item.url} className="group block space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-black text-neutral-300 dark:text-neutral-700 group-hover:text-amber-500">
                      ★
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 pl-6 block">
                    Curated for deep analytical value
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. TODAY'S DISCOVERY (Visual Explanations, Section 3) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Today's Discovery
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Visual explanations of science, engineering, and everyday mysteries.
            </p>
          </div>
          <Link href="/discover" className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700">
            Explore All Discoveries <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {discoveriesData.items.map((disc) => (
            <Link
              key={disc.id}
              href={`/discover/${disc.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={disc.hero_image_url}
                  alt={disc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                  {disc.category}
                </div>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {disc.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {disc.intro}
                </p>
                <div className="pt-3 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Interactive Visual Explainer</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3B. TRAVEL & TRIP DISCOVERY (Section 8, 9, 10, 22) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-rose-600" />
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Cambodia Travel & Trip Discovery
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Verified temple coordinates, heritage accommodations, and curated multi-day itineraries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/travel/planner"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" /> Trip Planner
            </Link>
            <Link href="/travel" className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700">
              Explore All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {placesData.items.map((place) => (
            <Link
              key={place.id}
              href={`/travel/place/${place.slug}`}
              className="group flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={place.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                  {place.place_type}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {place.rating.toFixed(1)}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">
                    {place.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                    {place.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="font-medium">{place.price_level}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Itinerary Callout */}
        {trips.length > 0 && (
          <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                {trips[0].duration_days}D
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Featured Odyssey Itinerary
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {trips[0].title}
                </h3>
              </div>
            </div>
            <Link
              href={`/travel/trips/${trips[0].slug}`}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              View Full Itinerary <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* MID AD SLOT */}
      <AdSlot slot="HOME_MID" />

      {/* 4. DAILY QUIZ & POPULAR TOOLS (Interactive Row) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Daily Quiz Card (5 Cols) */}
        {dailyQuiz && (
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-rose-200 dark:border-rose-950/60 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 dark:from-rose-950/20 dark:via-neutral-900 dark:to-amber-950/10 shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                <HelpCircle className="h-3.5 w-3.5" />
                Daily Challenge
              </div>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight leading-snug">
                {dailyQuiz.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {dailyQuiz.description}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500">
                <span>{dailyQuiz.questions.length} Questions</span>
                <span>•</span>
                <span>~{dailyQuiz.estimated_minutes} Minutes</span>
                <span>•</span>
                <span>No Account Needed</span>
              </div>
            </div>

            <Link
              href={`/quiz/${dailyQuiz.slug}`}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-center text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              Take Today's Quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Popular Tools Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                Useful Everyday Tools
              </h2>
            </div>
            <Link href="/tools" className="text-xs font-bold text-rose-600 hover:underline">
              All Tools ({tools.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularTools.map((t) => (
              <Link
                key={t.id}
                href={`/tools/${t.slug}`}
                className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-500/50 hover:shadow-md transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-neutral-400">100% Working</span>
                </div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {t.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

      </section>

      {/* 5. LATEST CAMBODIA & WORLD FEEDS (Separated, Section 6) */}
      <section className="space-y-10">
        
        {/* Cambodia Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-600" />
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Cambodia & Regional Developments
              </h2>
            </div>
            <Link href="/cambodia" className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
              View Cambodia Hub <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cambodiaArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        {/* World Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                World News, Science & Frontier Tech
              </h2>
            </div>
            <Link href="/world" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              View World Hub <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {worldArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
