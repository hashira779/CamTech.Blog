"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { WeddingCard } from "@/types/wedding";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Send,
  MessageCircle,
  Sparkles,
  User,
  X,
  Globe,
  Printer
} from "lucide-react";

interface WeddingShareModalProps {
  card: WeddingCard;
  isOpen: boolean;
  onClose: () => void;
}

export function WeddingShareModal({ card, isOpen, onClose }: WeddingShareModalProps) {
  const [lang, setLang] = useState<"km" | "en">("km");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [copiedPersonal, setCopiedPersonal] = useState(false);
  const [copiedFullText, setCopiedFullText] = useState(false);
  const [guestName, setGuestName] = useState("");

  const baseUrl = typeof window !== "undefined"
    ? `${window.location.origin}/wedding/${card.slug}`
    : `/wedding/${card.slug}`;

  const personalUrl = guestName.trim()
    ? `${baseUrl}?guest=${encodeURIComponent(guestName.trim())}`
    : baseUrl;

  // Build clean, formal Khmer invitation text without any website branding
  const buildInvitationMessage = (name?: string) => {
    const honored = name?.trim() ? name.trim() : "ភ្ញៀវកិត្តិយសដ៏ខ្ពង់ខ្ពស់";
    if (lang === "en") {
      return `💒 Wedding Invitation\n\nCordially inviting ${honored} to celebrate the wedding ceremony of\n🤵 ${card.groom_name} & 👰 ${card.bride_name}\n\n📅 Date: ${card.solar_date} at ${card.solar_time}\n💌 Tap the link below to open your digital wedding invitation:\n${personalUrl}`;
    }
    return `💒 សិរីសួស្តី អាពាហ៍ពិពាហ៍\n\nសូមគោរពអញ្ជើញ ${honored} ចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍កូនប្រុស កូនស្រីរបស់យើងខ្ញុំ\n\n🤵 កូនប្រុសនាម៖ ${card.groom_name}\n👰 ជាគូនឹង កូនស្រីនាម៖ ${card.bride_name}\n\n📅 កាលបរិច្ឆេទ៖ ថ្ងៃទី ${card.solar_date} វេលាម៉ោង ${card.solar_time}\n💌 សូមចុចតំណភ្ជាប់ខាងក្រោមដើម្បីបើកមើលធៀបការឌីជីថល៖\n${personalUrl}`;
  };

  // Generate QR Code
  useEffect(() => {
    if (!isOpen) return;
    const targetUrl = personalUrl;

    QRCode.toDataURL(targetUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: "#3d080e",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [isOpen, personalUrl]);

  if (!isOpen) return null;

  const handleCopyGeneral = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2000);
  };

  const handleCopyPersonal = () => {
    navigator.clipboard.writeText(personalUrl);
    setCopiedPersonal(true);
    setTimeout(() => setCopiedPersonal(false), 2000);
  };

  const handleCopyFullText = () => {
    const message = buildInvitationMessage(guestName);
    navigator.clipboard.writeText(message);
    setCopiedFullText(true);
    setTimeout(() => setCopiedFullText(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `wedding-qr-${card.slug}${guestName ? `-${guestName.trim()}` : ""}.png`;
    link.click();
  };

  const handleTelegramShare = (targetUrl: string, name?: string) => {
    const textGreeting = name
      ? `សូមគោរពអញ្ជើញ ${name} ចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ក្នុងពិធីអាពាហ៍ពិពាហ៍រវាង ${card.groom_name} & ${card.bride_name} នៅថ្ងៃទី ${card.solar_date}`
      : `លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ប្រពៃណីខ្មែរ រវាង ${card.groom_name} & ${card.bride_name} នៅថ្ងៃទី ${card.solar_date}`;

    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(textGreeting)}`;
    window.open(tgUrl, "_blank");
  };

  const handleWhatsAppShare = (targetUrl: string, name?: string) => {
    const message = buildInvitationMessage(name);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleFacebookShare = (targetUrl: string) => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
    window.open(fbUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${card.groom_name} & ${card.bride_name} - ${card.title || "សិរីសួស្តី អាពាហ៍ពិពាហ៍"}`,
          text: `សូមគោរពអញ្ជើញចូលរួមពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ ${card.groom_name} & ${card.bride_name}`,
          url: personalUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyPersonal();
    }
  };

  const t = {
    km: {
      modalTitle: "ចែករំលែកធៀបការឌីជីថល & QR Code",
      modalSubtitle: "ផ្ញើលិខិតអញ្ជើញទៅកាន់មិត្តភក្តិ និងភ្ញៀវកិត្តិយសយ៉ាងទំនើប និងឆាប់រហ័ស",
      tabQr: "QR Code សម្រាប់ស្កេន ឬព្រីន",
      tabPersonal: "បង្កើត Link ដាក់ឈ្មោះភ្ញៀវផ្ទាល់",
      guestLabel: "បញ្ចូលឈ្មោះភ្ញៀវកិត្តិយស (សម្រាប់ដាក់លើធៀប)",
      guestPlaceholder: "ឧ. ឯកឧត្តម សុខ សាន, លោកពូ និងអ្នកមីង, ក្រុមការងារ...",
      personalHint: "ពេលភ្ញៀវបើក Link នេះ ស្រោមសំបុត្រ និងលិខិតអញ្ជើញនឹងបង្ហាញឈ្មោះគាត់ផ្ទាល់ដោយស្វ័យប្រវត្តិ!",
      copyFullInvitation: "ចម្លងសារអញ្ជើញពេញលេញ & Link",
      copyFullHint: "មានសារពាក្យអញ្ជើញផ្លូវការ និងតំណភ្ជាប់ធៀបការ រួចជាស្រេចសម្រាប់ paste ក្នុង Telegram ឬ Messenger",
      downloadQr: "ទាញយក QR Code (PNG)",
      copyLink: "ចម្លង Link",
      copied: "បានចម្លង!",
      shareTelegram: "Telegram",
      shareWhatsApp: "WhatsApp",
      shareFacebook: "Facebook",
      shareNative: "កម្មវិធីផ្សេងៗ",
      scanHint: "ស្កេនដើម្បីបើកធៀបការឌីជីថល",
      printStandeeHint: "បងអាចទាញយក QR Code នេះយកទៅព្រីនដាក់លើធៀបក្រដាស ឬបិទលើ Standee មុខរោងការបាន!",
      close: "បិទ",
    },
    en: {
      modalTitle: "Share Wedding Invitation & QR Code",
      modalSubtitle: "Share your digital wedding card with friends and honored guests seamlessly",
      tabQr: "QR Code for Scanning or Printing",
      tabPersonal: "Personalized Guest Link",
      guestLabel: "Enter Honored Guest Name (Optional)",
      guestPlaceholder: "e.g. Mr. & Mrs. Smith, Dearest Friends...",
      personalHint: "When your guest opens this link, the envelope dynamically honors them by name!",
      copyFullInvitation: "Copy Formal Invitation Text & Link",
      copyFullHint: "Includes formal invitation greeting and link ready to paste in Telegram, WhatsApp, or Messenger",
      downloadQr: "Download QR Code (PNG)",
      copyLink: "Copy Link",
      copied: "Copied!",
      shareTelegram: "Telegram",
      shareWhatsApp: "WhatsApp",
      shareFacebook: "Facebook",
      shareNative: "More Apps",
      scanHint: "Scan to open digital wedding invitation",
      printStandeeHint: "You can download this QR to print on physical cards or reception entrance standees!",
      close: "Close",
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#fffdfa] dark:bg-[#1c1715] rounded-[2rem] shadow-2xl border-2 border-amber-500/50 overflow-hidden text-stone-900 dark:text-stone-100 max-h-[92vh] flex flex-col">
        
        {/* Top Gold Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 p-4 sm:p-5 text-amber-50 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-amber-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-serif">
                {t.modalTitle}
              </h3>
              <p className="text-xs text-amber-100/80 hidden sm:block">
                {card.groom_name} & {card.bride_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "km" ? "en" : "km")}
              className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === "km" ? "English" : "ភាសាខ្មែរ"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* SECTION 1: QR CODE LUXURY CARD */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:from-stone-900 dark:to-stone-900 border-2 border-amber-300 dark:border-amber-700 text-center shadow-md relative overflow-hidden">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              ✤ {t.scanHint} ✤
            </div>

            {/* QR Image Frame */}
            <div className="relative inline-block p-3 rounded-2xl bg-white shadow-xl border-4 border-amber-500/40 my-1">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Wedding Invitation QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-stone-100 rounded-lg">
                  <QrCode className="w-12 h-12 text-stone-400 animate-pulse" />
                </div>
              )}
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-3 flex items-center justify-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.printStandeeHint}</span>
            </p>

            {/* Download & Copy Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition transform hover:scale-105 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadQr}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyGeneral}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-800 dark:text-stone-200 font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                {copiedGeneral ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGeneral ? t.copied : t.copyLink}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: PERSONALIZED GUEST LINK GENERATOR */}
          <div className="p-5 rounded-3xl bg-amber-50/40 dark:bg-stone-900/40 border border-amber-200/80 dark:border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm font-serif">
              <User className="w-4 h-4" />
              <span>{t.tabPersonal}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                {t.guestLabel}
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={t.guestPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 italic leading-relaxed">
                {t.personalHint}
              </p>
            </div>

            {/* Dynamic Generated Link */}
            <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-stone-700 dark:text-stone-300 truncate">
                {personalUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyPersonal}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-200 transition cursor-pointer"
              >
                {copiedPersonal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPersonal ? t.copied : t.copyLink}</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: FORMAL INVITATION MESSAGE COPY (Clean text without any website branding) */}
          <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-stone-900/60 border border-amber-300/80 dark:border-stone-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 font-serif flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.copyFullInvitation}</span>
              </span>
              <button
                type="button"
                onClick={handleCopyFullText}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-xs transition transform hover:scale-102 cursor-pointer"
              >
                {copiedFullText ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFullText ? t.copied : t.copyLink}</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              {t.copyFullHint}
            </p>

            {/* Preview of the clean greeting message */}
            <pre className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-amber-200 dark:border-stone-800 text-[11px] font-sans text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed shadow-inner max-h-36 overflow-y-auto">
              {buildInvitationMessage(guestName)}
            </pre>
          </div>

          {/* SECTION 4: 1-CLICK INSTANT SOCIAL SHARING */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block font-serif">
              {lang === "km" ? "ផ្ញើទៅកាន់បណ្តាញសង្គម" : "Share Directly"}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Telegram */}
              <button
                type="button"
                onClick={() => handleTelegramShare(personalUrl, guestName)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => handleWhatsAppShare(personalUrl, guestName)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleFacebookShare(personalUrl)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </button>

              {/* Native Mobile Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 hover:bg-stone-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t.shareNative}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
}
