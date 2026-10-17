"use client";

import React, { useState } from "react";
import { WeddingCard, WeddingAgendaItem, WeddingReception } from "@/types/wedding";
import { updateMyWeddingCard } from "@/lib/wedding-api";
import { PremierRoyalKhmerCard } from "./PremierRoyalKhmerCard";
import { WeddingShareModal } from "./WeddingShareModal";
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
  CheckCircle2
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
  const [activeTab, setActiveTab] = useState<"details" | "schedule" | "venue" | "gift" | "settings">("details");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [lang, setLang] = useState<"km" | "en">("km");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  const t = {
    km: {
      dashboardTitle: "ផ្ទាំងគ្រប់គ្រង និងកែប្រែធៀបការ",
      saveBtn: "រក្សាទុកការកែប្រែ",
      saving: "កំពុងរក្សាទុក...",
      saved: "បានរក្សាទុកជោគជ័យ!",
      previewBtn: "មើលគំរូធៀបការ (Preview)",
      editorBtn: "ផ្ទាំងកែសម្រួល (Editor)",
      splitBtn: "មើលទន្ទឹមគ្នា (Split View)",
      tabDetails: "ព័ត៌មានកូនកំលោះ & ក្រមុំ",
      tabSchedule: "កាលវិភាគពិធី",
      tabVenue: "ទីកន្លែង & ផែនទី",
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
      tabDetails: "Bride & Groom",
      tabSchedule: "Schedule",
      tabVenue: "Venue & Map",
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
                  { id: "details", label: t.tabDetails, icon: Heart },
                  { id: "schedule", label: t.tabSchedule, icon: Clock },
                  { id: "venue", label: t.tabVenue, icon: MapPin },
                  { id: "gift", label: t.tabGift, icon: QrCode },
                  { id: "settings", label: t.tabSettings, icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as "details" | "schedule" | "venue" | "gift" | "settings")}
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

              {/* TAB 4: DIGITAL GIFT KHQR */}
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
