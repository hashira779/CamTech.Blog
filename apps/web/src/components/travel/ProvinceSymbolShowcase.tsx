"use client";

import React, { useState, useEffect } from "react";
import { BookmarkCheck, Check, Compass, Share2, Volume2 } from "lucide-react";
import { PhotoFill } from "@/components/ui/photo-image";
import { Button } from "@/components/ui/button";
import { CategoryMark } from "@/components/ui/category-mark";
import type { ProvinceSymbol } from "@/data/province_symbols";

interface ProvinceSymbolShowcaseProps {
  symbol: ProvinceSymbol;
}

/**
 * The provincial symbol panel.
 *
 * This used to be a near-black gradient slab with two blurred glow blobs, a
 * rotating conic sunburst and an amber→teal stamp button. All of that is gone:
 * the panel is warm paper, the photograph sits in a hairline roundel, and the
 * superlative labels ("Best Tourist Photo Spot", "Official Landmark") are
 * replaced by the fields the record actually carries.
 */
export function ProvinceSymbolShowcase({ symbol }: ProvinceSymbolShowcaseProps) {
  const [stamped, setStamped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check if visitor already stamped this province
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const collected = localStorage.getItem(`stamp_${symbol.slug}`);
        if (collected === "true") {
          setStamped(true);
        }
      } catch {
        // ignore storage errors
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [symbol.slug]);

  const handleStamp = () => {
    try {
      localStorage.setItem(`stamp_${symbol.slug}`, "true");
    } catch {
      // ignore storage errors
    }
    setStamped(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePronounce = () => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(symbol.nameKm || symbol.name);
      utterance.rate = 0.85;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <section className="my-10 rounded-2xl border border-border bg-surface p-6 sm:rounded-3xl sm:p-10">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* ─── Photograph and pronunciation ─── */}
        <div className="flex flex-col items-center text-center lg:col-span-4">
          <div className="h-52 w-52 overflow-hidden rounded-full border border-border-strong bg-surface-muted sm:h-60 sm:w-60">
            <PhotoFill src={symbol.image} alt={symbol.name} className="h-full w-full object-cover" />
          </div>
          {/* The bundled photograph shows the province, not necessarily the monument named below,
              so the roundel is captioned with the place. Labelling it with `symbolName` claimed a
              photograph of the durian roundabout while showing the Bokor plateau view. */}
          <p className="mt-3 text-xs text-muted-foreground">{symbol.name}</p>

          <p className="mt-4 font-display text-xl leading-snug tracking-tight text-foreground">
            {symbol.symbolName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{symbol.symbolNameKm}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePronounce}>
              <Volume2
                size={14}
                className={isSpeaking ? "text-accent" : undefined}
                aria-hidden="true"
              />
              Pronounce {symbol.nameKm}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} aria-label={`Share ${symbol.symbolName}`}>
              {copied ? <Check size={14} className="text-success" /> : <Share2 size={14} aria-hidden="true" />}
              {copied ? "Link copied" : "Share"}
            </Button>
          </div>
        </div>

        {/* ─── The story ─── */}
        <div className="lg:col-span-8">
          <CategoryMark category="travel" tone="dot">
            Provincial symbol
          </CategoryMark>

          <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {symbol.symbolName}
          </h2>

          {(symbol.nickname || symbol.nicknameKm) && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              {symbol.nickname}
              {symbol.nicknameKm && <span className="ml-2">{symbol.nicknameKm}</span>}
            </p>
          )}

          {symbol.monumentType && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="section-label mr-2">Type</span>
              {symbol.monumentType}
            </p>
          )}

          {symbol.story && (
            <p className="mt-5 text-base leading-relaxed text-foreground/90">{symbol.story}</p>
          )}

          {symbol.highlights.length > 0 && (
            <ul className="mt-6 divide-y divide-border border-y border-border">
              {symbol.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-3 py-3 text-sm text-muted-foreground">
                  <Compass size={14} className="shrink-0 text-accent" aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          {(symbol.photoSpotTip || symbol.mustTrySpecialty) && (
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {symbol.photoSpotTip && (
                <div>
                  <dt className="section-label text-accent">Where to photograph it</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {symbol.photoSpotTip}
                  </dd>
                </div>
              )}
              {symbol.mustTrySpecialty && (
                <div>
                  <dt className="section-label text-accent">Local specialty</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {symbol.mustTrySpecialty}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <Button variant={stamped ? "secondary" : "accent"} onClick={handleStamp} disabled={stamped}>
              <BookmarkCheck size={16} aria-hidden="true" />
              {stamped ? `Stamped for ${symbol.name}` : `Stamp my passport for ${symbol.name}`}
            </Button>
            {stamped && (
              <span className="text-xs text-muted-foreground">Saved in this browser only.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
