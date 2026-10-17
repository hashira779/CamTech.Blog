"use client";

import React, { useState, useEffect } from "react";
import { WeddingCard, WeddingAgendaItem, WeddingReception, CuratedSong, YouTubeResolveResponse } from "@/types/wedding";
import {
  updateMyWeddingCard,
  resolveYouTubeAudio,
  fetchCuratedSongs,
  DEFAULT_CURATED_SONGS,
  extractYouTubeVideoId
} from "@/lib/wedding-api";
import { WEDDING_TEMPLATES, getTemplateById, WeddingTemplateDefinition } from "@/lib/wedding-templates";
import { WeddingFlowerIcon } from "./WeddingFlowers";
import { PremierRoyalKhmerCard } from "./PremierRoyalKhmerCard";
import { WeddingShareModal } from "./WeddingShareModal";
import confetti from "canvas-confetti";
import {
  Save,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Edit3,
  Clock,
  MapPin,
  Heart,
  QrCode,
  Sparkles,
  Globe,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Music,
  Search,
  Play,
  Pause,
  Loader2,
  Headphones,
  Radio,
  Palette,
} from "lucide-react";

interface WeddingEditorProps {
  initialCard: WeddingCard;
  token: string;
  onLogout: () => void;
}

export function WeddingEditor({ initialCard, token, onLogout }: WeddingEditorProps) {
  const [card, setCard] = useState<WeddingCard>(initialCard);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "details" | "schedule" | "venue" | "music" | "gift" | "settings">("templates");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [lang, setLang] = useState<"km" | "en">("km");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // YouTube Music Scanner & Studio State
  const [youtubeInput, setYoutubeInput] = useState(card.music_url || "");
  const [isScanningYoutube, setIsScanningYoutube] = useState(false);
  const [scannedSong, setScannedSong] = useState<YouTubeResolveResponse | null>(null);
  const [curatedSongs, setCuratedSongs] = useState<CuratedSong[]>(DEFAULT_CURATED_SONGS);
  const [previewAudioId, setPreviewAudioId] = useState<string | null>(null);

  useEffect(() => {
    fetchCuratedSongs().then(setCuratedSongs).catch(() => {});
  }, []);

  const handleSelectTemplate = (tpl: WeddingTemplateDefinition) => {
    setCard((prev) => ({
      ...prev,
      theme: tpl.id,
      cover_image_url: (!prev.cover_image_url || prev.cover_image_url.includes("photo-1519741497674"))
        ? tpl.defaultCoverImage
        : prev.cover_image_url,
    }));
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: [tpl.accentColor, "#d4af37", "#ffffff"]
      });
    } catch {}
  };

  // Agenda items parse
  let parsedAgenda: WeddingAgendaItem[] = [];
  try {
    parsedAgenda = card.morning_agenda ? JSON.parse(card.morning_agenda) : [];
  } catch {
    parsedAgenda = [];
  }

  // Evening reception parse
  let parsedEvening: WeddingReception = {
    venue: "មជ្ឈមណ្ឌលសន្និបាត និងពិព័រណ៍ ឌឹ ព្រេមៀ សេនធ័រ សែនសុខ",
    hall: "អាគារ A",
    time: "05:00 ល្ងាច",
    address: "ផ្លូវ 1003 សង្កាត់ភ្នំពេញថ្មី រាជធានីភ្នំពេញ",
    map_url: "https://maps.google.com/?q=The+Premier+Center+Sen+Sok+Phnom+Penh"
  };
  try {
    if (card.evening_reception) parsedEvening = JSON.parse(card.evening_reception);
  } catch {}

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMyWeddingCard(token, card);
      setCard(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAgendaChange = (index: number, field: keyof WeddingAgendaItem, val: string) => {
    const next = [...parsedAgenda];
    next[index] = { ...next[index], [field]: val };
    setCard({ ...card, morning_agenda: JSON.stringify(next) });
  };

  const addAgendaItem = () => {
    const next = [...parsedAgenda, { time: "08:00 ព្រឹក", title: "កម្មវិធីថ្មី", description: "ការពិពណ៌នា..." }];
    setCard({ ...card, morning_agenda: JSON.stringify(next) });
  };

  const removeAgendaItem = (index: number) => {
    const next = parsedAgenda.filter((_, i) => i !== index);
    setCard({ ...card, morning_agenda: JSON.stringify(next) });
  };

  const handleEveningChange = (field: keyof WeddingReception, val: string) => {
    const next = { ...parsedEvening, [field]: val };
    setCard({ ...card, evening_reception: JSON.stringify(next) });
  };

  const invitationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/wedding/${card.slug}`
    : `/wedding/${card.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScanYoutube = async () => {
    if (!youtubeInput.trim()) return;
    setIsScanningYoutube(true);
    try {
      const result = await resolveYouTubeAudio(youtubeInput.trim());
      setScannedSong(result);
      if (result.valid && result.music_url) {
        setCard({ ...card, music_url: result.music_url });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningYoutube(false);
    }
  };

  const handleSelectCuratedSong = (song: CuratedSong) => {
    setCard({ ...card, music_url: song.youtube_url });
    setYoutubeInput(song.youtube_url);
    setScannedSong({
      valid: true,
      video_id: song.video_id,
      title: song.title_km,
      author_name: song.category,
      thumbnail_url: song.thumbnail_url,
      music_url: song.youtube_url,
      embed_url: `https://www.youtube.com/embed/${song.video_id}?enablejsapi=1&autoplay=1`
    });
  };

  const t = {
    km: {
      dashboardTitle: "ផ្ទាំងគ្រប់គ្រង និងកែប្រែធៀបការ",
      saveBtn: "រក្សាទុកការកែប្រែ",
      saving: "កំពុងរក្សាទុក...",
      saved: "បានរក្សាទុកជោគជ័យ!",
      previewBtn: "មើលគំរូធៀបការ (Preview)",
      editorBtn: "ផ្ទាំងកែសម្រួល (Editor)",
      splitBtn: "មើលទន្ទឹមគ្នា (Split View)",
      tabTemplates: "🎨 ១០ គំរូ Template",
      tabDetails: "ព័ត៌មានកូនកំលោះ & ក្រមុំ",
      tabSchedule: "កាលវិភាគពិធី",
      tabVenue: "ទីកន្លែង & ផែនទី",
      tabMusic: "បទភ្លេងការ & YouTube",
      tabGift: "ចងដៃ KHQR",
      tabSettings: "ការកំណត់ & Link",
      copyLink: "ចម្លង Link ធៀបការ",
      copied: "បានចម្លង!",
      viewLive: "បើកមើលផ្ទាល់",
      logout: "ចាកចេញ",
    },
    en: {
      dashboardTitle: "Wedding Invitation Dashboard & Editor",
      saveBtn: "Save Changes",
      saving: "Saving...",
      saved: "Saved successfully!",
      previewBtn: "Preview",
      editorBtn: "Editor",
      splitBtn: "Split View",
      tabTemplates: "🎨 10 Templates",
      tabDetails: "Bride & Groom",
      tabSchedule: "Schedule",
      tabVenue: "Venue & Map",
      tabMusic: "Music & YouTube",
      tabGift: "KHQR Gift",
      tabSettings: "Settings & Link",
      copyLink: "Copy Link",
      copied: "Copied!",
      viewLive: "Open Live Card",
      logout: "Log Out",
    }
  }[lang];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-900 dark:text-white leading-tight font-serif">
                {t.dashboardTitle}
              </h1>
              <p className="text-xs text-stone-500">
                Slug: <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">{card.slug}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            
            {/* View Mode Buttons (Desktop) */}
            <div className="hidden md:flex items-center p-1 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs">
              <button
                onClick={() => setViewMode("editor")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "editor" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs" : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                {t.editorBtn}
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "split" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs" : "text-stone-600 dark:text-stone-300"
                }`}
              >
                {t.splitBtn}
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "preview" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs" : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                {t.previewBtn}
              </button>
            </div>

            {/* Language switcher */}
            <button
              onClick={() => setLang(lang === "km" ? "en" : "km")}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === "km" ? "English" : "ខ្មែរ"}</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t.copied : t.copyLink}</span>
            </button>

            {/* Share & QR Code Modal Trigger */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-600 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold hover:from-amber-500 hover:to-amber-600 transition cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{lang === "km" ? "ចែករំលែក & QR" : "Share & QR"}</span>
            </button>

            {/* Live Open */}
            <a
              href={`/wedding/${card.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
            >
              <span>{t.viewLive}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t.saving : t.saveBtn}</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              {t.logout}
            </button>

          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Saved Alert Toast */}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.saved}</span>
          </div>
        )}

        <div className={`grid gap-6 ${viewMode === "split" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
          
          {/* ===============================================================
              LEFT COLUMN: EDITOR FORM
             =============================================================== */}
          {(viewMode === "split" || viewMode === "editor") && (
            <div className={`${viewMode === "split" ? "lg:col-span-6 xl:col-span-5" : "max-w-3xl mx-auto w-full"} space-y-6`}>
              
              {/* Form Tab Navigation */}
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-x-auto shadow-xs text-xs">
                {[
                  { id: "templates", label: t.tabTemplates, icon: Palette },
                  { id: "details", label: t.tabDetails, icon: Heart },
                  { id: "schedule", label: t.tabSchedule, icon: Clock },
                  { id: "venue", label: t.tabVenue, icon: MapPin },
                  { id: "music", label: t.tabMusic, icon: Music },
                  { id: "gift", label: t.tabGift, icon: QrCode },
                  { id: "settings", label: t.tabSettings, icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as "templates" | "details" | "schedule" | "venue" | "music" | "gift" | "settings")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 0: 10 AUTHENTIC LUXURY TEMPLATES */}
              {activeTab === "templates" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        <span>ជ្រើសរើសទម្រង់រចនា (10 Authentic Khmer Templates)</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        ផ្កាតំណាងជាតិ (ផ្ការំដួល), ផ្កាឈូកមង្គល, ផ្កាម្លិះ, មាសអង្គរ និងរាជវាំងបុរាណ
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300">
                      10 Templates
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {WEDDING_TEMPLATES.map((tpl) => {
                      const isSelected = card.theme === tpl.id || (!card.theme && tpl.id === "romduol_golden");
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`relative rounded-2xl p-3 border-2 transition cursor-pointer flex flex-col justify-between group overflow-hidden ${
                            isSelected
                              ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20"
                              : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-400 hover:shadow-xs"
                          }`}
                        >
                          {/* Thumbnail with Real Photo */}
                          <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-2 bg-stone-100 dark:bg-stone-800">
                            <img
                              src={tpl.thumbnailUrl}
                              alt={tpl.nameKm}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            
                            {/* Flower Badge & Category */}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold">
                              <WeddingFlowerIcon type={tpl.flowerType} className="w-3.5 h-3.5 text-amber-300" />
                              <span>{tpl.badgeTextKm}</span>
                            </div>

                            {isSelected && (
                              <div className="absolute top-2 right-2 p-1 rounded-full bg-amber-600 text-white shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                                {lang === "km" ? tpl.nameKm : tpl.nameEn}
                              </h4>
                              <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-xs" style={{ backgroundColor: tpl.accentColor }} />
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                              {lang === "km" ? tpl.taglineKm : tpl.taglineEn}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <span className="text-[10px] text-stone-400 font-mono">
                              {tpl.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                                isSelected
                                  ? "bg-amber-600 text-white"
                                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:bg-amber-100 group-hover:text-amber-800"
                              }`}
                            >
                              {isSelected ? (lang === "km" ? "✓ កំពុងប្រើ" : "Active") : (lang === "km" ? "ជ្រើសរើស" : "Select")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 1: DETAILS */}
              {activeTab === "details" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>ព័ត៌មានកូនកំលោះ និងកូនក្រមុំ</span>
                  </h3>

                  {/* Groom Section */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-stone-800/40 border border-amber-200/50 space-y-3">
                    <span className="text-xs font-bold uppercase text-amber-700">ខាងកូនប្រុស</span>
                    <div>
                      <label className="block text-xs font-semibold mb-1">ឈ្មោះកូនប្រុស</label>
                      <input
                        type="text"
                        value={card.groom_name}
                        onChange={(e) => setCard({ ...card, groom_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">តួនាទី (ឧ. កូនប្រុសច្បង, កូនប្រុសពៅ)</label>
                      <input
                        type="text"
                        value={card.groom_title}
                        onChange={(e) => setCard({ ...card, groom_title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">ឈ្មោះមាតាបិតាខាងប្រុស</label>
                      <input
                        type="text"
                        value={card.groom_parents}
                        onChange={(e) => setCard({ ...card, groom_parents: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">រូបថតកូនប្រុស (Image URL)</label>
                      <input
                        type="text"
                        value={card.groom_image_url || ""}
                        onChange={(e) => setCard({ ...card, groom_image_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Bride Section */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-stone-800/40 border border-rose-200/50 space-y-3">
                    <span className="text-xs font-bold uppercase text-rose-700">ខាងកូនស្រី</span>
                    <div>
                      <label className="block text-xs font-semibold mb-1">ឈ្មោះកូនស្រី</label>
                      <input
                        type="text"
                        value={card.bride_name}
                        onChange={(e) => setCard({ ...card, bride_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">តួនាទី (ឧ. កូនស្រីច្បង, កូនស្រីពៅ)</label>
                      <input
                        type="text"
                        value={card.bride_title}
                        onChange={(e) => setCard({ ...card, bride_title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">ឈ្មោះមាតាបិតាខាងស្រី</label>
                      <input
                        type="text"
                        value={card.bride_parents}
                        onChange={(e) => setCard({ ...card, bride_parents: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">រូបថតកូនស្រី (Image URL)</label>
                      <input
                        type="text"
                        value={card.bride_image_url || ""}
                        onChange={(e) => setCard({ ...card, bride_image_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1">ថ្ងៃខែឆ្នាំតាមចន្ទគតិខ្មែរ</label>
                      <input
                        type="text"
                        value={card.khmer_date}
                        onChange={(e) => setCard({ ...card, khmer_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">កាលបរិច្ឆេទ (Solar Date)</label>
                        <input
                          type="date"
                          value={card.solar_date}
                          onChange={(e) => setCard({ ...card, solar_date: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">ម៉ោងពិធីពិសាភោជនាហារ</label>
                        <input
                          type="text"
                          value={card.solar_time}
                          onChange={(e) => setCard({ ...card, solar_time: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: SCHEDULE */}
              {activeTab === "schedule" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>កាលវិភាគពិធីពេលព្រឹក</span>
                    </h3>
                    <button
                      onClick={addAgendaItem}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>បន្ថែមកម្មវិធី</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {parsedAgenda.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2 relative">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => handleAgendaChange(idx, "time", e.target.value)}
                            placeholder="07:00 ព្រឹក"
                            className="w-32 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs font-semibold bg-white dark:bg-stone-900"
                          />
                          <button
                            onClick={() => removeAgendaItem(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="លុប"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleAgendaChange(idx, "title", e.target.value)}
                          placeholder="ចំណងជើងពិធី (ឧ. ពិធីហែកំណត់)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs font-bold bg-white dark:bg-stone-900"
                        />
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => handleAgendaChange(idx, "description", e.target.value)}
                          placeholder="ការពិពណ៌នា..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-xs bg-white dark:bg-stone-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: VENUE & GOOGLE MAPS */}
              {activeTab === "venue" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>ទីកន្លែងពិធីពិសាភោជនាហារ និងផែនទី</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold mb-1">ឈ្មោះទីកន្លែង / សណ្ឋាគារ / រោងការ</label>
                    <input
                      type="text"
                      value={parsedEvening.venue}
                      onChange={(e) => handleEveningChange("venue", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">សាល ឬ អាគារ (Hall / Building)</label>
                    <input
                      type="text"
                      value={parsedEvening.hall || ""}
                      onChange={(e) => handleEveningChange("hall", e.target.value)}
                      placeholder="ឧ. អាគារ A ឬ សាលកែវមរកត"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">អាសយដ្ឋានទីតាំង</label>
                    <textarea
                      rows={2}
                      value={parsedEvening.address}
                      onChange={(e) => handleEveningChange("address", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Google Maps URL</label>
                    <input
                      type="text"
                      value={parsedEvening.map_url}
                      onChange={(e) => handleEveningChange("map_url", e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: WEDDING MUSIC & YOUTUBE SCANNER */}
              {activeTab === "music" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                      <Music className="w-4 h-4 text-amber-600" />
                      <span>{lang === "km" ? "បទភ្លេងការ និងតន្ត្រីប្រពៃណី (Wedding Music Studio)" : "Wedding Music Studio & YouTube Scanner"}</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {lang === "km"
                        ? "អ្នកអាចស្កេនបទចម្រៀងពី YouTube ឬជ្រើសរើសបទភ្លេងការបុរាណខ្មែរពេញនិយមខាងក្រោម ដើម្បីចាក់អមជាមួយធៀបការឌីជីថលរបស់អ្នក។"
                        : "Scan any YouTube video/song link or pick from curated traditional Khmer wedding classics below."}
                    </p>
                  </div>

                  {/* YouTube Scanner Input */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 space-y-3">
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                      {lang === "km" ? "បញ្ចូល Link ចម្រៀង YouTube (YouTube URL)" : "Paste YouTube Song Link"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={youtubeInput}
                        onChange={(e) => setYoutubeInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... ឬ https://youtu.be/..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleScanYoutube}
                        disabled={isScanningYoutube || !youtubeInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        {isScanningYoutube ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{lang === "km" ? "កំពុងស្កេន..." : "Scanning..."}</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>{lang === "km" ? "ស្កេនបទចម្រៀង" : "Scan Song"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Scanned YouTube Song Live Card */}
                  {scannedSong && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/40 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                          <Radio className="w-3 h-3 animate-pulse" />
                          {lang === "km" ? "បទចម្រៀងដែលបានស្កេន" : "Scanned YouTube Song"}
                        </span>
                        {card.music_url === scannedSong.music_url && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {lang === "km" ? "បានភ្ជាប់ក្នុងធៀបការ" : "Linked to Card"}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 items-center">
                        {scannedSong.thumbnail_url && (
                          <img
                            src={scannedSong.thumbnail_url}
                            alt="YouTube Thumbnail"
                            className="w-20 h-14 object-cover rounded-xl border border-amber-500/30 shadow-xs"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {scannedSong.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 truncate">
                            {scannedSong.author_name}
                          </p>
                          <p className="text-[10px] text-amber-600 font-mono truncate mt-0.5">
                            {scannedSong.music_url}
                          </p>
                        </div>
                      </div>

                      {/* Embedded Test Player */}
                      {scannedSong.video_id && (
                        <div className="pt-2 border-t border-amber-500/20">
                          <iframe
                            className="w-full h-32 rounded-xl border border-stone-200 dark:border-stone-800"
                            src={`https://www.youtube.com/embed/${scannedSong.video_id}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title="YouTube Preview"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Curated Traditional Khmer Wedding Classics */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 font-serif">
                        <Headphones className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lang === "km" ? "ភ្លេងការបុរាណខ្មែរពេញនិយម (Curated Classics)" : "Curated Khmer Wedding Classics"}</span>
                      </h4>
                      <span className="text-[10px] text-stone-400">
                        {lang === "km" ? "ចុចជ្រើសរើសភ្លាមៗ" : "1-Click Select"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {curatedSongs.map((song) => {
                        const isSelected = card.music_url?.includes(song.video_id);
                        return (
                          <div
                            key={song.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? "border-amber-500 bg-amber-500/10 shadow-xs"
                                : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-amber-400"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-amber-500/30">
                                <img
                                  src={song.thumbnail_url}
                                  alt={song.title_km}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] text-amber-600 font-semibold leading-tight">
                                  {song.category}
                                </div>
                                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate leading-tight mt-0.5">
                                  {lang === "km" ? song.title_km : song.title_en}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectCuratedSong(song)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer ${
                                isSelected
                                  ? "bg-amber-600 text-white"
                                  : "bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              }`}
                            >
                              {isSelected ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>{lang === "km" ? "កំពុងប្រើ" : "Active"}</span>
                                </span>
                              ) : (
                                <span>{lang === "km" ? "ជ្រើសរើស" : "Select"}</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Audio / MP3 Fallback */}
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      {lang === "km" ? "ឬបញ្ចូល URL Audio / MP3 ផ្ទាល់" : "Or Direct MP3 Audio URL"}
                    </label>
                    <input
                      type="text"
                      value={card.music_url || ""}
                      onChange={(e) => {
                        setCard({ ...card, music_url: e.target.value });
                        setYoutubeInput(e.target.value);
                      }}
                      placeholder="https://.../wedding-audio.mp3"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: DIGITAL GIFT KHQR */}
              {activeTab === "gift" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    <span>ចំណងដៃតាមអេឡិចត្រូនិក (ABA / Bakong KHQR)</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold mb-1">ឈ្មោះម្ចាស់គណនី (Account Name)</label>
                    <input
                      type="text"
                      value={card.khqr_account_name || ""}
                      onChange={(e) => setCard({ ...card, khqr_account_name: e.target.value })}
                      placeholder="CHEA VISAL & SOK SOVANNARY"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">លេខគណនីធនាគារ (Account Number)</label>
                    <input
                      type="text"
                      value={card.khqr_account_number || ""}
                      onChange={(e) => setCard({ ...card, khqr_account_number: e.target.value })}
                      placeholder="000 123 456 (ABA Bank)"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">រូបភាព QR Code (Image URL)</label>
                    <input
                      type="text"
                      value={card.khqr_image_url || ""}
                      onChange={(e) => setCard({ ...card, khqr_image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {activeTab === "settings" && (
                <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>ការកំណត់ទូទៅ និងតំណភ្ជាប់</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold mb-1">តំណភ្ជាប់ផ្ទាល់ខ្លួន (Custom Slug)</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-l-xl border border-r-0 border-stone-300 dark:border-stone-700 text-xs font-mono">
                        /wedding/
                      </span>
                      <input
                        type="text"
                        value={card.slug}
                        onChange={(e) => setCard({ ...card, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                        className="w-full px-3 py-2 rounded-r-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">បទភ្លេងការ (Music Audio URL)</label>
                    <input
                      type="text"
                      value={card.music_url || ""}
                      onChange={(e) => setCard({ ...card, music_url: e.target.value })}
                      placeholder="https://.../music.mp3"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={card.enable_rsvp}
                        onChange={(e) => setCard({ ...card, enable_rsvp: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold">បើកឱ្យភ្ញៀវឆ្លើយតបការចូលរួម (Enable RSVP)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={card.enable_wishes}
                        onChange={(e) => setCard({ ...card, enable_wishes: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold">បើកសៀវភៅពាក្យជូនពរពីភ្ញៀវ (Enable Guestbook Wishes)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={card.is_published}
                        onChange={(e) => setCard({ ...card, is_published: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold">ផ្សព្វផ្សាយជាសាធារណៈ (Publish Card)</span>
                    </label>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===============================================================
              RIGHT COLUMN: LIVE MOBILE FRAME PREVIEW
             =============================================================== */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className={`${viewMode === "split" ? "lg:col-span-6 xl:col-span-7" : "max-w-2xl mx-auto w-full"}`}>
              <div className="sticky top-20">
                <div className="p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 font-serif flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ការបង្ហាញផ្ទាល់ (Live Preview - &quot;Royal Khmer Gold&quot;)</span>
                  </span>
                  <span className="text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full font-mono">
                    Template: Premier Royal Khmer
                  </span>
                </div>

                {/* Mobile Preview Frame */}
                <div className="rounded-3xl border-4 border-stone-300 dark:border-stone-800 overflow-hidden shadow-2xl max-h-[82vh] overflow-y-auto">
                  <PremierRoyalKhmerCard card={card} isPreview={true} />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Share & QR Code Modal */}
      <WeddingShareModal
        card={card}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

    </div>
  );
}
