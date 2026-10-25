import React, { useId } from "react";

/* The bride and groom in Khmer wedding dress, as a simple flat
   illustration (no faces, so it stands for any couple): he in an ivory
   jacket with a gold sash and a sampot chang kben, she in a gold sbai
   over one shoulder, a long blush sampot and a gold crown, hand in hand.
   An original drawing; shown where a couple hasn't given their own photo. */

export function KhmerCouple({ className = "", skin = "#E3AF8A" }: { className?: string; skin?: string }) {
  const id = useId().replace(/[:]/g, "");
  const gold = `kc-gold-${id}`;
  const silk = `kc-silk-${id}`;
  const cloth = `kc-cloth-${id}`;
  return (
    <svg viewBox="0 0 200 262" className={className} role="img" aria-label="">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF0B8" />
          <stop offset="0.45" stopColor="#E2B653" />
          <stop offset="1" stopColor="#A87A2C" />
        </linearGradient>
        <linearGradient id={silk} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C9727E" />
          <stop offset="0.5" stopColor="#E8A3AB" />
          <stop offset="1" stopColor="#C9727E" />
        </linearGradient>
        <linearGradient id={cloth} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6A2A2A" />
          <stop offset="0.5" stopColor="#8E3B3A" />
          <stop offset="1" stopColor="#6A2A2A" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="252" rx="78" ry="7" fill="#3A2416" fillOpacity="0.16" />

      {/* ── The groom ─────────────────────────────────────── */}
      {/* Legs and shoes below the sampot */}
      <rect x="51" y="222" width="10" height="24" rx="4" fill={skin} />
      <rect x="79" y="222" width="10" height="24" rx="4" fill={skin} />
      <ellipse cx="55" cy="248" rx="9" ry="4" fill="#3A2416" />
      <ellipse cx="85" cy="248" rx="9" ry="4" fill="#3A2416" />
      {/* Sampot chang kben, drawn up between the legs */}
      <path d="M41 150 L99 150 C101 180 98 204 92 226 L76 226 L70 180 L64 226 L48 226 C42 204 39 180 41 150 Z" fill={`url(#${cloth})`} />
      <path d="M70 156 L70 180 M56 160 C54 184 52 204 50 224 M85 160 C87 184 89 204 90 224" fill="none" stroke="#4E1C1C" strokeOpacity="0.5" strokeWidth="1.2" />
      {/* Jacket */}
      <path d="M44 84 C46 75 58 71 70 71 C82 71 94 75 96 84 L100 152 L40 152 Z" fill="#F6EBD6" />
      <path d="M44 84 L40 152 L46 152 L50 90 Z" fill="#E4D3B4" />
      <rect x="62" y="68" width="16" height="7" rx="2" fill="#F6EBD6" stroke="#D9C49C" strokeWidth="0.8" />
      {[86, 100, 114, 128, 142].map((y) => <circle key={y} cx="70" cy={y} r="1.6" fill={`url(#${gold})`} />)}
      {/* Gold sash, shoulder to hip */}
      <path d="M50 76 L60 73 L100 140 L92 146 Z" fill={`url(#${gold})`} />
      {/* Belt */}
      <rect x="40" y="146" width="60" height="7" rx="2" fill={`url(#${gold})`} />
      <rect x="64" y="144.5" width="12" height="10" rx="2" fill="#F3D27A" stroke="#A87A2C" strokeWidth="0.8" />
      {/* His left arm at his side */}
      <path d="M45 86 C38 104 36 124 38 142" fill="none" stroke="#F6EBD6" strokeWidth="11" strokeLinecap="round" />
      <circle cx="38" cy="146" r="5" fill={skin} />
      {/* His right arm reaching for her hand */}
      <path d="M95 86 C102 104 104 124 104 140" fill="none" stroke="#EADCC2" strokeWidth="11" strokeLinecap="round" />
      {/* Neck, head and hair */}
      <rect x="65" y="60" width="10" height="10" fill={skin} />
      <circle cx="70" cy="48" r="16" fill={skin} />
      <path d="M54 48 C52 28 88 26 87 46 C84 38 76 35 70 37 C63 36 57 40 54 48 Z" fill="#2A1C15" />
      <ellipse cx="54" cy="50" rx="2.6" ry="4" fill={skin} />
      <ellipse cx="86" cy="50" rx="2.6" ry="4" fill={skin} />

      {/* ── The bride ─────────────────────────────────────── */}
      <ellipse cx="122" cy="249" rx="7" ry="3.4" fill="#C9A24A" />
      <ellipse cx="142" cy="249" rx="7" ry="3.4" fill="#C9A24A" />
      {/* Long sampot with a gold hem and a front pleat */}
      <path d="M112 148 L154 148 C157 182 160 214 161 246 L103 246 C104 214 108 182 112 148 Z" fill={`url(#${silk})`} />
      <path d="M133 152 L136 246 M129 152 L127 246" stroke="#F3D27A" strokeOpacity="0.8" strokeWidth="1.4" />
      <path d="M103 238 L161 238 L161 246 L103 246 Z" fill={`url(#${gold})`} />
      {/* Shoulders and bodice */}
      <path d="M114 82 C116 74 125 71 133 71 C141 71 150 74 152 82 L154 146 L112 146 Z" fill={skin} />
      {/* Gold sbai across the bodice and over her left shoulder, its tail behind */}
      <path d="M150 76 L163 84 L162 206 L151 200 Z" fill="#B98A35" />
      <path d="M112 100 L148 74 L156 80 L155 148 L112 148 Z" fill={`url(#${gold})`} />
      <path d="M116 112 L152 88 M116 126 L154 102 M116 140 L154 116" stroke="#FFF0B8" strokeOpacity="0.55" strokeWidth="1.2" />
      {/* Necklace and belt */}
      <path d="M123 72 C125 84 141 84 143 72" fill="none" stroke={`url(#${gold})`} strokeWidth="2.6" />
      <rect x="111" y="143" width="44" height="7" rx="2" fill={`url(#${gold})`} />
      {/* Her right arm reaching to his hand, her left at her side */}
      <path d="M115 86 C110 104 108 124 108 140" fill="none" stroke={skin} strokeWidth="9" strokeLinecap="round" />
      <path d="M152 88 C158 106 160 124 158 142" fill="none" stroke={skin} strokeWidth="9" strokeLinecap="round" />
      <rect x="103" y="128" width="11" height="4" rx="2" fill={`url(#${gold})`} />
      <rect x="153" y="130" width="11" height="4" rx="2" fill={`url(#${gold})`} />
      {/* Hands joined */}
      <circle cx="106" cy="145" r="5.4" fill={skin} />
      <circle cx="158" cy="146" r="4.6" fill={skin} />
      {/* Neck, head, hair in a bun, crown and earrings */}
      <rect x="128" y="60" width="9" height="12" fill={skin} />
      <circle cx="132.5" cy="50" r="15" fill={skin} />
      <path d="M117 50 C115 32 150 30 148 50 C145 41 139 38 132 39 C125 38 120 42 117 50 Z" fill="#2A1C15" />
      <circle cx="132.5" cy="31" r="8" fill="#2A1C15" />
      <path d="M119 37 L122 25 L126 33 L132.5 19 L139 33 L143 25 L146 37 Z" fill={`url(#${gold})`} stroke="#A87A2C" strokeWidth="0.8" />
      <circle cx="132.5" cy="24" r="2" fill="#E06A6E" />
      <circle cx="118" cy="56" r="2.2" fill={`url(#${gold})`} />
      <circle cx="147" cy="56" r="2.2" fill={`url(#${gold})`} />
    </svg>
  );
}
