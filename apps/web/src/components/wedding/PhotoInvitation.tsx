"use client";

import React, { useId } from "react";
import { KbachBorder, KBACH_LATTICE_BG } from "./KhmerKbach";
import { KhmerCouple } from "./KhmerCouple";
import { PersonName } from "./CoupleNames";
import { Flower } from "./InvitationDecor";

/* The invitation itself, after the walk into the hall: a portrait card in
   deep red silk with a gilded kbach frame, the couple's photo in a pointed
   Khmer arch, and real flowers (CC0 photographs, cut out) gathered round
   it, the way printed Khmer invitations frame the couple. Below it, the
   words of the invitation and the two families, set on ivory.

   Without a real couple photo the arch holds an illustration of a bride
   and groom in Khmer wedding dress; a stock picture of strangers is never
   used.

   Motion is CSS, driven by the section's own place on screen (scroll
   timelines where supported, simply shown elsewhere): the frame rises,
   the photo is unveiled, flowers drift in from the edges at different
   depths, and the orchid spray sways a little as if in moving air. */

/* Pointed Khmer arch in a 0..1 box, for the photo window */
const ARCH = "M0 1 L0 0.34 C0 0.21 0.15 0.14 0.29 0.095 C0.4 0.06 0.47 0.032 0.5 0 C0.53 0.032 0.6 0.06 0.71 0.095 C0.85 0.14 1 0.21 1 0.34 L1 1 Z";

export interface PhotoInvitationProps {
  lang: "km" | "en";
  label: string;
  invite: string;
  honor: string;
  blessing: string;
  groom: { name: string; title: string; parents?: string; parentsTitle: string };
  bride: { name: string; title: string; parents?: string; parentsTitle: string };
  dateLine: string;
  timeLine?: string;
  venue?: string;
  portrait?: string;
}


/* Petals falling past the card: left %, top %, delay s, fall time s, size */
const PETALS = [
  [4, 0, 0, 14, 1], [16, 8, 4, 12, 0.8], [30, 2, 7, 16, 1.1], [62, 6, 2, 13, 0.9], [78, 0, 5.5, 15, 1.2],
  [92, 10, 9, 12, 0.85], [10, 40, 3, 14, 0.9], [88, 44, 6, 13, 1], [50, 30, 10, 16, 0.75],
] as const;

export function PhotoInvitation(p: PhotoInvitationProps) {
  const clip = `pi-arch-${useId().replace(/[:]/g, "")}`;
  const km = p.lang === "km";
  return (
    <section className="pi relative overflow-clip px-5 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <clipPath id={clip} clipPathUnits="objectBoundingBox"><path d={ARCH} /></clipPath>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        {PETALS.map(([x, y, d, t, s], i) => (
          <span key={i} className={i % 3 === 1 ? "ve-petal ve-petal--rose" : "ve-petal"} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-d}s`, animationDuration: `${t}s`, "--s": s } as React.CSSProperties} />
        ))}
      </div>
      <p className="wc-smallcaps text-center text-[var(--wc-link)] mb-10">{p.label}</p>

      {/* The card, with flowers gathered round it */}
      <div className="relative mx-auto w-full max-w-[min(520px,92vw)]">
        <Flower name="orchid-spray" sway delay={0.15} className="z-20 -left-[14%] -top-[6%] w-[34%]" />
        <Flower name="plumeria-pink" from="r" delay={0.25} className="z-20 -right-[10%] -top-[4%] w-[30%] rotate-[14deg]" />
        <Flower name="rose-white" delay={0.35} className="z-30 -left-[13%] bottom-[38%] w-[30%] -rotate-[8deg]" />
        <Flower name="plumeria" delay={0.45} className="z-30 left-[11%] bottom-[37%] w-[13%] rotate-[18deg]" />
        <Flower name="orchid-white" from="r" delay={0.4} className="z-30 -right-[15%] bottom-[38%] w-[32%] -scale-x-100" />
        <Flower name="jasmine" delay={0.5} className="z-30 -left-[9%] -bottom-[7%] w-[34%] rotate-[-4deg]" />
        <Flower name="plumeria-pink" from="r" delay={0.55} className="z-30 -right-[9%] -bottom-[6%] w-[28%] -rotate-[10deg]" />

        <div className="pi-card relative z-10 rounded-[6px] bg-[radial-gradient(circle_at_50%_35%,#9E2328_0%,#6E1418_55%,#4A0C10_100%)] p-[5%] shadow-[0_40px_80px_-40px_rgba(60,15,10,0.7)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[6px]">
            <span className="pi-shine absolute -inset-y-[10%] -left-[60%] w-[45%] bg-[linear-gradient(100deg,rgba(255,240,200,0)_0%,rgba(255,240,200,0.22)_50%,rgba(255,240,200,0)_100%)]" />
          </div>
          {/* Gilded frame: a double rule with kbach sprays turning each corner */}
          <div aria-hidden="true" className="absolute inset-[2.2%] rounded-[3px] border-[2px] border-[#D9B45A]" />
          <div aria-hidden="true" className="absolute inset-[3.6%] rounded-[2px] border border-[#D9B45A]/50" />

          <div className="relative flex flex-col items-center pt-[4%] pb-[13%]">
            {/* The arch window */}
            <div className="relative w-[78%] aspect-[4/5]">
              <div className="pi-photo absolute inset-0">
              <div className="absolute inset-0" style={{ clipPath: `url(#${clip})` }}>
                {p.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.portrait} alt="" loading="lazy" decoding="async" className="pi-photo-img h-full w-full object-cover object-[50%_30%]" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_45%,#FBF1DD_0%,#EFDDB8_65%,#DEC293_100%)]" style={{ backgroundImage: `${KBACH_LATTICE_BG}, radial-gradient(circle at 50% 45%, #FBF1DD 0%, #EFDDB8 65%, #DEC293 100%)` }}>
                    <KhmerCouple className="pi-mono w-[74%] h-auto mt-[14%]" />
                  </div>
                )}
              </div>
              </div>
              <svg viewBox="0 0 100 125" preserveAspectRatio="none" className="pointer-events-none absolute -inset-[3%] h-[106%] w-[106%] overflow-visible" aria-hidden="true">
                <path d="M0 125 L0 42.5 C0 26.3 15 17.5 29 11.9 C40 7.5 47 4 50 0 C53 4 60 7.5 71 11.9 C85 17.5 100 26.3 100 42.5 L100 125" transform="translate(3 3.75) scale(0.94)" fill="none" stroke="#E6C66E" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <path d="M0 125 L0 42.5 C0 26.3 15 17.5 29 11.9 C40 7.5 47 4 50 0 C53 4 60 7.5 71 11.9 C85 17.5 100 26.3 100 42.5 L100 125" fill="none" stroke="#E6C66E" strokeOpacity="0.55" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            {/* The names, in gold on the silk */}
            <div className="pi-words mt-[6%] w-[86%] text-center">
              <p className="wc-khmer text-[13px] sm:text-[14px] font-medium text-[#F1D683]/90">{p.invite}</p>
              <h2 className={`mt-2 ${km ? "wc-khmer font-semibold leading-[1.35]" : "wc-display leading-tight"} text-[clamp(26px,7vw,42px)] text-[#FBEFCF]`}>
                <span className="pi-gold block"><PersonName name={p.groom.name} /></span>
                <span className="block font-light text-[0.6em] leading-[1.2] text-[#E6C66E]">&amp;</span>
                <span className="pi-gold block"><PersonName name={p.bride.name} /></span>
              </h2>
              <div aria-hidden="true" className="mx-auto mt-3 flex w-[60%] items-center gap-2">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D9B45A]" />
                <span className="h-1.5 w-1.5 rotate-45 bg-[#E6C66E]" />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D9B45A]" />
              </div>
              <p className="mt-3 wc-khmer text-[14px] sm:text-[15px] text-[#F3DFB5]">
                {p.dateLine}
                {p.timeLine ? ` · ${p.timeLine}` : ""}
              </p>
              {p.venue && <p className="mt-1 wc-khmer text-[13px] sm:text-[14px] text-[#E9D6B2]/85">{p.venue}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* The words of the invitation and the two families */}
      <div className="pi-text relative mx-auto mt-16 sm:mt-20 max-w-[640px] text-center">
        <p className="wc-khmer text-[16px] sm:text-[17px] leading-[2] text-[#3a332c]">{p.honor}</p>
        <KbachBorder className="mx-auto my-10 w-60 sm:w-72 h-auto" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-8">
          {[p.groom, null, p.bride].map((s, i) =>
            s ? (
              <div key={i} className="min-w-0">
                <p className="wc-khmer text-[12px] sm:text-[13px] font-medium text-[var(--wc-link)]">{s.parentsTitle}</p>
                {s.parents && <p className="mt-2 wc-khmer text-[14px] sm:text-[15px] leading-[1.9] text-[#2b2520]">{s.parents}</p>}
                <p className="mt-5 wc-khmer text-[12px] sm:text-[13px] text-[#6b6157]">{s.title}</p>
                <p className={`mt-1 ${km ? "wc-khmer font-semibold leading-[1.4]" : "wc-display leading-tight"} text-[20px] sm:text-[26px] text-[#2b2520]`}>
                  <PersonName name={s.name} />
                </p>
              </div>
            ) : (
              <div key={i} className="self-stretch flex flex-col items-center" aria-hidden="true">
                <span className="flex-1 w-px bg-gradient-to-b from-transparent via-[#C9A24A]/60 to-transparent" />
              </div>
            )
          )}
        </div>
        <p className="mt-12 wc-khmer text-[15px] sm:text-[16px] text-[#8B1E24]">{p.blessing}</p>
      </div>
    </section>
  );
}
