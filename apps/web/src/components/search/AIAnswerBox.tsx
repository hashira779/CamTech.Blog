"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";
import { getSearchAnswer, type SearchAnswer } from "@/lib/api";

export function AIAnswerBox({ query }: { query: string }) {
  const [state, setState] = useState<SearchAnswer | null | "loading">(query ? "loading" : null);

  useEffect(() => {
    if (!query) {
      setState(null);
      return;
    }
    let alive = true;
    setState("loading");
    getSearchAnswer(query).then((res) => {
      if (alive) setState(res);
    });
    return () => {
      alive = false;
    };
  }, [query]);

  if (!query) return null;

  if (state === "loading") {
    return (
      <div className="p-4 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 flex items-center gap-2.5 text-sm text-teal-700 dark:text-teal-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>AI is reading the matching stories to answer this…</span>
      </div>
    );
  }

  if (!state || !state.answer) return null;

  return (
    <div className="p-5 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI answer from our verified content</span>
      </div>
      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">{state.answer}</p>
      {state.citations.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {state.citations.map((c, idx) => (
            <Link
              key={idx}
              href={c.url}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-teal-200/70 dark:border-teal-900/50 bg-white/60 dark:bg-neutral-900/40 text-[11px] text-neutral-700 dark:text-neutral-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              <span className="line-clamp-1 max-w-[220px]">{c.title}</span>
              <span className="uppercase font-bold text-[9px] text-teal-600 dark:text-teal-400">{c.type}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
