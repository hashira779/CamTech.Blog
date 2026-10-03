import Link from "next/link";
import { getArticles, getTrending } from "@/lib/api";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 60;

export default async function HomePage() {
  const [articlesData, trendingData] = await Promise.all([
    getArticles({ limit: 10 }),
    getTrending()
  ]);

  const latestArticles = articlesData.items;
  const popularPosts = [...trendingData.cambodia, ...trendingData.world].slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-neutral-950">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Content (70%) */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="border-b-2 border-neutral-900 dark:border-white pb-2 mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-tight font-serif text-neutral-900 dark:text-white">
              Latest News
            </h1>
          </div>

          <div className="space-y-8">
            {latestArticles.map((article) => {
              const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;
              const title = article.title;
              const summary = article.summary;

              return (
                <article key={article.id} className="flex flex-col sm:flex-row gap-6 border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
                  {/* Thumbnail */}
                  <Link href={url} className="w-full sm:w-1/3 shrink-0 block">
                    <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                      <img 
                        src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"} 
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center">
                    <Link href={url}>
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight font-serif hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {title}
                      </h2>
                    </Link>
                    
                    <div className="mt-2 text-xs text-neutral-500 uppercase tracking-widest font-semibold flex gap-2 items-center">
                      <span>By Editor</span>
                      <span>|</span>
                      <span>{article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "Today"}</span>
                    </div>
                    
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                      {summary}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* In-feed AdSlot */}
          <div className="py-4">
            <AdSlot slot="HOME_MID" />
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (30%) */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Sidebar Top Ad */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 text-center border border-neutral-200 dark:border-neutral-800">
            <span className="text-[10px] uppercase text-neutral-400 mb-2 block tracking-widest">Advertisement</span>
            <AdSlot slot="HOME_TOP" />
          </div>

          {/* Popular Posts Widget */}
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
            <h3 className="text-lg font-bold uppercase tracking-tight border-b-2 border-neutral-900 dark:border-white pb-2 mb-4 font-serif">
              Popular Posts
            </h3>
            
            <div className="space-y-4">
              {popularPosts.map((post, index) => (
                <Link key={post.id} href={post.url} className="flex gap-4 group">
                  <div className="w-16 h-16 shrink-0 bg-neutral-100 dark:bg-neutral-800">
                     <img 
                        src={"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80"} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-serif line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {index + 1}. {post.title}
                    </h4>
                    <span className="text-xs text-neutral-500 block mt-1">Oct 26, 2026</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar Bottom Ad */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 text-center border border-neutral-200 dark:border-neutral-800">
            <span className="text-[10px] uppercase text-neutral-400 mb-2 block tracking-widest">Advertisement</span>
            <AdSlot slot="SIDEBAR_BOTTOM" />
          </div>

        </aside>

      </div>
    </div>
  );
}
