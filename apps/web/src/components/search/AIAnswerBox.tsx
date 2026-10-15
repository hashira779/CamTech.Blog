"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";
import { getSearchAnswer, type SearchAnswer } from "@/lib/api";
import { cleanText } from "@/lib/format";

/**
 * The composed answer above the search results.
 *
 * Behaviour is unchanged — it still only mounts for a non-empty query, still
 * fetches on every query change, and renders nothing when the endpoint has no
 * answer (the live feed currently returns `answer: null` with no engine
 * configured, so an empty frame would be the only content). Only the surface
 * changed: the teal glass box became a paper card on a hairline.
 */
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
      <div
        role="status"
        className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-4 py-3.5 text-sm text-muted-foreground"
      >
        <Loader2 size={16} aria-hidden="true" className="animate-spin shrink-0" />
        <span>Composing an answer from the matching stories…</span>
      </div>
    );
  }

  if (!state || !state.answer) return null;

  const citations = state.citations ?? [];

  return (
    <aside className="rounded-lg border border-border bg-surface-muted p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-accent">
        <Sparkles size={14} aria-hidden="true" />
        Answer composed from our indexed stories
      </h2>

      <p className="mt-3 text-base leading-relaxed text-foreground/90">
        {cleanText(state.answer)}
      </p>

      {citations.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="section-label">Cited</h3>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {citations.map((c, idx) => (
              <li key={idx}>
                <Link
                  href={c.url}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                >
                  <span className="truncate">{cleanText(c.title)}</span>
                  <span className="shrink-0 font-semibold uppercase tracking-[0.08em] text-accent">
                    {c.type}
                  </span>
                  <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
