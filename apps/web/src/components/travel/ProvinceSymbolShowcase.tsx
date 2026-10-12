"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Camera,
  Utensils,
  CheckCircle2,
  BookmarkCheck,
  Compass,
  Award,
  Crown,
  Share2,
  Check,
  Volume2
} from "lucide-react";
import { ProvinceSymbol } from "@/data/province_symbols";

interface ProvinceSymbolShowcaseProps {
  symbol: ProvinceSymbol;
}

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
    <section className="relative my-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-neutral-950 to-slate-950 text-white border border-slate-800/80 shadow-2xl p-6 sm:p-10">
      {/* ─── Ambient Glow Blobs in Background ─── */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-30"
        style={{ background: symbol.accentColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-20"
        style={{ background: symbol.accentColor }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* ─── LEFT COLUMN: The Grand Animated Provincial Symbol Medallion ─── */}
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer">
            {/* Outer Rotating Mandala/Sunburst Ring */}
            <div
              className="absolute -inset-4 sm:-inset-6 rounded-full opacity-70 animate-spin-slow pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, ${symbol.accentColor}, transparent 40%, ${symbol.accentColor} 70%, transparent)`,
                filter: "blur(8px)",
              }}
            />

            {/* Glowing Aura Ring */}
            <div
              className="absolute -inset-2 rounded-full opacity-60 animate-pulse-soft pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${symbol.accentColor} 0%, transparent 70%)`,
              }}
            />

            {/* Central Iconic Roundel / Medallion */}
            <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-full p-2 bg-gradient-to-tr from-amber-500 via-slate-700 to-teal-400 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105">
              <div className="h-full w-full rounded-full overflow-hidden relative border-4 border-slate-900 bg-slate-900">
                {/* Symbol Image */}
                <img
                  src={symbol.image}
                  alt={symbol.symbolName}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                {/* Badge Overlay Details */}
                <div className="absolute inset-0 flex flex-col items-center justify-end p-5 text-center">
                  <span className="text-3xl mb-1 filter drop-shadow-md">{symbol.emoji}</span>
                  <span className="font-khmer text-lg sm:text-xl font-bold text-amber-300 drop-shadow-md leading-tight">
                    {symbol.symbolNameKm}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white drop-shadow-md mt-0.5">
                    {symbol.symbolName}
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md text-amber-200 border border-white/20 shadow-xs">
                    <Award className="h-3 w-3 text-amber-400" /> Official Landmark
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Top Accent Seal */}
            <div className="absolute -top-3 -right-2 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 p-2.5 rounded-full shadow-lg border-2 border-white/30 animate-float">
              <Crown className="h-5 w-5 fill-slate-950" />
            </div>
          </div>

          {/* Khmer Pronunciation Audio Prompt */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={handlePronounce}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all backdrop-blur-xs border border-white/10"
            >
              <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? "text-amber-400 animate-pulse" : ""}`} />
              <span>Pronounce: <strong className="font-khmer text-amber-300">{symbol.nameKm}</strong></span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all border border-white/10"
              title="Share Landmark"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Promotional Tourist Storytelling & Motivation ─── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5" /> Iconic Provincial Symbol
              </span>
              <span className="text-xs font-medium text-slate-400 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
                {symbol.monumentType}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {symbol.symbolName}
            </h2>
            <p className="font-khmer text-lg text-amber-300 font-semibold mt-1">
              {symbol.symbolNameKm} — {symbol.nicknameKm}
            </p>
            <p className="text-sm font-medium text-slate-300 italic mt-0.5">
              &ldquo;{symbol.nickname}&rdquo;
            </p>
          </div>

          {/* Historical Storytelling Lore */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" /> Cultural Story & Significance
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {symbol.story}
            </p>
          </div>

          {/* Tourist Action Grid: Photo Spot + Signature Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Photo Tip */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <Camera className="h-4 w-4" /> Best Tourist Photo Spot
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {symbol.photoSpotTip}
              </p>
            </div>

            {/* Must-Try Specialty */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Utensils className="h-4 w-4" /> Signature Local Delicacy
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {symbol.mustTrySpecialty}
              </p>
            </div>
          </div>

          {/* ─── Interactive Tourist Passport Stamp CTA ─── */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={handleStamp}
              disabled={stamped}
              className={`
                inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg cursor-pointer
                ${
                  stamped
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
                    : "bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/20"
                }
              `}
            >
              {stamped ? (
                <>
                  <BookmarkCheck className="h-5 w-5 text-emerald-400 animate-scale-in" />
                  <span>Passport Stamp Collected! ⭐</span>
                </>
              ) : (
                <>
                  <Award className="h-5 w-5" />
                  <span>Stamp My Travel Passport for {symbol.name}</span>
                </>
              )}
            </button>

            {stamped && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved to your browser travel achievements!
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
