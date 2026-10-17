"use client";

import React from "react";

export type FlowerType = "romduol" | "lotus" | "jasmine" | "orchid" | "kbach" | "rose";

interface FlowerProps {
  className?: string;
}

/**
 * ផ្ការំដួល (Romduol Flower - Cambodia's National Flower)
 * Symmetrical 3 outer thick petals and 3 inner petals with central fragrant receptacle.
 */
export function RomduolFlower({ className = "w-8 h-8 text-amber-500" }: FlowerProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {/* Outer 3 large triangular petals (120° apart) */}
      <path
        d="M50 12 C58 28, 70 42, 85 45 C75 56, 62 60, 50 60 C38 60, 25 56, 15 45 C30 42, 42 28, 50 12 Z"
        opacity="0.9"
      />
      <path
        d="M50 60 C62 60, 75 56, 85 45 C82 62, 75 75, 68 88 C55 82, 48 72, 50 60 Z"
        transform="rotate(120 50 50)"
        opacity="0.9"
      />
      <path
        d="M50 60 C62 60, 75 56, 85 45 C82 62, 75 75, 68 88 C55 82, 48 72, 50 60 Z"
        transform="rotate(240 50 50)"
        opacity="0.9"
      />

      {/* Inner 3 delicate petals */}
      <path
        d="M50 28 C55 38, 62 44, 70 46 C64 53, 56 55, 50 55 C44 55, 36 53, 30 46 C38 44, 45 38, 50 28 Z"
        opacity="0.75"
      />
      <path
        d="M50 55 C56 55, 64 53, 70 46 C67 56, 62 64, 57 72 C49 68, 46 62, 50 55 Z"
        transform="rotate(120 50 50)"
        opacity="0.75"
      />
      <path
        d="M50 55 C56 55, 64 53, 70 46 C67 56, 62 64, 57 72 C49 68, 46 62, 50 55 Z"
        transform="rotate(240 50 50)"
        opacity="0.75"
      />

      {/* Central golden stamen receptacle */}
      <circle cx="50" cy="50" r="8" fill="#d4af37" />
      <circle cx="50" cy="50" r="5" fill="#fef08a" />
      <circle cx="50" cy="45" r="1.5" fill="#ca8a04" />
      <circle cx="54" cy="48" r="1.5" fill="#ca8a04" />
      <circle cx="53" cy="53" r="1.5" fill="#ca8a04" />
      <circle cx="47" cy="53" r="1.5" fill="#ca8a04" />
      <circle cx="46" cy="48" r="1.5" fill="#ca8a04" />
    </svg>
  );
}

/**
 * ផ្កាឈូកមង្គល (Sacred Lotus Bloom)
 * Auspicious blooming lotus petals with central seed pod.
 */
export function LotusFlower({ className = "w-8 h-8 text-rose-500" }: FlowerProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {/* Outer base leaves */}
      <path
        d="M15 65 C25 60, 40 68, 50 78 C35 76, 22 72, 15 65 Z"
        opacity="0.5"
      />
      <path
        d="M85 65 C75 60, 60 68, 50 78 C65 76, 78 72, 85 65 Z"
        opacity="0.5"
      />

      {/* Side petals */}
      <path
        d="M20 50 C28 35, 42 42, 50 62 C38 62, 28 58, 20 50 Z"
        opacity="0.7"
      />
      <path
        d="M80 50 C72 35, 58 42, 50 62 C62 62, 72 58, 80 50 Z"
        opacity="0.7"
      />

      {/* Center upright petals */}
      <path
        d="M32 40 C38 22, 48 30, 50 58 C42 56, 36 50, 32 40 Z"
        opacity="0.85"
      />
      <path
        d="M68 40 C62 22, 52 30, 50 58 C58 56, 64 50, 68 40 Z"
        opacity="0.85"
      />

      {/* Center main lotus heart petal */}
      <path
        d="M50 16 C56 30, 58 46, 50 64 C42 46, 44 30, 50 16 Z"
        opacity="0.95"
      />

      {/* Base pod */}
      <ellipse cx="50" cy="65" rx="12" ry="5" fill="#ca8a04" opacity="0.9" />
    </svg>
  );
}

/**
 * ផ្កាម្លិះ (Sweet Wedding Jasmine)
 * Delicate fragrant white & gold jasmine blossom.
 */
export function JasmineFlower({ className = "w-8 h-8 text-amber-300" }: FlowerProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {/* 6 Jasmine star petals */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path
          key={deg}
          d="M50 50 C46 36, 44 22, 50 10 C56 22, 54 36, 50 50 Z"
          transform={`rotate(${deg} 50 50)`}
          opacity="0.85"
        />
      ))}
      <circle cx="50" cy="50" r="7" fill="#fef08a" />
      <circle cx="50" cy="50" r="4" fill="#eab308" />
    </svg>
  );
}

/**
 * ផ្កាអ័រគីដេ (Royal Orchid Bloom)
 */
export function OrchidFlower({ className = "w-8 h-8 text-purple-400" }: FlowerProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {/* Top petal */}
      <path d="M50 15 C58 28, 62 38, 50 48 C38 38, 42 28, 50 15 Z" opacity="0.8" />
      {/* Left wing */}
      <path d="M15 42 C30 38, 42 44, 48 50 C42 58, 28 62, 15 42 Z" opacity="0.85" />
      {/* Right wing */}
      <path d="M85 42 C70 38, 58 44, 52 50 C58 58, 72 62, 85 42 Z" opacity="0.85" />
      {/* Lower lower petals */}
      <path d="M30 75 C38 60, 46 54, 48 52 C42 66, 38 74, 30 75 Z" opacity="0.75" />
      <path d="M70 75 C62 60, 54 54, 52 52 C58 66, 62 74, 70 75 Z" opacity="0.75" />
      {/* Lip / Center */}
      <circle cx="50" cy="52" r="9" fill="#f43f5e" opacity="0.9" />
      <circle cx="50" cy="52" r="5" fill="#fef08a" />
    </svg>
  );
}

/**
 * ក្បាច់ផ្កាច័ន្ទ (Traditional Khmer Kbach Pka Chan)
 */
export function KbachPkaChanFlower({ className = "w-8 h-8 text-amber-600" }: FlowerProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="7" />
      <path d="M50 14 C54 28, 64 36, 75 36 C64 43, 58 50, 50 50 C42 50, 36 43, 25 36 C36 36, 46 28, 50 14 Z" />
      <path d="M50 86 C54 72, 64 64, 75 64 C64 57, 58 50, 50 50 C42 50, 36 57, 25 64 C36 64, 46 72, 50 86 Z" />
      <path d="M14 50 C28 46, 36 36, 36 25 C43 36, 50 42, 50 50 C50 58, 43 64, 36 75 C36 64, 28 54, 14 50 Z" />
      <path d="M86 50 C72 46, 64 36, 64 25 C57 36, 50 42, 50 50 C50 58, 57 64, 64 75 C64 64, 72 54, 86 50 Z" />
      <circle cx="50" cy="22" r="3" opacity="0.8" />
      <circle cx="50" cy="78" r="3" opacity="0.8" />
      <circle cx="22" cy="50" r="3" opacity="0.8" />
      <circle cx="78" cy="50" r="3" opacity="0.8" />
    </svg>
  );
}

/**
 * Dynamic Flower Icon Component according to theme's flowerType
 */
export function WeddingFlowerIcon({
  type = "romduol",
  className = "w-8 h-8 text-amber-500",
}: {
  type?: FlowerType;
  className?: string;
}) {
  switch (type) {
    case "romduol":
      return <RomduolFlower className={className} />;
    case "lotus":
      return <LotusFlower className={className} />;
    case "jasmine":
      return <JasmineFlower className={className} />;
    case "orchid":
      return <OrchidFlower className={className} />;
    case "kbach":
    default:
      return <KbachPkaChanFlower className={className} />;
  }
}

/**
 * Canva-Style Botanical Laurel Monogram Crest (ត្រាមង្គលអក្សរកាត់គូស្វាមីភរិយា)
 */
export function BotanicalMonogramCrest({
  initials = "V & S",
  className = "w-16 h-16 text-amber-600",
}: {
  initials?: string;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Botanical laurel ring SVG */}
      <svg viewBox="0 0 120 120" fill="currentColor" className="absolute inset-0 w-full h-full text-current" aria-hidden="true">
        {/* Fine circular hairline */}
        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
        {/* Left Laurel Sprig */}
        <path d="M60 108 C35 106 18 85 18 60 C18 42 28 26 44 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right Laurel Sprig */}
        <path d="M60 108 C85 106 102 85 102 60 C102 42 92 26 76 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Leaves */}
        {[20, 38, 56, 74, 92].map((deg) => (
          <ellipse key={`l-${deg}`} cx="20" cy="60" rx="3.5" ry="1.8" transform={`rotate(${deg - 56} 60 60) translate(-36 0)`} opacity="0.85" />
        ))}
        {[20, 38, 56, 74, 92].map((deg) => (
          <ellipse key={`r-${deg}`} cx="100" cy="60" rx="3.5" ry="1.8" transform={`rotate(${56 - deg} 60 60) translate(36 0)`} opacity="0.85" />
        ))}
        {/* Bottom knot */}
        <circle cx="60" cy="108" r="3" fill="currentColor" />
      </svg>
      {/* Monogram typography */}
      <span className="font-serif font-black text-xs sm:text-sm tracking-wider text-current drop-shadow-xs z-10 select-none">
        {initials}
      </span>
    </div>
  );
}

/**
 * Traditional Khmer Gold Filigree Corner (ក្បាច់ភ្ញីទេសជ្រុងមាស)
 */
export function KhmerCornerFiligree({
  className = "w-6 h-6 text-amber-500",
  position = "top-left",
}: {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const transform = {
    "top-left": "",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1)",
  }[position];

  return (
    <svg viewBox="0 0 60 60" fill="currentColor" className={className} style={{ transform }} aria-hidden="true">
      <path d="M4 4 L40 4 C28 8 18 18 14 30 C10 18 6 12 4 4 Z" opacity="0.95" />
      <path d="M4 4 L4 40 C8 28 18 18 30 14 C18 10 12 6 4 4 Z" opacity="0.95" />
      <circle cx="10" cy="10" r="3.5" fill="#fef08a" />
      <circle cx="22" cy="8" r="2" opacity="0.85" />
      <circle cx="8" cy="22" r="2" opacity="0.85" />
      <path d="M14 30 C18 42 28 50 44 56 C32 52 22 42 18 30 Z" opacity="0.75" />
      <circle cx="28" cy="28" r="2.5" fill="#fef08a" />
    </svg>
  );
}

/**
 * Khmer Royal Archway Apex Crown (ក្បាច់កំពូលរាជវាំង)
 */
export function KhmerArchCrown({ className = "w-20 h-8 text-amber-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="currentColor" className={className} aria-hidden="true">
      <path d="M60 4 C64 14 74 18 84 18 C76 24 70 28 68 36 C64 28 56 28 52 36 C50 28 44 24 36 18 C46 18 56 14 60 4 Z" />
      <circle cx="60" cy="4" r="3.5" fill="#fef08a" />
      <path d="M60 18 L60 36" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="46" cy="22" r="2" opacity="0.85" />
      <circle cx="74" cy="22" r="2" opacity="0.85" />
      <circle cx="60" cy="26" r="3" fill="#fef08a" />
    </svg>
  );
}

/**
 * Live Floating Wedding Petals & Gold Sparkles (ផ្កាធ្លាក់រំភើយៗ)
 */
export function FloatingWeddingPetals({
  flowerType = "romduol",
  count = 14,
}: {
  flowerType?: FlowerType;
  count?: number;
}) {
  const petals = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 100) / count + ((i * 7) % 8)}%`,
    animationDelay: `${(i * 0.6) % 7}s`,
    animationDuration: `${7 + (i % 5) * 2.5}s`,
    size: 16 + (i % 4) * 4,
    opacity: 0.65 + (i % 3) * 0.12,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-30" aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute animate-petal-drift"
          style={{
            left: p.left,
            top: "-40px",
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
            opacity: p.opacity,
          }}
        >
          <div
            style={{ width: p.size, height: p.size }}
            className={flowerType === "lotus" ? "text-rose-400/80 drop-shadow-xs" : "text-amber-400/75 drop-shadow-xs"}
          >
            {flowerType === "lotus" ? (
              <svg viewBox="0 0 30 30" fill="currentColor">
                <path d="M15 2 C20 10 24 18 15 28 C6 18 10 10 15 2 Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 30 30" fill="currentColor">
                <path d="M15 4 C22 10 24 20 15 26 C6 20 8 10 15 4 Z" />
                <circle cx="15" cy="15" r="2.5" fill="#fef08a" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

