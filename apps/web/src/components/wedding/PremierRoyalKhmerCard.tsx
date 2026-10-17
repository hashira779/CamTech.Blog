"use client";

import React, { useState, useEffect, useRef } from "react";
import { WeddingCard, WeddingAgendaItem, WeddingReception, WeddingWish } from "@/types/wedding";
import { postWeddingWish, extractYouTubeVideoId } from "@/lib/wedding-api";
import { WeddingShareModal } from "./WeddingShareModal";
import confetti from "canvas-confetti";
import {
  Heart,
  Volume2,
  VolumeX,
  Music,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  QrCode,
  Send,
  UserCheck,
  Check,
  Copy,
  Maximize2,
  X,
  Globe,
  Gift,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Share2,
  Users
} from "lucide-react";

interface PremierRoyalKhmerCardProps {
  card: WeddingCard;
  isPreview?: boolean;
}

/**
 * Traditional Khmer Kbach Pka Chan (ផ្កាច័ន្ទ) Auspicious Motif
 */
function KhmerKbachFloral({ className = "w-8 h-8 text-amber-600" }: { className?: string }) {
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
 * Traditional Khmer Auspicious Divider with Floral Core
 */
function KhmerKbachDivider({ className = "my-4" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`}>
      <div className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#d4af37] to-[#c59b27]" />
      <KhmerKbachFloral className="w-4 h-4 text-[#c59b27]" />
      <div className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#d4af37] to-[#c59b27]" />
    </div>
  );
}

export function PremierRoyalKhmerCard({ card, isPreview = false }: PremierRoyalKhmerCardProps) {
  const [isOpen, setIsOpen] = useState(isPreview);
  const [isOpeningAnim, setIsOpeningAnim] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [lang, setLang] = useState<"km" | "en">("km");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [customGuestName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const g = params.get("guest");
      return g && g.trim() ? g.trim() : null;
    }
    return null;
  });
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Gallery slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // RSVP & Wish State
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [attendance, setAttendance] = useState<"attending" | "not_attending">("attending");
  const [guestCount, setGuestCount] = useState(1);
  const [blessingMessage, setBlessingMessage] = useState("");
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishesList, setWishesList] = useState<WeddingWish[]>(card.wishes || []);
  const [wishSuccess, setWishSuccess] = useState(false);

  // Audio Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const youtubeId = card.music_url ? extractYouTubeVideoId(card.music_url) : null;

  // Agendas
  let morningAgendas: WeddingAgendaItem[] = [];
  try {
    morningAgendas = card.morning_agenda ? JSON.parse(card.morning_agenda) : [];
  } catch {
    morningAgendas = [];
  }

  // Evening Reception
  let eveningReception: WeddingReception = {
    venue: "មជ្ឈមណ្ឌលសន្និបាត និងពិព័រណ៍ ឌឹ ព្រេមៀ សេនធ័រ សែនសុខ",
    hall: "អាគារ A (Building A)",
    time: "05:00 ល្ងាច",
    address: "ផ្លូវ 1003 សង្កាត់ភ្នំពេញថ្មី ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ",
    map_url: "https://maps.google.com/?q=The+Premier+Center+Sen+Sok+Phnom+Penh"
  };
  try {
    if (card.evening_reception) {
      eveningReception = JSON.parse(card.evening_reception);
    }
  } catch {
    // keep default
  }

  // Gallery
  let gallery: string[] = [];
  try {
    gallery = card.gallery_images ? JSON.parse(card.gallery_images) : [];
  } catch {
    gallery = [];
  }
  if (gallery.length === 0) {
    gallery = [
      card.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      card.groom_image_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      card.bride_image_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date(`${card.solar_date || "2026-11-28"}T${card.solar_time || "17:00"}:00`).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [card.solar_date, card.solar_time]);

  // Handle Envelope Open with Unfold Animation & Celebratory Confetti
  const handleOpenEnvelope = () => {
    setIsOpeningAnim(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsOpeningAnim(false);

      // Play music (YouTube or MP3)
      if (card.music_url) {
        if (youtubeId && ytIframeRef.current?.contentWindow) {
          try {
            ytIframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "playVideo", args: "" }),
              "*"
            );
            setIsPlayingMusic(true);
          } catch {}
        } else if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
        }
      }

      // Celebratory Golden & Lotus Confetti
      try {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#d4af37", "#f3e5ab", "#c59b27", "#b8324f", "#e63946", "#ffffff"]
        });
      } catch {}
    }, 600);
  };

  const toggleMusic = () => {
    if (youtubeId && ytIframeRef.current?.contentWindow) {
      const nextPlay = !isPlayingMusic;
      const cmd = nextPlay ? "playVideo" : "pauseVideo";
      try {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: cmd, args: "" }),
          "*"
        );
        setIsPlayingMusic(nextPlay);
      } catch {}
    } else if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.pause();
        setIsPlayingMusic(false);
      } else {
        audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
      }
    }
  };

  const handleCopyAccount = () => {
    if (card.khqr_account_number) {
      navigator.clipboard.writeText(card.khqr_account_number);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleCopyAddress = () => {
    if (eveningReception.address) {
      navigator.clipboard.writeText(eveningReception.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !blessingMessage.trim()) return;

    setIsSubmittingWish(true);
    try {
      const newWish = await postWeddingWish(card.slug, {
        guest_name: guestName.trim(),
        phone: guestPhone.trim() || undefined,
        attendance,
        guest_count: guestCount,
        blessing_message: blessingMessage.trim()
      });

      setWishesList([newWish, ...wishesList]);
      setGuestName("");
      setGuestPhone("");
      setBlessingMessage("");
      setWishSuccess(true);

      // Fireworks
      try {
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.7 },
          colors: ["#d4af37", "#c59b27", "#b8324f", "#f43f5e", "#ffffff"]
        });
      } catch {}

      setTimeout(() => setWishSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWish(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % gallery.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const t = {
    km: {
      auspiciousTitle: "សិរីសួស្តី អាពាហ៍ពិពាហ៍",
      auspiciousBlessing: "ជយោហោតុ សិរីសួស្តី ជ័យមង្គល វិបុលសុខ មហាប្រសើរ",
      invitationHonor: "យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា អញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍កូនប្រុស កូនស្រីរបស់យើងខ្ញុំ",
      invitedHonoredGuest: "សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយសដ៏ខ្ពង់ខ្ពស់",
      groomParentsTitle: "មាតាបិតាខាងកូនប្រុស",
      brideParentsTitle: "មាតាបិតាខាងកូនស្រី",
      groomTitle: "កូនប្រុសនាម",
      brideTitle: "កូនស្រីនាម",
      andWord: "ជាគូនឹង",
      countdownTitle: "រាប់ថយក្រោយដល់ថ្ងៃសិរីមង្គល",
      days: "ថ្ងៃ",
      hours: "ម៉ោង",
      minutes: "នាទី",
      seconds: "វិនាទី",
      morningProgram: "កម្មវិធីសិរីមង្គលពេលព្រឹក",
      eveningProgram: "ពិធីពិសាភោជនាហារ និងជប់លៀង",
      openMap: "បើក Google Maps នាំផ្លូវ",
      copyAddress: "ចម្លងអាសយដ្ឋាន",
      copied: "បានចម្លង!",
      hall: "សាលពិធី៖",
      time: "វេលាម៉ោង៖",
      address: "ទីតាំង៖",
      digitalGift: "ចងដៃតាមអេឡិចត្រូនិក (KHQR)",
      digitalGiftSub: "សម្រាប់ភ្ញៀវកិត្តិយសដែលនៅឆ្ងាយ ឬមានបំណងផ្ញើចំណងដៃជូនពរតាមរយៈប្រព័ន្ធធនាគារ",
      viewKhqr: "Scan QR Code ចងដៃ",
      close: "បិទ",
      copyAccount: "ចម្លងលេខគណនី",
      galleryTitle: "កម្រងរូបភាពអនុស្សាវរីយ៍",
      gallerySub: "ពេលវេលាដ៏ផ្អែមល្ហែម និងអត្ថន័យនៃសេចក្តីស្រឡាញ់",
      wishesTitle: "សៀវភៅជូនពរ និងឆ្លើយតប (RSVP)",
      yourName: "ឈ្មោះភ្ញៀវកិត្តិយស",
      yourPhone: "លេខទូរស័ព្ទ (មិនបង្ខំ)",
      willAttend: "នឹងចូលរួម",
      cannotAttend: "មិនអាចចូលរួម",
      numGuests: "ចំនួនភ្ញៀវចូលរួម",
      blessingPlaceholder: "សូមសរសេរពាក្យជូនពរល្អៗដល់គូស្វាមីភរិយាថ្មី...",
      sendBlessing: "ផ្ញើពាក្យជូនពរ",
      blessingSent: "សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅចំពោះពាក្យជូនពរដ៏មានអត្ថន័យ!",
      tapToOpen: "សូមចុចលើត្រាមង្គលដើម្បីបើកធៀប",
      shareInvitation: "ចែករំលែកធៀបការ",
      romanticQuote: "« ដៃកាន់ដៃ រួមដំណើរជីវិត ស្រឡាញ់ស្មោះសរហូតដល់ចាស់កោងខ្នង »",
      musicPlaying: "កំពុងចាក់ភ្លេងការ",
    },
    en: {
      auspiciousTitle: "Wedding Invitation",
      auspiciousBlessing: "Together with our families, we joyfully invite you",
      invitationHonor: "We cordially invite you to honor us with your presence and celebrate the wedding ceremony of our beloved son and daughter.",
      invitedHonoredGuest: "Cordially Invited Honored Guest",
      groomParentsTitle: "Groom's Parents",
      brideParentsTitle: "Bride's Parents",
      groomTitle: "Groom",
      brideTitle: "Bride",
      andWord: "&",
      countdownTitle: "Countdown to the Auspicious Day",
      days: "Days",
      hours: "Hours",
      minutes: "Mins",
      seconds: "Secs",
      morningProgram: "Morning Traditional Ceremonies",
      eveningProgram: "Evening Wedding Banquet & Reception",
      openMap: "Open Google Maps Navigation",
      copyAddress: "Copy Venue Address",
      copied: "Copied!",
      hall: "Hall/Building:",
      time: "Time:",
      address: "Venue:",
      digitalGift: "Digital Wedding Gift (KHQR)",
      digitalGiftSub: "For honored guests who wish to send wedding blessings electronically",
      viewKhqr: "Scan KHQR Code",
      close: "Close",
      copyAccount: "Copy Account Number",
      galleryTitle: "Our Love Story Gallery",
      gallerySub: "Cherished moments, timeless love, and memories",
      wishesTitle: "Guestbook & RSVP",
      yourName: "Your Full Name",
      yourPhone: "Phone Number (Optional)",
      willAttend: "Joyfully Accept",
      cannotAttend: "Regretfully Decline",
      numGuests: "Number of Guests",
      blessingPlaceholder: "Write your heartfelt wedding blessings for the bride and groom...",
      sendBlessing: "Send Wedding Wishes",
      blessingSent: "Thank you heartfeltly for your warm blessings!",
      tapToOpen: "Tap the royal seal to open invitation",
      shareInvitation: "Share Invitation",
      romanticQuote: "“Two souls with but a single thought, two hearts that beat as one.”",
      musicPlaying: "Playing Wedding Harmony",
    }
  }[lang];

  return (
    <div className="relative min-h-screen bg-[#f7f3ed] text-[#3c2a21] font-sans overflow-x-hidden selection:bg-amber-200 selection:text-amber-950">
      
      {/* Background audio elements */}
      {card.music_url && !youtubeId && (
        <audio ref={audioRef} loop src={card.music_url} preload="auto" />
      )}
      {card.music_url && youtubeId && (
        <div className="fixed -bottom-96 -left-96 pointer-events-none opacity-0 h-1 w-1 overflow-hidden" aria-hidden="true">
          <iframe
            ref={ytIframeRef}
            id="wedding-youtube-audio"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&loop=1&playlist=${youtubeId}`}
            allow="autoplay"
            title="Wedding Audio Player"
          />
        </div>
      )}

      {/* Floating Controls Bar (Language + Music + Share) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Language switch */}
        <button
          onClick={() => setLang(lang === "km" ? "en" : "km")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-800 text-xs font-semibold backdrop-blur-md border border-amber-300/60 shadow-lg cursor-pointer transition transform hover:scale-105"
        >
          <Globe className="w-3.5 h-3.5 text-amber-600" />
          <span>{lang === "km" ? "English" : "ភាសាខ្មែរ"}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-amber-300/60 shadow-lg backdrop-blur-md cursor-pointer transition transform hover:scale-110"
          title={t.shareInvitation}
        >
          <Share2 className="w-4 h-4 text-amber-700" />
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: LUXURY ROYAL KHMER ENVELOPE (Human-Crafted & Culturally Authentic)
         ========================================================================= */}
      {!isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-[#2b1810]/70 via-[#1c0f0a]/85 to-[#120a06]/95 backdrop-blur-md">
          
          {/* Envelope Mockup Container */}
          <div
            className={`relative w-full max-w-[420px] aspect-[4/5] bg-gradient-to-b from-[#8f1d2c] via-[#751421] to-[#540d16] rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.8)] border-[3px] border-[#e6c268]/70 p-6 sm:p-8 flex flex-col items-center justify-between text-center overflow-hidden transition-all duration-700 ${
              isOpeningAnim ? "scale-90 opacity-0 -translate-y-16" : "scale-100 opacity-100"
            }`}
          >
            {/* Corner Ornaments */}
            <div className="absolute top-3 left-3 text-[#f3d994]/60 text-xs font-serif select-none">✤ ❖ ✤</div>
            <div className="absolute top-3 right-3 text-[#f3d994]/60 text-xs font-serif select-none">✤ ❖ ✤</div>
            <div className="absolute bottom-3 left-3 text-[#f3d994]/60 text-xs font-serif select-none">✤ ❖ ✤</div>
            <div className="absolute bottom-3 right-3 text-[#f3d994]/60 text-xs font-serif select-none">✤ ❖ ✤</div>

            {/* Inner Gold Foil Hairline */}
            <div className="absolute inset-3 border border-[#f3d994]/30 rounded-[26px] pointer-events-none" />

            {/* Header with Traditional Kbach Floral Crest */}
            <div className="w-full pt-2">
              <KhmerKbachFloral className="w-10 h-10 mx-auto text-[#f5d06b] mb-2 animate-float-gentle" />
              
              <h1 className="font-moul text-xl sm:text-2xl text-[#fae5a7] tracking-wider drop-shadow-md leading-relaxed">
                {t.auspiciousTitle}
              </h1>

              <div className="h-[1px] w-28 mx-auto my-3 bg-gradient-to-r from-transparent via-[#f5d06b] to-transparent" />

              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
                {card.groom_name} &amp; {card.bride_name}
              </h2>

              <p className="text-[#f7e7be]/80 text-xs mt-1.5 font-medium">
                {card.khmer_date}
              </p>
            </div>

            {/* VIP Guest Invitation Slip */}
            <div className="w-full my-auto py-2">
              <div className="py-2.5 px-4 rounded-2xl bg-[#fffdf9]/95 border border-[#e6c268] shadow-md max-w-[320px] mx-auto text-center transform transition hover:scale-102">
                <span className="text-[11px] font-bold text-amber-900/80 block uppercase tracking-wider mb-0.5">
                  {t.invitedHonoredGuest}
                </span>
                <span className="text-sm sm:text-base font-bold font-serif text-stone-900 block truncate">
                  {customGuestName || (lang === "km" ? "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី" : "Honored Guest")}
                </span>
              </div>
            </div>

            {/* Auspicious Golden Wax Seal Disc */}
            <div className="w-full pb-2">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="group relative inline-flex flex-col items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95"
              >
                {/* Glowing Aura Ring */}
                <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 blur-md opacity-50 group-hover:opacity-85 animate-pulse transition duration-500" />

                {/* Royal Wax Seal Disc */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#f7dc89] via-[#d4af37] to-[#8c5f11] border-2 border-[#fff3cf] shadow-xl flex flex-col items-center justify-center text-amber-950">
                  <Sparkles className="w-5 h-5 text-amber-100 mb-0.5" />
                  <span className="font-moul text-[10px] text-amber-950 drop-shadow-xs">
                    {lang === "km" ? "សិរីសួស្តី" : "Open"}
                  </span>
                </div>

                <span className="mt-3 text-xs font-semibold text-[#fae5a7] tracking-wide bg-black/50 px-4 py-1.5 rounded-full border border-[#f5d06b]/40 shadow-md">
                  {t.tapToOpen}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: MOBILE-FIRST HUMAN-CRAFTED KHMER WEDDING INVITATION CARD
         ========================================================================= */}
      <main className="relative z-20 max-w-[440px] sm:max-w-[460px] mx-auto min-h-screen my-0 sm:my-8 bg-[#fffefb] rounded-none sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(100,50,20,0.22)] border-0 sm:border-[5px] sm:border-[#d4af37]/40 overflow-hidden animate-fade-in">
        
        {/* Inner Delicate Gold Hairline Border */}
        <div className="absolute inset-2 sm:inset-3 border border-[#d4af37]/35 rounded-none sm:rounded-[28px] pointer-events-none" />

        {/* =====================================================================
            1. TOP CALLIGRAPHIC HEADER & AUSPICIOUS BLESSING
           ===================================================================== */}
        <header className="relative text-center pt-10 pb-6 px-6 bg-gradient-to-b from-[#faf4e8] via-[#fbf7f0] to-[#fffefb]">
          
          {/* Top Traditional Khmer Kbach Floral Crest */}
          <KhmerKbachFloral className="w-11 h-11 mx-auto text-[#c59b27] mb-2 animate-float-gentle" />

          {/* Main Khmer Wedding Calligraphy Header (Moul Font) */}
          <h1 className="font-moul text-2xl sm:text-3xl bg-gradient-to-r from-[#996515] via-[#d4af37] to-[#804e0a] bg-clip-text text-transparent leading-relaxed drop-shadow-xs">
            {t.auspiciousTitle}
          </h1>

          <p className="text-xs font-bold text-amber-800/90 mt-1 uppercase tracking-widest">
            {t.auspiciousBlessing}
          </p>

          <KhmerKbachDivider className="my-3" />

          {/* Traditional Khmer Invitation Decree */}
          <p className="text-xs text-stone-700 leading-relaxed max-w-[360px] mx-auto font-serif italic px-2">
            « {t.invitationHonor} »
          </p>

          {/* Personalized VIP Guest Card */}
          {customGuestName && (
            <div className="mt-4 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#fdf7ea] via-[#faeed4] to-[#fdf7ea] border border-[#d4af37]/60 max-w-[340px] mx-auto text-center shadow-xs">
              <span className="text-[10px] text-amber-900 font-bold block uppercase tracking-wider">
                {t.invitedHonoredGuest}
              </span>
              <span className="text-sm sm:text-base font-bold font-serif text-stone-900 mt-0.5 block truncate">
                {customGuestName}
              </span>
            </div>
          )}
        </header>

        {/* =====================================================================
            2. PARENTS HONOR & BLESSING SECTION (មាតាបិតាទាំងសងខាង)
           ===================================================================== */}
        <section className="px-5 py-6 border-y border-[#d4af37]/25 bg-[#faf5ec]/50">
          <div className="grid grid-cols-2 gap-3 text-center">
            
            {/* Groom's Family */}
            <div className="p-3.5 rounded-2xl bg-white/95 border border-[#d4af37]/25 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                {t.groomParentsTitle}
              </span>
              <p className="text-xs font-semibold text-stone-800 leading-snug">
                {card.groom_parents}
              </p>
              <div className="mt-2.5 pt-2 border-t border-amber-200/60">
                <span className="text-[10px] text-amber-800 font-medium block">
                  {t.groomTitle}
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-serif">
                  {card.groom_name}
                </span>
              </div>
            </div>

            {/* Bride's Family */}
            <div className="p-3.5 rounded-2xl bg-white/95 border border-[#d4af37]/25 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 block mb-1">
                {t.brideParentsTitle}
              </span>
              <p className="text-xs font-semibold text-stone-800 leading-snug">
                {card.bride_parents}
              </p>
              <div className="mt-2.5 pt-2 border-t border-rose-200/60">
                <span className="text-[10px] text-rose-800 font-medium block">
                  {t.brideTitle}
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-serif">
                  {card.bride_name}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================================
            3. STAR COUPLE HERO PORTRAIT IN ROMAN ARCH FRAME (ChungDoi / CraftyZia Style)
           ===================================================================== */}
        <section className="py-8 px-6 text-center">
          
          {/* Arch Window Frame Container */}
          <div className="relative max-w-[280px] sm:max-w-[300px] mx-auto aspect-[3/4] rounded-t-[140px] rounded-b-3xl overflow-hidden shadow-[0_15px_35px_rgba(110,60,30,0.18)] border-4 border-[#d4af37]/60 p-1.5 bg-gradient-to-b from-[#f3e3b5] via-[#faf5e8] to-[#eedba6] group cursor-pointer"
            onClick={() => setSelectedImage(card.cover_image_url || card.groom_image_url || null)}
          >
            <div className="relative w-full h-full rounded-t-[132px] rounded-b-2xl overflow-hidden bg-stone-100">
              <img
                src={card.cover_image_url || card.groom_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"}
                alt={`${card.groom_name} & ${card.bride_name}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                <Maximize2 className="w-5 h-5 drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* Couple Romantic Quote */}
          <p className="text-xs font-serif italic text-stone-700 max-w-[320px] mx-auto mt-4 px-2 leading-relaxed">
            {t.romanticQuote}
          </p>

          {/* Auspicious Wedding Dates Card */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#faf4e8] via-[#f5ebd7] to-[#faf4e8] border border-[#d4af37]/50 max-w-[340px] mx-auto text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-amber-950 font-serif text-sm font-bold">
              <Calendar className="w-4 h-4 text-[#c59b27] shrink-0" />
              <span>{card.khmer_date}</span>
            </div>
            <p className="text-xs text-stone-700 font-semibold mt-1">
              ត្រូវនឹងថ្ងៃទី {card.solar_date} • វេលាម៉ោង {card.solar_time}
            </p>
          </div>
        </section>

        {/* =====================================================================
            4. WEDDING COUNTDOWN TIMER (Elegant Champagne & Gold Pills)
           ===================================================================== */}
        <section className="px-5 py-7 bg-gradient-to-b from-[#faf5ec] via-[#f7efe1] to-[#faf5ec] border-y border-[#d4af37]/25 text-center">
          <span className="text-[11px] uppercase tracking-widest font-bold text-amber-900 block mb-3 font-serif">
            {t.countdownTitle}
          </span>

          <div className="grid grid-cols-4 gap-2 max-w-[320px] mx-auto">
            {[
              { label: t.days, val: timeLeft.days },
              { label: t.hours, val: timeLeft.hours },
              { label: t.minutes, val: timeLeft.minutes },
              { label: t.seconds, val: timeLeft.seconds },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-2 sm:p-2.5 border border-[#d4af37]/40 shadow-xs text-center">
                <span className="text-xl sm:text-2xl font-black font-serif text-amber-950 block">
                  {String(item.val).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] text-stone-600 font-semibold uppercase">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            5. MORNING CEREMONY TIMELINE (Traditional Khmer Rituals)
           ===================================================================== */}
        {morningAgendas.length > 0 && (
          <section className="px-5 py-8 border-b border-[#d4af37]/20">
            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                {lang === "km" ? "កម្មវិធីសិរីមង្គល" : "Ceremony Schedule"}
              </span>
              <h3 className="font-moul text-lg sm:text-xl text-stone-900 mt-0.5">
                {t.morningProgram}
              </h3>
            </div>

            <div className="space-y-3 max-w-[360px] mx-auto">
              {morningAgendas.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#faf6ef] border border-amber-200/80 transition hover:bg-[#f6f0e4] hover:shadow-xs"
                >
                  <div className="shrink-0 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#b37a1e] to-[#996515] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================================
            6. EVENING WEDDING BANQUET & 1-TAP GOOGLE MAPS NAVIGATION
           ===================================================================== */}
        <section className="px-5 py-8 bg-gradient-to-b from-[#faf5ec]/40 to-white">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
              {lang === "km" ? "ពិធីពិសាភោជនាហារ" : "Grand Reception"}
            </span>
            <h3 className="font-moul text-lg sm:text-xl text-stone-900 mt-0.5">
              {t.eveningProgram}
            </h3>
          </div>

          <div className="max-w-[360px] mx-auto bg-white rounded-3xl p-5 border border-[#d4af37]/40 shadow-md">
            <div className="space-y-3 text-stone-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-2xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-stone-900 font-serif">
                    {eveningReception.venue}
                  </h4>
                  {eveningReception.hall && (
                    <p className="text-[11px] text-amber-900 font-bold mt-0.5">
                      {t.hall} {eveningReception.hall}
                    </p>
                  )}
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    {eveningReception.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-stone-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{t.time} <strong className="text-stone-900 font-bold">{eveningReception.time}</strong></span>
              </div>
            </div>

            {/* Action Buttons: 1-Tap Google Maps GPS + Copy Address */}
            <div className="mt-5 pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-2">
              {eveningReception.map_url && (
                <a
                  href={eveningReception.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#b37a1e] via-[#c59b27] to-[#996515] hover:brightness-105 text-white font-bold text-xs shadow-md transition transform hover:scale-[1.02] cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{t.openMap}</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyAddress}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition cursor-pointer"
              >
                {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAddress ? t.copied : t.copyAddress}</span>
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. PRE-WEDDING LOVE STORY PHOTO GALLERY
           ===================================================================== */}
        {gallery.length > 0 && (
          <section className="px-5 py-8 border-y border-[#d4af37]/20 bg-[#faf6ef]/30">
            <div className="text-center mb-5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                {t.galleryTitle}
              </span>
              <p className="text-[11px] text-stone-600 italic mt-0.5">
                {t.gallerySub}
              </p>
            </div>

            {/* Slider */}
            <div className="relative max-w-[360px] mx-auto aspect-[16/11] rounded-2xl overflow-hidden shadow-md border border-[#d4af37]/50 group">
              <img
                src={gallery[currentSlide]}
                alt={`Photo ${currentSlide + 1}`}
                className="w-full h-full object-cover transition-all duration-500"
              />

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-xs transition cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-xs transition cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedImage(gallery[currentSlide])}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/80 backdrop-blur-xs transition cursor-pointer"
                title="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex items-center justify-center gap-1.5 mt-3 overflow-x-auto py-1">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border transition cursor-pointer ${
                    currentSlide === idx ? "border-[#c59b27] scale-105 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================================
            8. DIGITAL CASHLESS WEDDING GIFT ENVELOPE (ABA / BAKONG KHQR)
           ===================================================================== */}
        {card.khqr_image_url && (
          <section className="px-5 py-8 bg-gradient-to-b from-[#faf5ec] via-[#f7efe1] to-[#faf5ec] border-b border-[#d4af37]/25 text-center">
            <div className="max-w-[340px] mx-auto p-5 rounded-3xl bg-white border border-[#d4af37]/50 shadow-md">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-moul text-sm sm:text-base text-stone-900">
                {t.digitalGift}
              </h3>
              <p className="text-[11px] text-stone-600 mt-1 mb-4 leading-relaxed">
                {t.digitalGiftSub}
              </p>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8f1d2c] via-[#751421] to-[#540d16] text-[#fae5a7] font-bold text-xs shadow-md hover:brightness-110 transition transform hover:scale-105 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{t.viewKhqr}</span>
              </button>
            </div>
          </section>
        )}

        {/* =====================================================================
            9. GUESTBOOK & RSVP (Interactive Wishes with Confetti)
           ===================================================================== */}
        {card.enable_wishes && (
          <section className="px-5 py-8 bg-gradient-to-b from-[#faf5ec]/30 to-white">
            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                {lang === "km" ? "ពរជ័យមង្គល" : "Guest Wishes"}
              </span>
              <h3 className="font-moul text-lg sm:text-xl text-stone-900 mt-0.5">
                {t.wishesTitle}
              </h3>
            </div>

            <div className="max-w-[360px] mx-auto bg-white rounded-3xl p-5 border border-[#d4af37]/40 shadow-md">
              {wishSuccess && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.blessingSent}</span>
                </div>
              )}

              <form onSubmit={handleWishSubmit} className="space-y-3">
                {/* Guest Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.yourName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={lang === "km" ? "ឧ. ម៉ៅ សុខុម" : "e.g. John Doe"}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c59b27] text-xs shadow-xs"
                  />
                </div>

                {/* RSVP Status */}
                {card.enable_rsvp && (
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {lang === "km" ? "ការចូលរួមពិធី" : "Attendance Status"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAttendance("attending")}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          attendance === "attending"
                            ? "bg-[#c59b27] text-white border-[#c59b27] shadow-xs"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t.willAttend}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendance("not_attending")}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          attendance === "not_attending"
                            ? "bg-stone-700 text-white border-stone-700 shadow-xs"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        <span>{t.cannotAttend}</span>
                      </button>
                    </div>

                    {attendance === "attending" && (
                      <div className="mt-2.5">
                        <label className="block text-[11px] text-stone-600 mb-1">
                          {t.numGuests}
                        </label>
                        <select
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#c59b27]"
                        >
                          <option value={1}>1 {lang === "km" ? "រូប" : "Person"}</option>
                          <option value={2}>2 {lang === "km" ? "រូប" : "People"}</option>
                          <option value={3}>3 {lang === "km" ? "រូប" : "People"}</option>
                          <option value={4}>4 {lang === "km" ? "រូប" : "People"}</option>
                          <option value={5}>5+ {lang === "km" ? "រូប" : "People"}</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Blessing Message */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {lang === "km" ? "ពាក្យជូនពរ" : "Blessing Message"} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={blessingMessage}
                    onChange={(e) => setBlessingMessage(e.target.value)}
                    placeholder={t.blessingPlaceholder}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c59b27] text-xs shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingWish}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#b37a1e] via-[#c59b27] to-[#996515] hover:brightness-105 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.sendBlessing}</span>
                </button>
              </form>

              {/* Wishes Wall */}
              {wishesList.length > 0 && (
                <div className="mt-6 pt-5 border-t border-stone-200 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    {lang === "km" ? `ពាក្យជូនពរពីភ្ញៀវ (${wishesList.length})` : `Guest Blessings (${wishesList.length})`}
                  </h5>
                  {wishesList.map((wish) => (
                    <div
                      key={wish.id}
                      className="p-3 rounded-2xl bg-[#faf5ec] border border-[#d4af37]/30 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 font-serif">
                          {wish.guest_name}
                        </span>
                        <span className="text-[9px] text-amber-900 font-semibold px-2 py-0.5 rounded-full bg-amber-100">
                          {wish.attendance === "attending" ? (lang === "km" ? "ចូលរួម" : "Attending") : (lang === "km" ? "មិនបានចូលរួម" : "Declined")}
                        </span>
                      </div>
                      <p className="text-stone-700 italic leading-relaxed text-[11px]">
                        « {wish.blessing_message} »
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer Note */}
        <footer className="py-8 text-center text-xs text-amber-950/70 border-t border-[#d4af37]/20 bg-[#faf5ec]/50">
          <KhmerKbachFloral className="w-5 h-5 mx-auto text-[#c59b27] mb-1.5 opacity-70" />
          <p className="font-serif font-bold text-stone-800">
            {card.groom_name} &amp; {card.bride_name}
          </p>
          <p className="text-[11px] text-stone-600 mt-0.5">
            {card.solar_date} • សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅ
          </p>
        </footer>

      </main>

      {/* =========================================================================
          MODAL: KHQR POPUP FOR ONLINE CASHLESS GIFT
         ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-500/50 text-center animate-fade-in">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-1">
              {lang === "km" ? "ចំណងដៃតាមអេឡិចត្រូនិក" : "Digital Cashless Gift"}
            </span>
            <h4 className="text-base font-bold font-serif text-stone-900">
              {card.khqr_account_name || "CHEA VISAL & SOK SOVANNARY"}
            </h4>

            {/* QR Code Frame */}
            <div className="my-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 inline-block shadow-inner">
              <img
                src={card.khqr_image_url}
                alt="Bakong KHQR Code"
                className="w-48 h-48 object-contain mx-auto rounded-lg"
              />
            </div>

            {/* Account Info & Copy */}
            {card.khqr_account_number && (
              <div className="p-2.5 rounded-xl bg-stone-100 flex items-center justify-between text-xs text-stone-800 mb-4">
                <span className="font-mono font-semibold">{card.khqr_account_number}</span>
                <button
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1 text-amber-800 hover:text-amber-900 font-bold cursor-pointer"
                >
                  {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAccount ? t.copied : t.copyAccount}</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FULLSCREEN IMAGE LIGHTBOX
         ========================================================================= */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Enlarged photo"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Wedding Share & QR Code Modal */}
      <WeddingShareModal
        card={card}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Floating Rotating Gold Audio Player Widget */}
      {card.music_url && isOpen && (
        <aside
          aria-label="Wedding Music Player"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/80 bg-white/95 backdrop-blur-md shadow-xl text-stone-900 transition-all hover:scale-105 select-none"
        >
          <button
            onClick={toggleMusic}
            aria-label={isPlayingMusic ? "ផ្អាកភ្លេងការ" : "ចាក់ភ្លេងការ"}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {/* Spinning Vinyl Record Disc */}
            <div className={`relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center ${isPlayingMusic ? 'animate-spin-slow' : ''}`}>
              <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center border border-amber-300/50">
                {isPlayingMusic ? (
                  <Music className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                )}
              </div>
            </div>

            {/* Equalizer animation */}
            <div className="flex items-end gap-0.5 h-3.5 px-0.5" aria-hidden="true">
              <span className={`w-0.5 bg-amber-600 rounded-full transition-all ${isPlayingMusic ? 'h-3 animate-pulse' : 'h-1'}`} />
              <span className={`w-0.5 bg-amber-600 rounded-full transition-all ${isPlayingMusic ? 'h-3.5 animate-bounce' : 'h-1.5'}`} style={{ animationDuration: '0.6s' }} />
              <span className={`w-0.5 bg-amber-600 rounded-full transition-all ${isPlayingMusic ? 'h-2 animate-pulse' : 'h-1'}`} style={{ animationDuration: '0.8s' }} />
              <span className={`w-0.5 bg-amber-600 rounded-full transition-all ${isPlayingMusic ? 'h-3.5 animate-bounce' : 'h-1.5'}`} style={{ animationDuration: '0.5s' }} />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-[9px] font-bold uppercase tracking-wider text-amber-800 leading-tight">
                {youtubeId ? "YouTube Audio" : "Wedding Music"}
              </div>
              <div className="text-[11px] font-semibold text-stone-800 max-w-[120px] truncate leading-tight">
                {isPlayingMusic
                  ? (lang === "km" ? "កំពុងចាក់ភ្លេងការ" : "Playing Music")
                  : (lang === "km" ? "ចុចចាក់ភ្លេង" : "Tap to Play")}
              </div>
            </div>
          </button>
        </aside>
      )}

    </div>
  );
}
