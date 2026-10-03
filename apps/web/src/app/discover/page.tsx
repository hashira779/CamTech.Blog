import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getDiscoveries } from "@/lib/api";

export const revalidate = 60;

export default async function DiscoverHubPage() {
  const { items } = await getDiscoveries();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto text-center border-b-[1px] border-neutral-300 pb-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-normal font-serif text-neutral-900 tracking-tight">
          Visual Discoveries
        </h1>
        <p className="mt-4 text-neutral-500 font-sans text-sm leading-relaxed">
          How the world actually works: from the quantum relativity in your smartphone GPS to underwater internet fiber optics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {items.map((disc) => (
          <Link
            key={disc.id}
            href={`/discover/${disc.slug}`}
            className="group block"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100 mb-6">
              <img
                src={disc.hero_image_url}
                alt={disc.title}
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 ease-out"
              />
            </div>
            <div className="space-y-3 pr-8">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block">
                {disc.category}
              </span>
              <h3 className="text-2xl font-normal font-serif text-neutral-900 leading-snug group-hover:text-neutral-500 transition-colors">
                {disc.title}
              </h3>
              <p className="text-sm text-neutral-500 line-clamp-3 leading-relaxed">
                {disc.intro}
              </p>
              <div className="pt-4 flex items-center text-xs font-serif italic text-neutral-900 group-hover:text-neutral-500">
                <span>View Full Interactive Diagram</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
