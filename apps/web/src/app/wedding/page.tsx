"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { getStoredAuth, clearStoredAuth, fetchMyWeddingCard, updateMyWeddingCard, WeddingApiError, DEFAULT_PREMIER_CARD } from "@/lib/wedding-api";
import { WeddingAuthResponse, WeddingCard } from "@/types/wedding";
import { UnifiedAuthModal } from "@/components/wedding/UnifiedAuthModal";
import { WeddingEditor } from "@/components/wedding/WeddingEditor";
import { PremierRoyalKhmerCard } from "@/components/wedding/PremierRoyalKhmerCard";
import { WEDDING_TEMPLATES, getTemplateById } from "@/lib/wedding-templates";
import { WeddingFlowerIcon, BotanicalMonogramCrest } from "@/components/wedding/WeddingFlowers";
import {
  Sparkles,
  Globe,
  Music,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Gift,
  UserCheck,
  Eye,
  X
} from "lucide-react";

/* How long each template stays in the showroom before the next one plays */
const SHOWROOM_INTERVAL = 5000;

const PETALS = [
  { left: "6%", dur: "13s", delay: "0s", color: "#f3e3b8" },
  { left: "17%", dur: "17s", delay: "4s", color: "#e8c9c0" },
  { left: "29%", dur: "14s", delay: "2s", color: "#f3e3b8" },
  { left: "44%", dur: "19s", delay: "7s", color: "#ead3b4" },
  { left: "58%", dur: "12s", delay: "1s", color: "#e8c9c0" },
  { left: "71%", dur: "16s", delay: "5s", color: "#f3e3b8" },
  { left: "83%", dur: "15s", delay: "3s", color: "#ead3b4" },
  { left: "93%", dur: "18s", delay: "8s", color: "#e8c9c0" },
];

/* Pointer-follow 3D tilt for template cards, written straight to CSS vars */
function handleTilt(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
  el.style.setProperty("--gx", `${x * 100}%`);
  el.style.setProperty("--gy", `${y * 100}%`);
}
function resetTilt(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.setProperty("--ry", "0deg");
  el.style.setProperty("--rx", "0deg");
}

/* false on the server and during hydration, true after: the saved session
   lives in localStorage, so the first client render must match the server's
   (the public landing page) or React throws the server HTML away (#418) */
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function WeddingLandingPage() {
  const hydrated = useHydrated();
  const [authData, setAuthData] = useState<WeddingAuthResponse | null>(() => {
    return getStoredAuth();
  });
  // The card always comes from the server; nothing cached in the browser stands in for it
  const [currentCard, setCurrentCard] = useState<WeddingCard | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardReload, setCardReload] = useState(0);
  // Template picked in the showroom before signing up, applied to the new card
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showDemoPreview, setShowDemoPreview] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("romduol_golden");
  const [lang, setLang] = useState<"km" | "en">("km");

  // Showroom: which template is on the phone, and whether auto-play is paused
  const [showIndex, setShowIndex] = useState(0);
  const [showPaused, setShowPaused] = useState(false);
  const showTpl = WEDDING_TEMPLATES[showIndex];

  useEffect(() => {
    const token = authData?.access_token;
    if (!token) return;
    let cancelled = false;
    fetchMyWeddingCard(token)
      .then((card) => {
        if (cancelled) return;
        setCurrentCard(card);
        setCardError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof WeddingApiError && err.status === 401) {
          // Expired or revoked session: back to sign-in
          clearStoredAuth();
          setAuthData(null);
          setCurrentCard(null);
          return;
        }
        setCardError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [authData?.access_token, cardReload]);

  useEffect(() => {
    if (showPaused || showDemoPreview) return;
    const id = window.setTimeout(() => {
      setShowIndex((i) => (i + 1) % WEDDING_TEMPLATES.length);
    }, SHOWROOM_INTERVAL);
    return () => window.clearTimeout(id);
  }, [showIndex, showPaused, showDemoPreview]);

  // The demo plays full screen: lock the page behind it and close on Escape
  useEffect(() => {
    if (!showDemoPreview) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDemoPreview(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [showDemoPreview]);

  const handleAuthSuccess = async (data: WeddingAuthResponse) => {
    setIsAuthModalOpen(false);
    let card = data.card ?? null;
    if (card && data.is_new && pendingTemplate && card.theme !== pendingTemplate) {
      try {
        card = await updateMyWeddingCard(data.access_token, { theme: pendingTemplate });
      } catch {
        // Keep the server's card; the template can still be picked in the editor
      }
    }
    setPendingTemplate(null);
    setCurrentCard(card);
    setAuthData(data);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuthData(null);
    setCurrentCard(null);
  };

  const openDemo = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowDemoPreview(true);
  }, []);

  const chooseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPendingTemplate(templateId);
    setIsAuthModalOpen(true);
  };

  const t = {
    km: {
      heroTag: "បទពិសោធន៍ថ្មីនៃពិធីមង្គលការខ្មែរ",
      heroTitle: "ធៀបការឌីជីថលបែបខ្មែរ ដ៏ប្រណីត និងឥតខ្ចោះ",
      heroDesc: "រៀបចំលិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ប្រពៃណីខ្មែរតាមទូរស័ព្ទដៃយ៉ាងស្រស់ស្អាត មានចលនាបើកស្រោមសំបុត្រ ភ្លេងការ ផែនទី Google Maps និង ABA KHQR សម្រាប់ចងដៃ online ដោយមិនបាច់ចំណាយពេលច្រើន!",
      btnStart: "ចាប់ផ្តើមបង្កើតធៀបការ",
      btnDemo: "មើលគំរូផ្ទាល់",
      badgeAuto: "ចូលប្រើរហ័ស៖ ឈ្មោះ + លេខទូរស័ព្ទ + Password",
      showroomTag: "១០ គំរូរចនាបថខ្មែរពិតៗ",
      showroomTitle: "គំរូធៀបការប្រណីត ដោយផ្កាជាតិ និងរាជវាំង",
      showroomDesc: "រចនាឡើងយ៉ាងផ្ចិតផ្ចង់ស្របតាមប្រពៃណីខ្មែរ៖ ផ្ការំដួល ផ្កាឈូក ផ្កាម្លិះ មាសរាជវាំងអង្គរ និងត្បូងមរកត",
      allTemplates: "គំរូទាំងអស់",
      liveDemo: "មើលគំរូផ្ទាល់",
      useThis: "បង្កើតធៀប",
      nationalFlower: "ផ្កាតំណាងជាតិ",
      featuresTitle: "អ្វីៗដែលភ្ញៀវត្រូវការ ក្នុងធៀបតែមួយ",
      ctaTitle: "ធៀបការដែលភ្ញៀវចង់បើកមើលម្តងទៀត",
      ctaDesc: "បង្កើតបានក្នុងរយៈពេលប៉ុន្មាននាទី ហើយចែករំលែកតាម Telegram, Facebook ឬ QR Code។",
      closeDemo: "បិទការមើល",
      feature1Title: "ក្បាច់ខ្មែរមាស និងចលនាបើកស្រោម",
      feature1Desc: "រចនាបថរាជវាំងក្បាច់ភ្ញីទេសមាស ស្រោមសំបុត្រមានត្រាក្រមួនអក្សរកាត់ឈ្មោះគូស្វាមីភរិយា បើកយ៉ាងស្រស់ស្អាត។",
      feature2Title: "ភ្លេងការ និងនាឡិការាប់ថយក្រោយ",
      feature2Desc: "កំដរដោយបទភ្លេងការពិរោះៗ និងរាប់ថយក្រោយដល់ថ្ងៃសិរីសួស្តីមង្គលការ។",
      feature3Title: "ផែនទី Google Maps នាំភ្ញៀវដល់កន្លែង",
      feature3Desc: "ភ្ញៀវចុចតែមួយឃ្លីក នឹងបើកផែនទី Google Maps បង្ហាញផ្លូវដល់រោងការ ឬសណ្ឋាគារភ្លាម។",
      feature4Title: "ចងដៃតាម ABA / Bakong KHQR",
      feature4Desc: "ផ្ញើចំណងដៃជូនពរតាមឌីជីថល ងាយស្រួលទាំងភ្ញៀវនៅជិត និងនៅឆ្ងាយ។",
      feature5Title: "ឆ្លើយតប RSVP & សៀវភៅពាក្យជូនពរ",
      feature5Desc: "ដឹងចំនួនភ្ញៀវច្បាស់លាស់ និងទទួលពាក្យជូនពរល្អៗពីភ្ញៀវកិត្តិយសទាំងអស់។",
      feature6Title: "ពីរភាសា (ខ្មែរ & English)",
      feature6Desc: "គាំទ្រទាំងភាសាខ្មែរ និងអង់គ្លេសសម្រាប់ភ្ញៀវជាតិ និងអន្តរជាតិ។",
    },
    en: {
      heroTag: "Next-Generation Khmer Wedding Experience",
      heroTitle: "Premier Khmer Digital Wedding Invitation",
      heroDesc: "Create stunning traditional Khmer wedding invitations on mobile with envelope opening animation, Khmer wedding music, Google Maps navigation, and ABA KHQR cashless gifting in minutes!",
      btnStart: "Create your invitation",
      btnDemo: "View live demo",
      badgeAuto: "Quick access: Name + Phone + Password",
      showroomTag: "10 Authentic Khmer Templates",
      showroomTitle: "Crafted from national flowers and royal gold",
      showroomDesc: "Made to Khmer wedding tradition: Romduol, lotus, jasmine, Angkor royal gold and emerald.",
      allTemplates: "All templates",
      liveDemo: "Live demo",
      useThis: "Use this",
      nationalFlower: "National flower",
      featuresTitle: "Everything your guests need, in one invitation",
      ctaTitle: "An invitation guests want to open twice",
      ctaDesc: "Ready in minutes, shared over Telegram, Facebook or a QR code.",
      closeDemo: "Close",
      feature1Title: "Royal Khmer Gold & Envelope Unseal",
      feature1Desc: "Ornate traditional gold filigree with auspicious 'Jayo Hotu' wax seal opening animation.",
      feature2Title: "Khmer Wedding Music & Countdown",
      feature2Desc: "Background traditional songs with real-time countdown to the sacred ceremony.",
      feature3Title: "One-Click Google Maps Navigation",
      feature3Desc: "Guests easily navigate to the venue or hotel reception with a single tap.",
      feature4Title: "Digital Wedding Gift via KHQR",
      feature4Desc: "Convenient cashless gift sending via ABA & Bakong KHQR code.",
      feature5Title: "RSVP Attendance & Guestbook",
      feature5Desc: "Track guest counts and receive heartfelt wedding blessings with confetti celebration.",
      feature6Title: "Bilingual (Khmer & English)",
      feature6Desc: "Full dual-language support for both local and overseas guests.",
    }
  }[lang];

  // Khmer clusters break apart under letter-spacing, so tracked labels are English-only
  const label = lang === "km" ? "text-sm font-semibold" : "text-[11px] font-semibold tracking-[0.25em] uppercase";

  // Signed in, card still loading (or the service couldn't answer)
  if (hydrated && authData && !currentCard) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 bg-[#f7f2e9] dark:bg-[#12100d]">
        {cardError ? (
          <div className="max-w-sm text-center space-y-4">
            <p className="text-sm text-stone-700 dark:text-stone-300">{cardError}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => { setCardError(null); setCardReload((n) => n + 1); }}
                className="h-10 px-5 rounded-xl bg-[#1c1610] text-amber-50 text-sm font-semibold cursor-pointer"
              >
                {lang === "km" ? "ព្យាយាមម្តងទៀត" : "Try again"}
              </button>
              <button type="button" onClick={handleLogout} className="h-10 px-4 rounded-xl text-sm text-stone-600 dark:text-stone-300 cursor-pointer">
                {lang === "km" ? "ចាកចេញ" : "Log out"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-sm text-stone-500" role="status">
            <span className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-600 animate-spin" />
            {lang === "km" ? "កំពុងបើកធៀបការរបស់អ្នក..." : "Opening your invitation..."}
          </div>
        )}
      </div>
    );
  }

  // If user is authenticated and has a card -> Show the Editor/Dashboard!
  if (hydrated && authData && currentCard) {
    return (
      <WeddingEditor
        initialCard={currentCard}
        token={authData.access_token}
        onLogout={handleLogout}
      />
    );
  }

  const demoTemplate = getTemplateById(selectedTemplateId);

  return (
    <div lang={lang} className="min-h-screen bg-[#f7f2e9] dark:bg-[#12100d] text-[#1f1b16] dark:text-[#f7f2e9] overflow-x-clip">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#14110e]/75 backdrop-blur-xl text-[#f7f2e9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <WeddingFlowerIcon type="romduol" className="w-7 h-7 text-[#e3c78f] shrink-0" />
            <span className="font-moul text-sm sm:text-base text-[#f3e3b8] truncate">
              {lang === "km" ? "ធៀបការឌីជីថលខ្មែរ" : "Khmer Wedding Card"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "km" ? "en" : "km")}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-white/20 text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === "km" ? "English" : "ភាសាខ្មែរ"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="h-10 px-4 rounded-full bg-[#f3e3b8] text-[#1f1b16] font-semibold text-xs transition hover:-translate-y-0.5 cursor-pointer"
            >
              {lang === "km" ? "ចូលប្រើ / ចុះឈ្មោះ" : "Sign In / Register"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#14110e] text-[#f7f2e9]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          {PETALS.map((p, i) => (
            <span
              key={i}
              className="wl-petal"
              style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay, background: p.color }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="absolute -right-40 -top-40 pointer-events-none">
          <BotanicalMonogramCrest initials="" className="wl-spin w-[560px] h-[560px] text-[#c9a46a]/10" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
          <div className="text-center lg:text-left">
            <p className={`wl-rise d1 inline-flex items-center gap-2 px-4 h-9 rounded-full border border-[#e3c78f]/30 text-[#e3c78f] ${label}`}>
              <Sparkles className="w-4 h-4" />
              {t.heroTag}
            </p>
            <h1
              className={`wl-rise d2 mt-6 leading-[1.35] ${
                lang === "km" ? "font-moul text-3xl sm:text-5xl" : "font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight"
              }`}
            >
              <span className="wc-foil">{t.heroTitle}</span>
            </h1>
            <p className="wl-rise d3 mt-6 text-base sm:text-lg leading-relaxed text-[#d9d0c2] max-w-xl mx-auto lg:mx-0">
              {t.heroDesc}
            </p>
            <div className="wl-rise d4 mt-9 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-[#f3e3b8] text-[#1f1b16] font-bold text-sm shadow-[0_10px_40px_-10px_rgba(227,199,143,0.6)] transition hover:-translate-y-0.5 cursor-pointer"
              >
                {t.btnStart}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openDemo(showTpl.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full border border-white/25 text-[#f7f2e9] font-semibold text-sm hover:bg-white/10 transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                {t.btnDemo}
              </button>
            </div>
            <p className="wl-rise d4 mt-5 inline-flex items-center gap-2 text-xs text-[#bfb5a5]">
              <ShieldCheck className="w-4 h-4 text-[#e3c78f]" />
              {t.badgeAuto}
            </p>
          </div>

          {/* Envelope that opens on its own, on a loop */}
          <div className="wl-rise d3 flex justify-center" aria-hidden="true">
            <div className="wl-env relative w-[min(84vw,400px)] aspect-[3/2] mt-24">
              <div className="absolute inset-0 rounded-lg bg-[#2a1f14] shadow-[0_40px_80px_rgba(0,0,0,0.6)]" />
              <div className="wl-env-letter absolute left-[4%] right-[4%] top-[5%] h-[88%] rounded-md bg-[#f7f2e9] text-[#1f1b16] flex flex-col items-center justify-center gap-1.5 px-4 text-center shadow-lg">
                <WeddingFlowerIcon type="romduol" className="w-7 h-7 text-[#b08d57]" />
                <span className="font-moul text-sm text-[#7e5f2e]">សិរីមង្គលអាពាហ៍ពិពាហ៍</span>
                <span className="font-display text-2xl">{DEFAULT_PREMIER_CARD.groom_name} &amp; {DEFAULT_PREMIER_CARD.bride_name}</span>
                <span className="text-[11px] text-stone-600">{DEFAULT_PREMIER_CARD.khmer_date}</span>
              </div>
              <div className="wl-env-pocket absolute inset-0 z-[3] rounded-lg bg-[#6e5631]" />
              <div className="wl-env-flap absolute inset-x-0 top-0 h-[66%] rounded-t-lg bg-[#8a6c3d]" />
              <span className="wl-env-seal absolute left-1/2 top-[66%] z-[5] w-[4.5rem] h-[4.5rem] rounded-full bg-[#8e2f2a] shadow-[inset_0_-4px_8px_rgba(0,0,0,0.35),0_10px_22px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <WeddingFlowerIcon type="romduol" className="w-8 h-8 text-[#f1d6c8]" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Showroom: one phone, ten Khmer templates ─────────────────────── */}
      <section
        className="relative py-20 sm:py-28 px-4 sm:px-6"
        onPointerEnter={() => setShowPaused(true)}
        onPointerLeave={() => setShowPaused(false)}
        onFocus={() => setShowPaused(true)}
        onBlur={() => setShowPaused(false)}
      >
        <div className="max-w-6xl mx-auto">
          <div className="wl-reveal text-center max-w-2xl mx-auto mb-14">
            <p className={`text-[#7e5f2e] dark:text-[#e3c78f] ${label}`}>{t.showroomTag}</p>
            <h2 className={`mt-3 ${lang === "km" ? "font-moul text-2xl sm:text-4xl leading-[1.5]" : "font-display text-4xl sm:text-5xl tracking-tight"}`}>
              {t.showroomTitle}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">{t.showroomDesc}</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
            {/* Template list */}
            <ol
              className="order-2 lg:order-1 flex gap-2.5 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible"
              aria-label={t.allTemplates}
            >
              {WEDDING_TEMPLATES.map((tpl, i) => {
                const active = i === showIndex;
                return (
                  <li key={tpl.id} className="shrink-0 w-[250px] sm:w-auto snap-start">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setShowIndex(i)}
                      className={`relative w-full overflow-hidden text-left flex items-center gap-3 min-h-16 px-3.5 py-3 rounded-2xl border transition cursor-pointer ${
                        active
                          ? "bg-white dark:bg-stone-900 border-transparent shadow-[0_12px_30px_-12px_rgba(60,40,15,0.35)]"
                          : "bg-transparent border-stone-300/70 dark:border-stone-700 hover:bg-white/60 dark:hover:bg-stone-900/60"
                      }`}
                    >
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${tpl.accentColor}22`, color: tpl.accentColor }}
                      >
                        <WeddingFlowerIcon type={tpl.flowerType} className="w-5 h-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug truncate">{lang === "km" ? tpl.nameKm : tpl.nameEn}</span>
                        <span className="block text-xs text-stone-500 dark:text-stone-400 truncate">{tpl.badgeTextKm}</span>
                      </span>
                      {active && (
                        <span
                          key={`${showIndex}-${showPaused}`}
                          aria-hidden="true"
                          className={`absolute left-0 bottom-0 h-0.5 w-full ${showPaused || showDemoPreview ? "" : "wl-progress"}`}
                          style={{ backgroundColor: tpl.accentColor, animationDuration: `${SHOWROOM_INTERVAL}ms` }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Phone that re-themes to the active template */}
            <div className="order-1 lg:order-2 flex flex-col items-center gap-6">
              <div className="relative w-[300px] h-[620px] rounded-[48px] bg-[#0f0d0b] p-3 shadow-[0_50px_100px_-30px_rgba(40,25,10,0.6)]">
                <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-[#14110e]">
                  <div key={showTpl.id} className="wl-swap absolute inset-0">
                    <img src={showTpl.defaultCoverImage} alt="" className="wl-kb absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,12,10,0.92)_10%,rgba(14,12,10,0.25)_55%,rgba(14,12,10,0.45))]" />
                  </div>
                  <div key={`${showTpl.id}-text`} className="absolute inset-x-0 bottom-0 p-6 text-center text-[#f7f2e9]">
                    <span className="wl-swap-up inline-flex w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: showTpl.accentColor }}>
                      <WeddingFlowerIcon type={showTpl.flowerType} className="w-6 h-6 text-white" />
                    </span>
                    <p className="wl-swap-up d1 font-moul text-sm" style={{ color: "#f3e3b8" }}>សិរីសួស្តី អាពាហ៍ពិពាហ៍</p>
                    <p className="wl-swap-up d1 mt-2 font-display text-[28px] leading-tight">
                      {DEFAULT_PREMIER_CARD.groom_name}
                      <span className="block text-lg italic" style={{ color: showTpl.accentColor }}>&amp;</span>
                      {DEFAULT_PREMIER_CARD.bride_name}
                    </p>
                    <div className="wl-swap-up d2 mx-auto my-4 h-px w-16" style={{ backgroundColor: showTpl.accentColor }} />
                    <div className="wl-swap-up d3 flex justify-center gap-1.5">
                      {showTpl.palette.map((c) => (
                        <span key={c} className="w-5 h-5 rounded-full ring-1 ring-white/30" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-[#0f0d0b]" />
                </div>
              </div>

              <div key={`${showTpl.id}-meta`} className="wl-swap-up text-center max-w-[320px]">
                <p className="font-semibold">{lang === "km" ? showTpl.nameKm : showTpl.nameEn}</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{lang === "km" ? showTpl.taglineKm : showTpl.taglineEn}</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => openDemo(showTpl.id)}
                  className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-stone-400 dark:border-stone-600 text-sm font-semibold hover:bg-white dark:hover:bg-stone-900 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  {t.liveDemo}
                </button>
                <button
                  type="button"
                  onClick={() => chooseTemplate(showTpl.id)}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-white text-sm font-semibold transition hover:-translate-y-0.5 cursor-pointer"
                  style={{ backgroundColor: `color-mix(in oklab, ${showTpl.accentColor} 70%, #1f1b16)` }}
                >
                  <Sparkles className="w-4 h-4" />
                  {t.useThis}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── All templates: tilt cards ───────────────────────────────────── */}
      <section className="pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className={`wl-reveal mb-8 ${lang === "km" ? "font-moul text-xl sm:text-2xl" : "font-display text-3xl sm:text-4xl tracking-tight"}`}>{t.allTemplates}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WEDDING_TEMPLATES.map((tpl) => (
              <article
                key={tpl.id}
                onPointerMove={handleTilt}
                onPointerLeave={resetTilt}
                className="wl-reveal wl-tilt relative rounded-[28px] overflow-hidden bg-[#14110e] text-[#f7f2e9] aspect-[4/5] flex flex-col justify-end"
              >
                <img src={tpl.thumbnailUrl} alt={lang === "km" ? tpl.nameKm : tpl.nameEn} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,12,10,0.95)_8%,rgba(14,12,10,0.15)_60%)]" />
                <div aria-hidden="true" className="wl-glare absolute inset-0 pointer-events-none" />

                <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/45 backdrop-blur-md text-xs font-semibold">
                    <WeddingFlowerIcon type={tpl.flowerType} className="w-3.5 h-3.5 text-[#f3e3b8]" />
                    {tpl.badgeTextKm}
                  </span>
                  {tpl.isNationalFlower && (
                    <span className="h-8 px-3 inline-flex items-center rounded-full bg-[#f3e3b8] text-[#1f1b16] text-xs font-bold">
                      {t.nationalFlower}
                    </span>
                  )}
                </div>

                <div className="relative p-6">
                  <div className="flex gap-1.5 mb-3">
                    {tpl.palette.map((c) => (
                      <span key={c} className="w-4 h-4 rounded-full ring-1 ring-white/30" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold leading-snug">{lang === "km" ? tpl.nameKm : tpl.nameEn}</h3>
                  <p className="mt-1.5 text-sm text-white/75 line-clamp-2 leading-relaxed">{lang === "km" ? tpl.taglineKm : tpl.taglineEn}</p>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openDemo(tpl.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-sm font-semibold hover:bg-white/25 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      {t.liveDemo}
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseTemplate(tpl.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-full bg-[#f3e3b8] text-[#1f1b16] text-sm font-semibold hover:bg-white transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t.useThis}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className={`wl-reveal text-center max-w-2xl mx-auto mb-12 ${lang === "km" ? "font-moul text-2xl sm:text-3xl leading-[1.5]" : "font-display text-4xl sm:text-5xl tracking-tight"}`}>
            {t.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: t.feature1Title, desc: t.feature1Desc, icon: Sparkles },
              { title: t.feature2Title, desc: t.feature2Desc, icon: Music },
              { title: t.feature3Title, desc: t.feature3Desc, icon: MapPin },
              { title: t.feature4Title, desc: t.feature4Desc, icon: Gift },
              { title: t.feature5Title, desc: t.feature5Desc, icon: UserCheck },
              { title: t.feature6Title, desc: t.feature6Desc, icon: Globe },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="wl-reveal group p-7 rounded-[28px] bg-white/80 dark:bg-stone-900 border border-[#e7ddcb] dark:border-stone-800 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(60,40,15,0.35)]"
                >
                  <span className="w-12 h-12 rounded-2xl bg-[#efe6d4] dark:bg-stone-800 text-[#7e5f2e] dark:text-[#e3c78f] flex items-center justify-center mb-5 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                    <Icon className="w-6 h-6" />
                  </span>
                  <h3 className="text-base font-semibold mb-2">{feat.title}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="wl-zoom relative overflow-hidden max-w-6xl mx-auto rounded-[36px] bg-[#14110e] dark:bg-[#1c1813] dark:border dark:border-[#e3c78f]/15 text-[#f7f2e9] px-6 py-16 sm:py-24 text-center">
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <BotanicalMonogramCrest initials="" className="wl-spin w-[620px] h-[620px] text-[#c9a46a]/10" />
          </div>
          <div className="relative">
            <h2 className={lang === "km" ? "font-moul text-2xl sm:text-4xl leading-[1.5]" : "font-display text-4xl sm:text-6xl tracking-tight"}>
              <span className="wc-foil">{t.ctaTitle}</span>
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-base text-[#d9d0c2] leading-relaxed">{t.ctaDesc}</p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-9 inline-flex items-center gap-2 h-14 px-8 rounded-full bg-[#f3e3b8] text-[#1f1b16] font-bold text-sm transition hover:-translate-y-0.5 cursor-pointer"
            >
              {t.btnStart}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Full-screen live demo ───────────────────────────────────────── */}
      {showDemoPreview && (
        <div
          id="demo-preview-section"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "km" ? demoTemplate.nameKm : demoTemplate.nameEn}
          className="fixed inset-0 z-[60] overflow-y-auto bg-[#f7f2e9]"
        >
          <button
            type="button"
            onClick={() => setShowDemoPreview(false)}
            className="fixed top-4 left-4 z-[70] inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-black/60 text-white backdrop-blur-xl text-xs font-semibold cursor-pointer"
          >
            <X className="w-4 h-4" />
            {t.closeDemo}
          </button>
          <PremierRoyalKhmerCard
            key={selectedTemplateId}
            card={{
              ...DEFAULT_PREMIER_CARD,
              theme: selectedTemplateId,
              cover_image_url: demoTemplate.defaultCoverImage,
              gallery_images: JSON.stringify(demoTemplate.defaultGallery),
            }}
            isPreview={false}
          />
        </div>
      )}

      {/* Unified Auth Modal */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
