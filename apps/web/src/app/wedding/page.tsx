"use client";

import React, { useState, useEffect } from "react";
import { getStoredAuth, clearStoredAuth, fetchMyWeddingCard, DEFAULT_PREMIER_CARD } from "@/lib/wedding-api";
import { WeddingAuthResponse, WeddingCard } from "@/types/wedding";
import { UnifiedAuthModal } from "@/components/wedding/UnifiedAuthModal";
import { WeddingEditor } from "@/components/wedding/WeddingEditor";
import { PremierRoyalKhmerCard } from "@/components/wedding/PremierRoyalKhmerCard";
import { WEDDING_TEMPLATES, getTemplateById } from "@/lib/wedding-templates";
import { WeddingFlowerIcon } from "@/components/wedding/WeddingFlowers";
import {
  Sparkles,
  Globe,
  Music,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Gift,
  UserCheck,
  Palette,
  Eye,
  Check
} from "lucide-react";

export default function WeddingLandingPage() {
  const [authData, setAuthData] = useState<WeddingAuthResponse | null>(() => {
    return getStoredAuth();
  });
  const [currentCard, setCurrentCard] = useState<WeddingCard | null>(() => {
    return getStoredAuth()?.card || null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showDemoPreview, setShowDemoPreview] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("romduol_golden");
  const [lang, setLang] = useState<"km" | "en">("km");

  useEffect(() => {
    if (authData?.access_token) {
      void fetchMyWeddingCard(authData.access_token).then((card) => {
        setCurrentCard(card);
      });
    }
  }, [authData?.access_token]);

  const handleAuthSuccess = (data: WeddingAuthResponse) => {
    setAuthData(data);
    setCurrentCard(data.card);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuthData(null);
    setCurrentCard(null);
  };

  const t = {
    km: {
      heroTag: "✨ បទពិសោធន៍ថ្មីនៃពិធីមង្គលការខ្មែរ",
      heroTitle: "ធៀបការឌីជីថលបែបខ្មែរ ដ៏ប្រណីត និងឥតខ្ចោះ",
      heroDesc: "រៀបចំលិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ប្រពៃណីខ្មែរតាមទូរស័ព្ទដៃយ៉ាងស្រស់ស្អាត មានចលនាបើកស្រោមសំបុត្រ ភ្លេងការ ផែនទី Google Maps និង ABA KHQR សម្រាប់ចងដៃ online ដោយមិនបាច់ចំណាយពេលច្រើន!",
      btnStart: "ចាប់ផ្តើមបង្កើតធៀបការ / ចូលប្រើ",
      btnDemo: "មើលគំរូធៀបការ (Live Demo)",
      badgeAuto: "⚡ ចូលប្រើរហ័ស៖ ឈ្មោះ + លេខទូរស័ព្ទ + Password (Auto Sign In / Sign Up)",
      feature1Title: "ក្បាច់ខ្មែរមាស និងចលនាបើកស្រោម",
      feature1Desc: "រចនាបថរាជវាំងក្បាច់ភ្ញីទេសមាស ស្រោមសំបុត្រមានត្រាមង្គល «ជយោហោតុ» របើកយ៉ាងស្រស់ស្អាត។",
      feature2Title: "ភ្លេងការ និងនាឡិការាប់ថយក្រោយ",
      feature2Desc: "កំដរដោយបទភ្លេងការពិរោះៗ និងរាប់ថយក្រោយដល់ថ្ងៃសិរីសួស្តីមង្គលការ។",
      feature3Title: "ផែនទី Google Maps នាំភ្ញៀវដល់កន្លែង",
      feature3Desc: "ភ្ញៀវចុចតែមួយឃ្លីក នឹងបើកផែនទី Google Maps បង្ហាញផ្លូវដល់រោងការ ឬសណ្ឋាគារភ្លាម។",
      feature4Title: "ចងដៃតាម ABA / Bakong KHQR",
      feature4Desc: "ផ្ញើចំណងដៃជូនពរតាមឌីជីថល ងាយស្រួលទាំងភ្ញៀវនៅជិត និងនៅឆ្ងាយ។",
      feature5Title: "ឆ្លើយតប RSVP & សៀវភៅពាក្យជូនពរ",
      feature5Desc: "ដឹងចំនួនភ្ញៀវច្បាស់លាស់ និងទទួលពាក្យជូនពរល្អៗពីភ្ញៀវកិត្តិយសទាំងអស់។",
      feature6Title: "ពីរសាសា (ខ្មែរ & English)",
      feature6Desc: "គាំទ្រទាំងភាសាខ្មែរ និងអង់គ្លេសសម្រាប់ភ្ញៀវជាតិ និងអន្តរជាតិ។",
    },
    en: {
      heroTag: "✨ Next-Generation Khmer Wedding Experience",
      heroTitle: "Premier Khmer Digital Wedding Invitation",
      heroDesc: "Create stunning traditional Khmer wedding invitations on mobile with envelope opening animation, Khmer wedding music, Google Maps navigation, and ABA KHQR cashless gifting in minutes!",
      btnStart: "Create Invitation / Sign In",
      btnDemo: "View Live Demo",
      badgeAuto: "⚡ Unified Access: Name + Phone + Password (Auto Sign In / Register)",
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

  // If user is authenticated and has a card -> Show the Editor/Dashboard!
  if (authData && currentCard) {
    return (
      <WeddingEditor
        initialCard={currentCard}
        token={authData.access_token}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#151210] text-[#1c1917] dark:text-[#fbf9f5]">
      
      {/* Top Banner Navigation */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <span className="font-bold text-base font-serif text-amber-900 dark:text-amber-300">
              {lang === "km" ? "ធៀបការឌីជីថលខ្មែរ" : "Khmer Wedding Card"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Lang Switch */}
            <button
              onClick={() => setLang(lang === "km" ? "en" : "km")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === "km" ? "English" : "ភាសាខ្មែរ"}</span>
            </button>

            {/* Login / Register Trigger */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs shadow-md transition transform hover:scale-105 cursor-pointer"
            >
              {lang === "km" ? "ចូលប្រើ / ចុះឈ្មោះ" : "Sign In / Register"}
            </button>
          </div>

        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t.heroTag}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-serif text-stone-900 dark:text-white tracking-tight leading-tight">
            {t.heroTitle}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>

          {/* Smart Unified Auth Callout Badge */}
          <div className="max-w-md mx-auto p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{t.badgeAuto}</span>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-sm shadow-xl transition transform hover:scale-105 cursor-pointer"
            >
              <span>{t.btnStart}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDemoPreview(!showDemoPreview)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition cursor-pointer"
            >
              <span>{t.btnDemo}</span>
            </button>
          </div>

        </div>
      </section>

      {/* Live Demo Preview Drawer if toggled */}
      {showDemoPreview && (
        <section id="demo-preview-section" className="max-w-2xl mx-auto px-4 pb-16 animate-fade-in">
          <div className="p-3.5 bg-white dark:bg-stone-900 rounded-2xl border border-amber-500/40 shadow-sm mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 font-serif">
                {lang === "km"
                  ? `⚡ កំពុងមើលគំរូផ្ទាល់៖ ${getTemplateById(selectedTemplateId).nameKm}`
                  : `⚡ Live Demo Preview: ${getTemplateById(selectedTemplateId).nameEn}`}
              </span>
            </div>
            <button
              onClick={() => setShowDemoPreview(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer font-medium"
            >
              {lang === "km" ? "បិទការមើល" : "Close"}
            </button>
          </div>
          <div className="rounded-3xl border-4 border-amber-600/30 overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto">
            <PremierRoyalKhmerCard
              card={{
                ...DEFAULT_PREMIER_CARD,
                theme: selectedTemplateId,
                cover_image_url: getTemplateById(selectedTemplateId).defaultCoverImage,
                gallery_images: JSON.stringify(getTemplateById(selectedTemplateId).defaultGallery),
              }}
              isPreview={false}
            />
          </div>
        </section>
      )}

      {/* 10 Luxury Templates Showcase Section */}
      <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === "km" ? "១០ គំរូរចនាបថខ្មែរពិតៗ" : "10 Authentic Khmer Templates"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-serif text-stone-900 dark:text-white">
            {lang === "km" ? "គំរូធៀបការប្រណីត ល្អឥតខ្ចោះដោយផ្កាជាតិ និងរាជវាំង" : "Hand-Crafted Luxury Wedding Templates"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
            {lang === "km"
              ? "រចនាឡើងយ៉ាងផ្ចិតផ្ចង់ស្របតាមប្រពៃណីខ្មែរ មានរូបភាពពិតៗ ផ្កាតំណាងជាតិ (ផ្ការំដួល), ផ្កាឈូកមង្គល, ផ្កាម្លិះ, មាសរាជវាំងអង្គរ និងត្បូងមរកត"
              : "Exquisitely crafted adhering to Khmer royal wedding traditions, featuring real pre-wedding photography and authentic botanical motifs."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WEDDING_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                className={`group rounded-3xl bg-white dark:bg-stone-900 border-2 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  isSelected ? "border-amber-600 ring-2 ring-amber-500/20" : "border-stone-200 dark:border-stone-800"
                }`}
              >
                {/* Photo Preview Container with Real Photo */}
                <div className="relative aspect-[16/11] overflow-hidden bg-stone-100 dark:bg-stone-800">
                  <img
                    src={tpl.thumbnailUrl}
                    alt={tpl.nameKm}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Category badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                    <WeddingFlowerIcon type={tpl.flowerType} className="w-3.5 h-3.5 text-amber-300" />
                    <span>{tpl.badgeTextKm}</span>
                  </div>

                  {tpl.isNationalFlower && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                      ផ្កាតំណាងជាតិ
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-stone-900 dark:text-white font-serif">
                        {lang === "km" ? tpl.nameKm : tpl.nameEn}
                      </h3>
                      <div
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10 shadow-xs"
                        style={{ backgroundColor: tpl.accentColor }}
                        title="Accent Color"
                      />
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                      {lang === "km" ? tpl.taglineKm : tpl.taglineEn}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setShowDemoPreview(true);
                        const el = document.getElementById("demo-preview-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === "km" ? "មើលគំរូផ្ទាល់" : "Live Demo"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setIsAuthModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === "km" ? "បង្កើតធៀប" : "Use This"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: t.feature1Title, desc: t.feature1Desc, icon: Sparkles, color: "text-amber-600" },
            { title: t.feature2Title, desc: t.feature2Desc, icon: Music, color: "text-rose-600" },
            { title: t.feature3Title, desc: t.feature3Desc, icon: MapPin, color: "text-emerald-600" },
            { title: t.feature4Title, desc: t.feature4Desc, icon: Gift, color: "text-amber-700" },
            { title: t.feature5Title, desc: t.feature5Desc, icon: UserCheck, color: "text-indigo-600" },
            { title: t.feature6Title, desc: t.feature6Desc, icon: Globe, color: "text-sky-600" },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition"
              >
                <div className={`w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4 ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white font-serif mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Unified Auth Modal */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}
