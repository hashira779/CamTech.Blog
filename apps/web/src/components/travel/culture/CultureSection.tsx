"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useJourneyCopy } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";
import { CULTURE_TOPICS, WEDDING_RITES } from "./culture-content";

const ease = [0.16, 1, 0.3, 1] as const;

/** Arrow-key movement for a tablist; returns the index to focus, or null to ignore the key. */
function rovingIndex(key: string, index: number, count: number, vertical: boolean): number | null {
  const next = vertical ? "ArrowDown" : "ArrowRight";
  const prev = vertical ? "ArrowUp" : "ArrowLeft";
  if (key === next) return (index + 1) % count;
  if (key === prev) return (index - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

/**
 * Chapter V — the living soul of Cambodia.
 *
 * A topic index (temples, dance, music, food, silk, festivals) beside one open story, then the
 * rites of a Khmer wedding as a step-through. Copy lives in `culture-content.ts`; photographs are
 * the directory's own and captioned with what they show, and topics without one stay typographic
 * rather than borrowing a picture of something else.
 */
export function CultureSection() {
  const { copy, lang, num } = useJourneyCopy();
  const [topic, setTopic] = React.useState(0);
  const [rite, setRite] = React.useState(0);
  const topicRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const riteRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const active = CULTURE_TOPICS[topic];
  const r = WEDDING_RITES[rite];

  return (
    <section aria-labelledby="tv-culture-title" className="tv-culture relative overflow-hidden py-20 text-tv-ivory sm:py-28">
      <div aria-hidden="true" className="tv-culture-pattern pointer-events-none absolute inset-0" />
      <div className="container-page relative">
        <div className="max-w-2xl">
          <p className="tv-eyebrow text-tv-gold-soft">{copy.cultureLabel}</p>
          <h2 id="tv-culture-title" className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-5xl">
            {copy.cultureTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-tv-ivory/75">{copy.cultureLead}</p>
          <p className="mt-3 text-xs text-tv-ivory/55">{copy.cultureNote}</p>
        </div>

        {/* ── Topic index + story ────────────────────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label={copy.cultureTitle}
            className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
            onKeyDown={(e) => {
              const n = rovingIndex(e.key, topic, CULTURE_TOPICS.length, true) ?? rovingIndex(e.key, topic, CULTURE_TOPICS.length, false);
              if (n === null) return;
              e.preventDefault();
              setTopic(n);
              topicRefs.current[n]?.focus();
            }}
          >
            {CULTURE_TOPICS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  topicRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tv-culture-tab-${t.id}`}
                aria-selected={i === topic}
                aria-controls="tv-culture-panel"
                tabIndex={i === topic ? 0 : -1}
                onClick={() => setTopic(i)}
                className={`group flex shrink-0 items-baseline gap-4 rounded-full border px-4 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-gold-soft lg:rounded-none lg:border-0 lg:border-b lg:border-tv-ivory/10 lg:px-0 lg:py-4 ${
                  i === topic ? "border-tv-gold-soft/60 text-tv-ivory" : "border-tv-ivory/15 text-tv-ivory/55 hover:text-tv-ivory"
                }`}
              >
                <span className="hidden font-display text-sm tabular-nums text-tv-gold-soft/80 lg:inline">{num(String(i + 1).padStart(2, "0"))}</span>
                <span className="font-display text-base lg:text-2xl">{t.title[lang]}</span>
              </button>
            ))}
          </div>

          <div id="tv-culture-panel" role="tabpanel" aria-labelledby={`tv-culture-tab-${active.id}`} className="lg:col-span-8">
            <article key={active.id} className="tv-swap-in grid grid-cols-1 gap-6 md:grid-cols-5">
                {active.photo ? (
                  <figure className="md:col-span-2">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tv-ink">
                      <JourneyImage src={active.photo.src} alt={active.photo.caption.en} sizes="(min-width: 768px) 320px, 100vw" />
                    </div>
                    <figcaption className="mt-2 text-xs text-tv-ivory/55">
                      {active.photo.caption[lang]} · {copy.photoCredit}
                    </figcaption>
                  </figure>
                ) : (
                  <div aria-hidden="true" className="tv-culture-glyph flex aspect-[4/5] items-center justify-center rounded-2xl md:col-span-2">
                    <span className="font-display text-4xl leading-snug text-tv-gold-soft/90">{active.title.km}</span>
                  </div>
                )}
                <div className="flex flex-col justify-center md:col-span-3">
                  <span aria-hidden="true" className="tv-kbach text-tv-gold-soft" />
                  <h3 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-4xl">{active.title[lang]}</h3>
                  {lang !== "km" && <p className="mt-1 text-sm text-tv-ivory/55">{active.title.km}</p>}
                  <p className={`mt-4 text-base text-tv-ivory/85 ${lang === "km" ? "leading-[1.9]" : "leading-relaxed"}`}>{active.body[lang]}</p>
                  {active.link && (
                    <Link href={active.link.href} className="tv-link-gold group mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold">
                      {active.link.label[lang]}
                      <ArrowRight size={15} aria-hidden="true" className="link-nudge" />
                    </Link>
                  )}
                </div>
            </article>
          </div>
        </div>

        {/* ── Wedding rites ──────────────────────────────────────────────── */}
        <div className="mt-20 rounded-3xl border border-tv-ivory/10 bg-tv-ivory/[0.03] p-6 sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl leading-tight tracking-tight sm:text-3xl">{copy.weddingTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tv-ivory/70">{copy.weddingLead}</p>
            </div>
            <Link href="/wedding" className="tv-link-gold group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
              {copy.weddingCta}
              <ArrowRight size={15} aria-hidden="true" className="link-nudge" />
            </Link>
          </div>

          <div
            role="tablist"
            aria-label={copy.weddingTitle}
            className="relative mt-8 flex items-center justify-between gap-1"
            onKeyDown={(e) => {
              const n = rovingIndex(e.key, rite, WEDDING_RITES.length, false);
              if (n === null) return;
              e.preventDefault();
              setRite(n);
              riteRefs.current[n]?.focus();
            }}
          >
            <span aria-hidden="true" className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-tv-ivory/15" />
            <motion.span
              aria-hidden="true"
              className="absolute left-4 top-1/2 h-px origin-left -translate-y-1/2 bg-tv-gold"
              style={{ width: "calc(100% - 2rem)" }}
              animate={{ scaleX: rite / (WEDDING_RITES.length - 1) }}
              transition={{ duration: 0.5, ease }}
            />
            {WEDDING_RITES.map((w, i) => (
              <button
                key={w.romanized}
                ref={(el) => {
                  riteRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tv-rite-${i}`}
                aria-selected={i === rite}
                aria-controls="tv-rite-panel"
                aria-label={`${copy.weddingStep} ${i + 1}: ${lang === "km" ? w.km : w.en}`}
                tabIndex={i === rite ? 0 : -1}
                onClick={() => setRite(i)}
                className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-gold-soft ${
                  i <= rite ? "border-tv-gold bg-tv-gold text-[#1b130a]" : "border-tv-ivory/25 bg-[#101827] text-tv-ivory/70 hover:border-tv-ivory/60"
                }`}
              >
                {num(i + 1)}
              </button>
            ))}
          </div>

          <div id="tv-rite-panel" role="tabpanel" aria-labelledby={`tv-rite-${rite}`} className="mt-8 min-h-[200px]">
            <div key={rite} className="tv-swap-in grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-5">
                  <p className="tv-eyebrow text-tv-gold-soft">
                    {copy.weddingStep} {num(rite + 1)} / {num(WEDDING_RITES.length)}
                  </p>
                  <p className="mt-3 font-display text-3xl leading-snug text-tv-ivory sm:text-4xl">{r.km}</p>
                  <p className="mt-1 text-sm text-tv-ivory/60">
                    {r.romanized} · {r.en}
                  </p>
                </div>
                <p className={`text-base text-tv-ivory/85 md:col-span-7 ${lang === "km" ? "leading-[1.9]" : "leading-relaxed"}`}>{r.body[lang]}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRite((v) => Math.max(0, v - 1))}
              disabled={rite === 0}
              className="tv-btn tv-btn-ghost disabled:opacity-40"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              {copy.weddingPrev}
            </button>
            <button
              type="button"
              onClick={() => setRite((v) => Math.min(WEDDING_RITES.length - 1, v + 1))}
              disabled={rite === WEDDING_RITES.length - 1}
              className="tv-btn tv-btn-ghost disabled:opacity-40"
            >
              {copy.weddingNext}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
