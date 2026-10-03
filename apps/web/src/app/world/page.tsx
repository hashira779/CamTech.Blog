import Link from "next/link";
import { getArticles } from "@/lib/api";
import { NewsCard } from "@/components/news/NewsCard";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 60;

export default async function WorldNewsPage() {
  const { items } = await getArticles({ country: "WORLD", limit: 20 });
  const featuredArticles = items.slice(0, 2);
  const latestArticles = items.slice(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#FAF9F6]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Content (70%) */}
        <div className="lg:col-span-8 space-y-12">
          
          <div className="border-b-[1px] border-neutral-300 pb-4">
            <h1 className="text-4xl md:text-5xl font-normal font-serif text-neutral-900 tracking-tight">
              World News
            </h1>
            <p className="mt-4 text-neutral-500 font-sans text-sm max-w-2xl leading-relaxed">
              Global perspectives on geopolitics, international markets, and major breaking events reshaping our world.
            </p>
          </div>

          {/* Featured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>

          <div className="border-t-[1px] border-neutral-200 pt-8 space-y-8">
            <h2 className="text-xl font-medium font-serif text-neutral-900">Latest Updates</h2>
            {latestArticles.map((article) => (
              <div key={article.id} className="group grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Link href={`/world/news/${article.slug}`} className="md:col-span-1 block overflow-hidden bg-neutral-100 aspect-[4/3]">
                    <img 
                      src={article.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
                      alt={article.title}
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                    />
                 </Link>
                 <div className="md:col-span-2 flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-2 block">
                      {article.category?.name || "Global"}
                    </span>
                    <Link href={`/world/news/${article.slug}`}>
                      <h3 className="text-xl md:text-2xl font-serif text-neutral-900 leading-snug group-hover:text-neutral-600 transition-colors">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="mt-3 text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                    <div className="mt-4 text-xs text-neutral-400 font-serif italic">
                      By {article.source_id || "Editor"} • {article.published_at ? new Date(article.published_at).toLocaleDateString() : "Today"}
                    </div>
                 </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (30%) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-8 space-y-10">
            {/* Sidebar Top Ad */}
            <div className="bg-white p-4 text-center border-[1px] border-neutral-200">
              <span className="text-[9px] uppercase text-neutral-400 mb-2 block tracking-widest">Advertisement</span>
              <AdSlot slot="HOME_TOP" />
            </div>

            {/* Neo-Minimalist Widget */}
            <div className="bg-white p-6 border-[1px] border-neutral-200">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-900 rounded-full"></span>
                Global Insights
              </h3>
              
              <div className="space-y-6 divide-y-[1px] divide-neutral-100">
                {[1, 2, 3, 4].map((i) => (
                  <Link key={i} href="#" className="block pt-6 first:pt-0 group">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold block mb-1">Geopolitics</span>
                    <h4 className="text-base font-serif text-neutral-900 leading-snug group-hover:text-neutral-500 transition-colors">
                      Understanding the Shift in International Trade Agreements
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Sidebar Bottom Ad */}
            <div className="bg-white p-4 text-center border-[1px] border-neutral-200">
              <span className="text-[9px] uppercase text-neutral-400 mb-2 block tracking-widest">Advertisement</span>
              <AdSlot slot="SIDEBAR" />
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
