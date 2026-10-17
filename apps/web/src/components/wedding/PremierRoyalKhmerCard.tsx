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
  Share2
} from "lucide-react";

interface PremierRoyalKhmerCardProps {
  card: WeddingCard;
  isPreview?: boolean;
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const youtubeId = card.music_url ? extractYouTubeVideoId(card.music_url) : null;

  // Parse JSON data safely
  let morningAgendas: WeddingAgendaItem[] = [];
  try {
    morningAgendas = card.morning_agenda ? JSON.parse(card.morning_agenda) : [];
  } catch {
    morningAgendas = [];
  }

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

  // Ambient Golden Particles Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      opacitySpeed: number;
    }> = [];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        opacitySpeed: (Math.random() - 0.5) * 0.01
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += p.opacitySpeed;

        if (p.opacity > 0.8 || p.opacity < 0.15) {
          p.opacitySpeed = -p.opacitySpeed;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 208, 107, ${Math.max(0, Math.min(1, p.opacity))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#f9d976";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Handle Envelope Open with 3D Flip & Fireworks
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

      // Royal Confetti celebration
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ["#f5d06b", "#e6b042", "#d9822b", "#b02a37", "#fef3c7"]
        });
      } catch {}
    }, 700);
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
          spread: 80,
          origin: { y: 0.7 },
          colors: ["#f5d06b", "#e74c3c", "#f39c12", "#ffffff"]
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
      auspiciousTitle: "ជយោហោតុ",
      weddingSubtitle: "សិរីសួស្តី អាពាហ៍ពិពាហ៍",
      invitationHonor: "យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា អញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍កូនប្រុស កូនស្រីរបស់យើងខ្ញុំ",
      groomParentsTitle: "មាតាបិតាខាងកូនប្រុស",
      brideParentsTitle: "មាតាបិតាខាងកូនស្រី",
      groomTitle: "កូនប្រុស",
      brideTitle: "កូនស្រី",
      andWord: "ជាគូនឹង",
      countdownTitle: "រាប់ថយក្រោយដល់ថ្ងៃសិរីមង្គល",
      days: "ថ្ងៃ",
      hours: "ម៉ោង",
      minutes: "នាទី",
      seconds: "វិនាទី",
      morningProgram: "កាលវិភាគពិធីមង្គលការពេលព្រឹក",
      eveningProgram: "ពិធីពិសាភោជនាហារ និងជប់លៀងពេលល្ងាច",
      openMap: "បើកផែនទី Google Maps នាំផ្លូវ",
      copyAddress: "ចម្លងអាសយដ្ឋាន",
      copied: "បានចម្លង!",
      hall: "សាលពិធី៖",
      time: "វេលាម៉ោង៖",
      address: "អាសយដ្ឋាន៖",
      digitalGift: "ចងដៃឌីជីថល (ABA / Bakong KHQR)",
      digitalGiftSub: "សម្រាប់ភ្ញៀវកិត្តិយសដែលនៅឆ្ងាយ ឬចង់ផ្ញើចំណងដៃជូនពរតាមរយៈអេឡិចត្រូនិក",
      viewKhqr: "Scan QR Code ចងដៃ",
      close: "បិទ",
      copyAccount: "ចម្លងលេខកុង",
      galleryTitle: "កម្រងរូបភាពអនុស្សាវរីយ៍",
      gallerySub: "ពេលវេលាដ៏ផ្អែមល្ហែម និងអត្ថន័យនៃសេចក្តីស្រឡាញ់",
      wishesTitle: "សៀវភៅពាក្យជូនពរ និងឆ្លើយតប (RSVP)",
      yourName: "ឈ្មោះភ្ញៀវកិត្តិយស",
      yourPhone: "លេខទូរស័ព្ទ (មិនបង្ខំ)",
      willAttend: "នឹងអញ្ជើញចូលរួម",
      cannotAttend: "សូមអភ័យទោស មិនអាចចូលរួមបាន",
      numGuests: "ចំនួនភ្ញៀវចូលរួម",
      blessingPlaceholder: "សូមសរសេរពាក្យជូនពរល្អៗដល់គូស្វាមីភរិយាថ្មី...",
      sendBlessing: "ផ្ញើពាក្យជូនពរ",
      blessingSent: "សូមអរគុណយ៉ាងជ្រាលជ្រៅចំពោះពាក្យជូនពរដ៏មានអត្ថន័យ!",
      openInvitation: "បើកលិខិតអញ្ជើញ",
      tapToOpen: "សូមចុចលើត្រាមង្គលដើម្បីបើកធៀបការ",
      shareInvitation: "ចែករំលែកធៀបការ",
      copiedLink: "បានចម្លងតំណភ្ជាប់!",
      ritual1: "ហែជំនូនចូលគេហដ្ឋាន",
      ritual2: "កាត់សក់បង្កក់សិរីមង្គល",
      ritual3: "សំពះផ្ទឹម ចងដៃ និងបាចផ្កាស្លា",
      musicPlaying: "កំពុងចាក់ភ្លេងការមង្គល",
    },
    en: {
      auspiciousTitle: "Jayo Hotu",
      weddingSubtitle: "Holy Matrimony & Wedding Celebration",
      invitationHonor: "We cordially invite you to honor us with your presence and celebrate the wedding ceremony of our beloved son and daughter.",
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
      morningProgram: "Morning Traditional Rituals",
      eveningProgram: "Evening Wedding Banquet & Reception",
      openMap: "Open in Google Maps Navigation",
      copyAddress: "Copy Address",
      copied: "Copied!",
      hall: "Hall/Building:",
      time: "Time:",
      address: "Address:",
      digitalGift: "Digital Wedding Gift (KHQR)",
      digitalGiftSub: "For honored guests who wish to send wedding blessings and gifts electronically",
      viewKhqr: "Scan KHQR Code",
      close: "Close",
      copyAccount: "Copy Account",
      galleryTitle: "Our Love Story Gallery",
      gallerySub: "Cherished moments, timeless love, and memories",
      wishesTitle: "Guestbook & RSVP",
      yourName: "Your Full Name",
      yourPhone: "Phone Number (Optional)",
      willAttend: "Joyfully Accept (Attending)",
      cannotAttend: "Regretfully Decline",
      numGuests: "Number of Guests",
      blessingPlaceholder: "Write your heartfelt wedding blessings for the bride and groom...",
      sendBlessing: "Send Wedding Wishes",
      blessingSent: "Thank you heartfeltly for your warm blessings!",
      openInvitation: "Open Wedding Invitation",
      tapToOpen: "Tap auspicious seal to open invitation",
      shareInvitation: "Share Invitation",
      copiedLink: "Link copied!",
      ritual1: "Groom's Procession Ceremony",
      ritual2: "Hair Cutting & Purification",
      ritual3: "Sacred Knot-Tying & Areca Blessing",
      musicPlaying: "Playing Khmer Wedding Harmony",
    }
  }[lang];

  return (
    <div className="relative min-h-screen bg-[#24060a] text-[#3e2723] font-sans overflow-x-hidden selection:bg-amber-300 selection:text-amber-900">
      
      {/* Background Golden Dust Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 opacity-70"
      />

      {/* Background audio element */}
      {card.music_url && (
        <audio ref={audioRef} src={card.music_url} loop preload="auto" />
      )}

      {/* Floating Controls Bar (Language + Music + Share) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Language switch */}
        <button
          onClick={() => setLang(lang === "km" ? "en" : "km")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-semibold backdrop-blur-md border border-amber-600/40 shadow-xl cursor-pointer transition transform hover:scale-105"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === "km" ? "English" : "ភាសាខ្មែរ"}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2.5 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/40 shadow-xl backdrop-blur-md cursor-pointer transition transform hover:scale-110"
          title={t.shareInvitation}
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Music button */}
        {card.music_url && isOpen && (
          <button
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border border-amber-500/50 shadow-xl backdrop-blur-md cursor-pointer transition transform hover:scale-105 ${
              isPlayingMusic
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
                : "bg-amber-950/90 text-amber-300"
            }`}
            title="ភ្លេងការ"
          >
            {isPlayingMusic ? (
              <>
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="hidden sm:inline text-[11px] font-medium tracking-wide">
                  {t.musicPlaying}
                </span>
                <span className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </>
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* =========================================================================
          SECTION 1: 3D ROYAL ENVELOPE OPENING ANIMATION EXPERIENCE
         ========================================================================= */}
      {!isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-b from-[#1f0407] via-[#33090e] to-[#120204]">
          
          {/* Ethereal Golden Glow Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.25)_0%,transparent_70%)] pointer-events-none" />

          {/* Envelope Card Container with 3D Flip */}
          <div
            className={`relative w-full max-w-md aspect-[4/3] bg-gradient-to-br from-[#8c1723] via-[#6e0f19] to-[#47070e] rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] border-2 border-amber-500/50 p-6 sm:p-8 flex flex-col items-center justify-between text-center overflow-hidden transition-all duration-700 ${
              isOpeningAnim ? "scale-95 opacity-0 -translate-y-12" : "scale-100 opacity-100"
            }`}
          >
            {/* Ornate Gold Filigree Corners */}
            <div className="absolute top-3 left-3 text-amber-400/60 text-sm font-serif select-none">✤ ❖ ✤</div>
            <div className="absolute top-3 right-3 text-amber-400/60 text-sm font-serif select-none">✤ ❖ ✤</div>
            <div className="absolute bottom-3 left-3 text-amber-400/60 text-sm font-serif select-none">✤ ❖ ✤</div>
            <div className="absolute bottom-3 right-3 text-amber-400/60 text-sm font-serif select-none">✤ ❖ ✤</div>

            {/* Envelope flap texture decoration */}
            <div className="w-full pt-2">
              <span className="text-amber-300/80 text-[11px] sm:text-xs tracking-widest uppercase font-serif block">
                {t.weddingSubtitle}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-200 mt-1 drop-shadow-md tracking-wide">
                {card.groom_name} & {card.bride_name}
              </h2>
              <p className="text-amber-100/70 text-xs mt-1.5 font-serif">
                {card.khmer_date}
              </p>

              {customGuestName && (
                <div className="mt-2.5 py-1 px-4 rounded-full bg-amber-400/25 border border-amber-300/50 inline-block shadow-md">
                  <span className="text-xs font-serif font-bold text-amber-100">
                    {lang === "km" ? `សូមគោរពអញ្ជើញ៖ ${customGuestName}` : `Cordially Invited: ${customGuestName}`}
                  </span>
                </div>
              )}
            </div>

            {/* Golden Wax Seal with Radiant Pulsing Rings */}
            <div className="my-auto py-2">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="group relative flex flex-col items-center justify-center cursor-pointer transition transform hover:scale-110 active:scale-95"
              >
                {/* Glowing Aura Ring */}
                <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 blur-lg opacity-40 group-hover:opacity-75 animate-pulse transition duration-500" />
                
                {/* Royal Wax Seal Disc */}
                <div className="relative w-22 h-22 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-amber-200 shadow-2xl flex flex-col items-center justify-center text-amber-950">
                  <Sparkles className="w-6 h-6 text-amber-100 mb-0.5 animate-bounce-subtle" />
                  <span className="text-xs font-serif font-black tracking-wider text-amber-950 drop-shadow-xs">
                    {t.auspiciousTitle}
                  </span>
                </div>

                <span className="mt-3.5 text-xs font-semibold text-amber-200 tracking-wide bg-black/60 px-4 py-1.5 rounded-full border border-amber-500/40 shadow-md">
                  {t.tapToOpen}
                </span>
              </button>
            </div>

            {/* Bottom accent line */}
            <div className="w-full pb-1">
              <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: THE PREMIER WORLD-CLASS WEDDING CARD
         ========================================================================= */}
      <main className="relative z-20 max-w-2xl mx-auto px-3 sm:px-4 py-10 md:py-20 animate-fade-in">
        
        {/* Main Card Paper Container */}
        <div className="relative bg-[#fffdfa] rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-4 border-amber-600/40 overflow-hidden">
          
          {/* Inner Ornate Gold Border Line */}
          <div className="absolute inset-2 sm:inset-3.5 border-2 border-amber-500/30 rounded-[2rem] pointer-events-none" />
          
          {/* =====================================================================
              TOP AUSPICIOUS BANNER
             ===================================================================== */}
          <div className="relative text-center pt-12 pb-8 px-6 bg-gradient-to-b from-amber-100/60 via-amber-50/20 to-transparent">
            {/* Traditional Khmer Motif Crest */}
            <div className="inline-flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-amber-600" />
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-amber-600" />
            </div>

            {/* Auspicious Blessing Header */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-amber-900 tracking-wide drop-shadow-xs">
              {t.auspiciousTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-amber-800/90 mt-1 uppercase tracking-widest font-serif">
              {t.weddingSubtitle}
            </p>

            {/* Formal Invitation Text */}
            <p className="text-xs sm:text-sm text-stone-700 max-w-lg mx-auto mt-5 leading-relaxed font-serif italic px-2">
              « {t.invitationHonor} »
            </p>

            {customGuestName && (
              <div className="my-4 py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-100 via-amber-200/80 to-amber-100 border border-amber-400/70 max-w-md mx-auto text-center shadow-xs">
                <span className="text-[11px] text-amber-800 font-bold block uppercase tracking-wider">
                  {lang === "km" ? "សូមគោរពអញ្ជើញជាភ្ញៀវកិត្តិយសដ៏ខ្ពង់ខ្ពស់" : "Cordially Inviting Our Honored Guest"}
                </span>
                <span className="text-base sm:text-lg font-black font-serif text-amber-950 mt-0.5 block">
                  {customGuestName}
                </span>
              </div>
            )}
          </div>

          {/* =====================================================================
              PARENTS HONOR SECTION (Respectfully honoring both families)
             ===================================================================== */}
          <div className="px-6 py-6 border-y border-amber-600/20 bg-amber-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-center">
              
              {/* Groom's Parents */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-amber-500/20 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1.5 font-serif">
                  {t.groomParentsTitle}
                </span>
                <p className="text-sm font-bold text-stone-900 leading-snug">
                  {card.groom_parents}
                </p>
              </div>

              {/* Bride's Parents */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-amber-500/20 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1.5 font-serif">
                  {t.brideParentsTitle}
                </span>
                <p className="text-sm font-bold text-stone-900 leading-snug">
                  {card.bride_parents}
                </p>
              </div>

            </div>
          </div>

          {/* =====================================================================
              GROOM & BRIDE SHOWCASE (The Star Couple)
             ===================================================================== */}
          <div className="py-12 px-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              
              {/* Groom */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => setSelectedImage(card.groom_image_url || null)}
                  className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-2 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 shadow-2xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={card.groom_image_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"}
                    alt={card.groom_name}
                    className="w-full h-full object-cover rounded-full transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mt-4 shadow-xs">
                  {card.groom_title}
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-serif text-stone-900 mt-1">
                  {card.groom_name}
                </h3>
              </div>

              {/* Auspicious Center Heart */}
              <div className="flex flex-col items-center justify-center my-1 sm:my-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-amber-600 to-amber-700 text-white flex items-center justify-center shadow-xl transform rotate-45 transition transform hover:scale-110">
                  <Heart className="w-7 h-7 fill-current -rotate-45" />
                </div>
                <span className="text-xs font-serif font-black text-amber-800 mt-2.5 tracking-wider">
                  {t.andWord}
                </span>
              </div>

              {/* Bride */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => setSelectedImage(card.bride_image_url || null)}
                  className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-2 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 shadow-2xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={card.bride_image_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80"}
                    alt={card.bride_name}
                    className="w-full h-full object-cover rounded-full transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mt-4 shadow-xs">
                  {card.bride_title}
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-serif text-stone-900 mt-1">
                  {card.bride_name}
                </h3>
              </div>

            </div>

            {/* Khmer & Solar Dates Banner */}
            <div className="mt-10 p-5 max-w-lg mx-auto rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-300/80 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-amber-900 font-serif text-sm sm:text-base font-bold">
                <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{card.khmer_date}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 font-semibold mt-1.5">
                ត្រូវនឹង ថ្ងៃទី {card.solar_date} • វេលាម៉ោង {card.solar_time}
              </p>
            </div>
          </div>

          {/* =====================================================================
              COUNTDOWN TIMER (Excitement Builder)
             ===================================================================== */}
          <div className="px-6 py-10 bg-[#36080e] text-amber-100 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.25)_0%,transparent_70%)] pointer-events-none" />
            <h4 className="text-xs uppercase font-serif tracking-widest text-amber-300 mb-5 font-bold">
              {t.countdownTitle}
            </h4>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-sm mx-auto">
              {[
                { label: t.days, val: timeLeft.days },
                { label: t.hours, val: timeLeft.hours },
                { label: t.minutes, val: timeLeft.minutes },
                { label: t.seconds, val: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-black/50 border border-amber-500/40 rounded-2xl p-2.5 sm:p-3.5 shadow-lg backdrop-blur-xs">
                  <span className="text-2xl sm:text-3xl font-black font-serif text-amber-200 block">
                    {String(item.val).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs text-amber-300/80 uppercase font-semibold">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* =====================================================================
              PHOTO GALLERY & ANIMATED CAROUSEL (Love Story Showcase)
             ===================================================================== */}
          {gallery.length > 0 && (
            <div className="px-6 py-12 border-b border-amber-600/20 bg-amber-50/20">
              <div className="text-center mb-6">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest font-serif block">
                  {t.galleryTitle}
                </span>
                <p className="text-xs text-stone-600 mt-1 italic">
                  {t.gallerySub}
                </p>
              </div>

              {/* Main Featured Photo Slider */}
              <div className="relative max-w-lg mx-auto aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden shadow-xl border-2 border-amber-500/40 group">
                <img
                  src={gallery[currentSlide]}
                  alt={`Gallery slide ${currentSlide + 1}`}
                  className="w-full h-full object-cover transition-all duration-700 ease-out"
                />

                {/* Overlay Controls */}
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition cursor-pointer"
                  title="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Enlarge Trigger */}
                <button
                  type="button"
                  onClick={() => setSelectedImage(gallery[currentSlide])}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/50 text-white hover:bg-black/80 backdrop-blur-xs transition cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto py-2">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                      currentSlide === idx ? "border-amber-600 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              MORNING CEREMONY TIMELINE (Traditional Khmer Rituals)
             ===================================================================== */}
          {morningAgendas.length > 0 && (
            <div className="px-6 py-12 border-b border-amber-600/20">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest font-serif block">
                  {lang === "km" ? "កម្មវិធីសិរីមង្គល" : "Ceremony Schedule"}
                </span>
                <h3 className="text-2xl font-black font-serif text-stone-900 mt-1">
                  {t.morningProgram}
                </h3>
              </div>

              <div className="space-y-4 max-w-lg mx-auto">
                {morningAgendas.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 transition hover:bg-amber-50 hover:shadow-sm"
                  >
                    <div className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.time}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              EVENING RECEPTION & GOOGLE MAPS NAVIGATION (Venue & GPS)
             ===================================================================== */}
          <div className="px-6 py-12 bg-gradient-to-b from-amber-50/40 via-amber-50/20 to-white">
            <div className="text-center mb-8">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest font-serif block">
                {lang === "km" ? "ពិធីពិសាភោជនាហារ" : "Grand Reception"}
              </span>
              <h3 className="text-2xl font-black font-serif text-stone-900 mt-1">
                {t.eveningProgram}
              </h3>
            </div>

            <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-7 border border-amber-300 shadow-lg">
              <div className="space-y-4 text-stone-800">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-stone-900 font-serif">
                      {eveningReception.venue}
                    </h4>
                    {eveningReception.hall && (
                      <p className="text-xs text-amber-800 font-bold mt-0.5">
                        {t.hall} {eveningReception.hall}
                      </p>
                    )}
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      {eveningReception.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs text-stone-700 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t.time} <strong className="text-stone-900 font-bold">{eveningReception.time}</strong></span>
                </div>
              </div>

              {/* Action Buttons: Google Maps Navigation + Copy Address */}
              <div className="mt-6 pt-5 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eveningReception.map_url && (
                  <a
                    href={eveningReception.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition transform hover:scale-[1.02] cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{t.openMap}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition cursor-pointer"
                >
                  {copiedAddress ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAddress ? t.copied : t.copyAddress}</span>
                </button>
              </div>
            </div>
          </div>

          {/* =====================================================================
              DIGITAL WEDDING GIFT (ABA / BAKONG KHQR)
             ===================================================================== */}
          {card.khqr_image_url && (
            <div className="px-6 py-10 border-t border-amber-600/20 bg-gradient-to-b from-amber-100/40 to-amber-50 text-center">
              <div className="max-w-md mx-auto">
                <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-700 mb-2">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-stone-900">
                  {t.digitalGift}
                </h3>
                <p className="text-xs text-stone-600 mt-1 mb-5 leading-relaxed">
                  {t.digitalGiftSub}
                </p>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg transition transform hover:scale-105 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t.viewKhqr}</span>
                </button>
              </div>
            </div>
          )}

          {/* =====================================================================
              GUESTBOOK & RSVP (Interactive Wishes with Confetti)
             ===================================================================== */}
          {card.enable_wishes && (
            <div className="px-6 py-12 bg-gradient-to-b from-amber-50/40 to-white border-t border-amber-600/20">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest font-serif block">
                  {lang === "km" ? "ពរជ័យមង្គល" : "Guest Blessings"}
                </span>
                <h3 className="text-2xl font-black font-serif text-stone-900 mt-1">
                  {t.wishesTitle}
                </h3>
              </div>

              {/* RSVP & Wish Form */}
              <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-7 border border-amber-300 shadow-md">
                
                {wishSuccess && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.blessingSent}</span>
                  </div>
                )}

                <form onSubmit={handleWishSubmit} className="space-y-4">
                  {/* Name */}
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs shadow-xs"
                    />
                  </div>

                  {/* Attendance selection */}
                  {card.enable_rsvp && (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-stone-700 mb-2">
                        {lang === "km" ? "ការចូលរួមពិធី" : "Attendance Status"}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAttendance("attending")}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            attendance === "attending"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{t.willAttend}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendance("not_attending")}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            attendance === "not_attending"
                              ? "bg-stone-700 text-white border-stone-700 shadow-xs"
                              : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span>{t.cannotAttend}</span>
                        </button>
                      </div>

                      {attendance === "attending" && (
                        <div className="mt-3">
                          <label className="block text-xs text-stone-600 mb-1">
                            {t.numGuests}
                          </label>
                          <select
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
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

                  {/* Message */}
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingWish}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.sendBlessing}</span>
                  </button>
                </form>

                {/* Wishes Wall */}
                {wishesList.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-stone-200 space-y-3 max-h-80 overflow-y-auto pr-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      {lang === "km" ? `ពាក្យជូនពរពីភ្ញៀវ (${wishesList.length})` : `Wishes from Guests (${wishesList.length})`}
                    </h5>
                    {wishesList.map((wish) => (
                      <div
                        key={wish.id}
                        className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 font-serif">
                            {wish.guest_name}
                          </span>
                          <span className="text-[10px] text-amber-800 font-semibold px-2.5 py-0.5 rounded-full bg-amber-100">
                            {wish.attendance === "attending" ? (lang === "km" ? "ចូលរួម" : "Attending") : (lang === "km" ? "មិនបានចូលរួម" : "Declined")}
                          </span>
                        </div>
                        <p className="text-stone-700 italic leading-relaxed">
                          « {wish.blessing_message} »
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="py-8 text-center text-xs text-amber-900/60 border-t border-amber-600/10">
            <p className="font-serif">
              {card.groom_name} & {card.bride_name} • {card.solar_date}
            </p>
          </div>

        </div>
      </main>

      {/* =========================================================================
          MODAL: KHQR POPUP FOR ONLINE GIFT
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

            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
              {lang === "km" ? "ចំណងដៃតាមអេឡិចត្រូនិក" : "Digital Cashless Gift"}
            </span>
            <h4 className="text-lg font-bold font-serif text-stone-900">
              {card.khqr_account_name || "CHEA VISAL & SOK SOVANNARY"}
            </h4>

            {/* QR Code Frame */}
            <div className="my-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 inline-block shadow-inner">
              <img
                src={card.khqr_image_url}
                alt="Bakong KHQR Code"
                className="w-52 h-52 object-contain mx-auto rounded-lg"
              />
            </div>

            {/* Account Info & Copy */}
            {card.khqr_account_number && (
              <div className="p-3 rounded-xl bg-stone-100 flex items-center justify-between text-xs text-stone-800 mb-4">
                <span className="font-mono font-semibold">{card.khqr_account_number}</span>
                <button
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
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
              alt="Enlarged gallery photo"
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

      {/* Background Audio Source */}
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

      {/* Floating Luxury Gold Audio Player Widget */}
      {card.music_url && (
        <aside
          aria-label="Wedding Music Player"
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-amber-500/50 bg-[#1f0508]/85 backdrop-blur-md shadow-2xl shadow-amber-900/40 text-amber-200 transition-all hover:scale-105 select-none"
        >
          <button
            onClick={toggleMusic}
            aria-label={isPlayingMusic ? "ផ្អាកភ្លេងការ" : "ចាក់ភ្លេងការ"}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center shadow-md group-hover:from-amber-500 group-hover:to-amber-300 transition">
              {isPlayingMusic ? (
                <Volume2 className="w-4 h-4 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </div>

            {/* Equalizer animation */}
            <div className="flex items-end gap-0.5 h-3.5 px-0.5" aria-hidden="true">
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all ${isPlayingMusic ? 'h-3 animate-pulse' : 'h-1'}`} />
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all ${isPlayingMusic ? 'h-3.5 animate-bounce' : 'h-1.5'}`} style={{ animationDuration: '0.6s' }} />
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all ${isPlayingMusic ? 'h-2 animate-pulse' : 'h-1'}`} style={{ animationDuration: '0.8s' }} />
              <span className={`w-0.5 bg-amber-400 rounded-full transition-all ${isPlayingMusic ? 'h-3.5 animate-bounce' : 'h-1.5'}`} style={{ animationDuration: '0.5s' }} />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 leading-tight">
                {youtubeId ? "YouTube Audio" : "Wedding Music"}
              </div>
              <div className="text-xs font-medium text-amber-100 max-w-[140px] truncate leading-tight">
                {isPlayingMusic
                  ? (lang === "km" ? "កំពុងចាក់ភ្លេងការ" : "Playing Music")
                  : (lang === "km" ? "ចុចដើម្បីចាក់ភ្លេង" : "Tap to Play")}
              </div>
            </div>
          </button>
        </aside>
      )}

    </div>
  );
}
