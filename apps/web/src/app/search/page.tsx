import Link from "next/link";
import { Search, Compass, Sparkles, HelpCircle, Wrench } from "lucide-react";
import { searchGlobal } from "@/lib/api";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const resolved = await searchParams;
  const q = resolved.q || "";
  const data = q ? await searchGlobal(q) : { query: "", total: 0, results: [] };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
          Platform Search
        </h1>

        <form action="/search" method="GET" className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search verified articles, discoveries, quizzes, and tools..."
            className="w-full pl-12 pr-24 py-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm font-medium focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {q && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <span>Found {data.total} results for &ldquo;{q}&rdquo;</span>
          </div>

          <div className="space-y-3">
            {data.results.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-sm">
                No matching results found. Try broader terms like &ldquo;Cambodia&rdquo;, &ldquo;GPS&rdquo;, or &ldquo;Calculator&rdquo;.
              </div>
            ) : (
              data.results.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="block p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-500/50 hover:shadow-md transition-all group space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    <span>{item.type}</span>
                    {item.category && <span>• {item.category}</span>}
                  </div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {item.summary}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
