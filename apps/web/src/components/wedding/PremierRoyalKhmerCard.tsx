"use client";

import React, { useState, useEffect, useRef } from "react";
import { Cormorant_Garamond, Noto_Serif_Khmer, Pinyon_Script } from "next/font/google";
import { WeddingCard, WeddingAgendaItem, WeddingReception, WeddingWish } from "@/types/wedding";
import { postWeddingWish, extractYouTubeVideoId } from "@/lib/wedding-api";
import { WeddingShareModal } from "./WeddingShareModal";
import { getTemplateById } from "@/lib/wedding-templates";
import { FloatingWeddingPetals } from "./WeddingFlowers";
import { LotusDivider, CornerFlourish, HandCircle, HandCheck } from "./WeddingInk";
import { KbachBand, AngkorDawn, RedThread, CeremonyIcon, type CeremonyIconName } from "./KhmerArt";
import confetti from "canvas-confetti";
import {
  MapPin,
  Sparkles,
  X,
  Gift,
  ChevronLeft,
  ChevronRight,
  Share2,
  Minus,
  Plus
} from "lucide-react";

/* The invitation's own type, set like printed stationery: a Garamond for Latin
   display, a Khmer serif for Khmer copy, and a pen script for a few accents.
   All self-hosted by next/font like the site fonts. */
const wcDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-wc-display",
  display: "swap",
});
const wcKhmer = Noto_Serif_Khmer({
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-wc-khmer",
  display: "swap",
});
const wcScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-wc-script",
  display: "swap",
});

/* Timeline of the envelope opening (ms), matched to the transition delays in
   globals.css: flap 0.25–1.2s, letter 1–2.1s, overlay fades 2.1–3s. */
const OPEN_CONFETTI_AT = 1500;
const OPEN_HERO_AT = 2100;
const OPEN_DONE_AT = 3000;

interface PremierRoyalKhmerCardProps {
  card: WeddingCard;
  isPreview?: boolean;
}

export function PremierRoyalKhmerCard({ card, isPreview = false }: PremierRoyalKhmerCardProps) {
  const [isOpen, setIsOpen] = useState(isPreview);
  const [isOpeningAnim, setIsOpeningAnim] = useState(false);
  const [heroIn, setHeroIn] = useState(isPreview);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [lang, setLang] = useState<"km" | "en">("km");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPetals, setShowPetals] = useState(true);
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
  const openTimers = useRef<number[]>([]);

  const youtubeId = card.music_url ? extractYouTubeVideoId(card.music_url) : null;

  // Active Template: its accent is the "ink" colour of the ornaments, labels
  // and links, and tints the envelope and the dark programme card
  const template = getTemplateById(card.theme);
  const themeVars = {
    "--wc-accent": template.accentColor,
    "--wc-deep": `color-mix(in oklab, ${template.accentColor} 14%, #1a1612)`,
    "--wc-link": `color-mix(in oklab, ${template.accentColor} 62%, #000)`,
    "--wc-light": `color-mix(in oklab, ${template.accentColor} 45%, #fff)`,
    "--wc-paper": `color-mix(in oklab, ${template.accentColor} 9%, #f4eee3)`,
    "--wc-ink": "#2b2520",
  } as React.CSSProperties;

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
    gallery = template.defaultGallery;
  }

  const heroImage = card.cover_image_url || card.groom_image_url || template.defaultCoverImage;
  const groomImage = card.groom_image_url || gallery[0] || heroImage;
  const brideImage = card.bride_image_url || gallery[1] || gallery[0] || heroImage;

  const eventDate = new Date(`${card.solar_date || "2026-11-28"}T${card.solar_time || "17:00"}:00`);
  const pad2 = (n: number) => String(n).padStart(2, "0");

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

  // Keep the page behind the envelope from scrolling until it is opened
  useEffect(() => {
    if (isPreview || isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isPreview]);

  useEffect(() => {
    const timers = openTimers.current;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // Open the envelope: flap, letter and fade run in CSS; these timers follow them
  const handleOpenEnvelope = () => {
    if (isOpeningAnim) return;
    setIsOpeningAnim(true);

    // Start music inside the tap itself so browsers allow the autoplay
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

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reduceMotion ? 0 : 1;
    openTimers.current.push(
      window.setTimeout(() => {
        if (reduceMotion) return;
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.45 },
            colors: ["#c9a46a", "#f3e3b8", "#e8c9c0", template.accentColor, "#ffffff"]
          });
        } catch {}
      }, OPEN_CONFETTI_AT * scale),
      window.setTimeout(() => setHeroIn(true), OPEN_HERO_AT * scale),
      window.setTimeout(() => {
        setIsOpen(true);
        setIsOpeningAnim(false);
      }, OPEN_DONE_AT * scale)
    );
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

      try {
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.7 },
          colors: ["#c9a46a", "#f3e3b8", template.accentColor, "#ffffff"]
        });
      } catch {}

      setTimeout(() => setWishSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWish(false);
    }
  };

  const stepLightbox = (dir: 1 | -1) => {
    if (!selectedImage) return;
    const curIdx = gallery.indexOf(selectedImage);
    setSelectedImage(gallery[(curIdx + dir + gallery.length) % gallery.length]);
  };

  // Monogram initials calculation (e.g. វ & ស or V & S)
  const getMonogramInitials = () => {
    const g = card.groom_name?.trim() || "";
    const b = card.bride_name?.trim() || "";
    const gChar = Array.from(g)[0] || "វ";
    const bChar = Array.from(b)[0] || "ស";
    return `${gChar} & ${bChar}`;
  };
  const monogramInitials = getMonogramInitials();

  // Google Calendar Event Link
  const buildGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`ពិធីអាពាហ៍ពិពាហ៍៖ ${card.groom_name} & ${card.bride_name}`);
    const location = encodeURIComponent(`${eveningReception.venue}, ${eveningReception.address}`);
    const details = encodeURIComponent(
      `សូមគោរពអញ្ជើញចូលរួមពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ ${card.groom_name} & ${card.bride_name}\n\nសាលពិធី៖ ${eveningReception.venue} (${eveningReception.hall})\nវេលាម៉ោង៖ ${eveningReception.time}\nទីតាំង៖ ${eveningReception.address}`
    );
    let datesParam = "";
    try {
      const d = new Date(`${card.solar_date || "2026-11-28"}T${card.solar_time || "17:00"}:00`);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const start = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
        const endD = new Date(d.getTime() + 4 * 3600 * 1000);
        const end = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
        datesParam = `&dates=${start}/${end}`;
      }
    } catch {}
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${datesParam}`;
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
      addToCalendar: "កត់ត្រាក្នុងប្រតិទិន (Add to Calendar)",
      dressCodeTitle: "សម្លៀកបំពាក់កិត្តិយស (Dress Code)",
      dressCodeSub: "សូមស្វាគមន៍ការស្លៀកពាក់ប្រពៃណីខ្មែរ ឬពណ៌តាមប្រធានបទមង្គល",
      dressCodeTheme: "ក្ដារពណ៌ប្រធានបទ (Theme Palette)",
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
      cinematicView: "ស្លាយភាពយន្ត",
      polaroidView: "អាល់ប៊ុមរូបថត",
      theGroom: "លោកកូនកំលោះ",
      theBride: "អ្នកកូនក្រមុំ",
      petalsToggle: "ផ្កាធ្លាក់",
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
      addToCalendar: "Add to Google Calendar",
      dressCodeTitle: "Dress Code & Attire",
      dressCodeSub: "Traditional Khmer formal attire or colors harmonizing with our wedding theme",
      dressCodeTheme: "Theme Palette",
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
      cinematicView: "Cinematic Slide",
      polaroidView: "Polaroid Album",
      theGroom: "The Groom",
      theBride: "The Bride",
      petalsToggle: "Petals",
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

  // Section labels and small copy for the printed-stationery layout
  const ui = {
    km: {
      weddingOf: "សិរីមង្គលអាពាហ៍ពិពាហ៍",
      s1: "១ — លិខិតអញ្ជើញ",
      s2: "២ — កូនកំលោះ និងកូនក្រមុំ",
      s3: "៣ — ថ្ងៃមង្គល",
      s4: "៤ — កម្មវិធី",
      s5: "៥ — ប្រពៃណីខ្មែរ",
      s6: "៦ — អនុស្សាវរីយ៍",
      s7: "៧ — ព័ត៌មានបន្ថែម",
      s8: "៨ — ឆ្លើយតប",
      traditionsTitle: "អត្ថន័យនៃពិធីមង្គលការខ្មែរ",
      traditionsNote: "ពិធីនីមួយៗ មានអត្ថន័យ និងពរជ័យរបស់វា ដែលបន្សល់ទុកពីដូនតាខ្មែរ។",
      blessing: "ពរជ័យ",
      blessingLine: "សូមឲ្យគូស្វាមីភរិយាថ្មី រស់នៅជាមួយគ្នាដោយសុខដុមរមនា រហូតដល់ចាស់កោងខ្នង។",
      thread: "ចងដៃ",
      invite: "សូមគោរពអញ្ជើញ",
      programTitle: "កម្មវិធីសិរីមង្គល",
      morning: "ពេលព្រឹក",
      evening: "ពេលល្ងាច",
      at: "វេលាម៉ោង",
      toGo: "នៅសល់",
      addCal: "កត់ត្រាក្នុងប្រតិទិន",
      reply: "សូមមេត្តាឆ្លើយតប",
      replyNote: "ដើម្បីងាយស្រួលក្នុងការរៀបចំកន្លែងអង្គុយ",
      guests: "ចំនួនភ្ញៀវ",
      fewer: "បន្ថយ",
      more: "បន្ថែម",
      fromGuests: "ពាក្យជូនពរពីភ្ញៀវ",
      withLove: "ដោយក្ដីស្រឡាញ់",
      madeWith: "បង្កើតដោយ CamTech Invitations",
      photo: "រូបភាព",
      prev: "មុន",
      next: "បន្ទាប់",
    },
    en: {
      weddingOf: "The wedding of",
      s1: "I — The invitation",
      s2: "II — The couple",
      s3: "III — The date",
      s4: "IV — The programme",
      s5: "V — Khmer traditions",
      s6: "VI — Moments",
      s7: "VII — Good to know",
      s8: "VIII — Kindly reply",
      traditionsTitle: "The meaning of a Khmer wedding",
      traditionsNote: "Each rite carries its own blessing, handed down by Khmer elders for generations.",
      blessing: "A blessing",
      blessingLine: "May the couple share a long and gentle life together, until their hair turns white.",
      thread: "ចងដៃ · tied together",
      invite: "You are warmly invited",
      programTitle: "Order of the day",
      morning: "Morning",
      evening: "Evening",
      at: "at",
      toGo: "to go",
      addCal: "Add to calendar",
      reply: "Kindly reply",
      replyNote: "It helps us plan the seating",
      guests: "Number of guests",
      fewer: "Fewer guests",
      more: "More guests",
      fromGuests: "Words from our guests",
      withLove: "With love",
      madeWith: "Made with CamTech Invitations",
      photo: "Photo",
      prev: "Previous",
      next: "Next",
    },
  }[lang];

  // Calendar page for the wedding month, with the day circled in pen
  const MONTHS_KM = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
  const WEEKDAYS_KM = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
  const WEEK_HEAD = lang === "km" ? ["អា", "ច", "អ", "ពុ", "ព្រ", "សុ", "ស"] : ["S", "M", "T", "W", "T", "F", "S"];
  const dateValid = !isNaN(eventDate.getTime());
  const evYear = dateValid ? eventDate.getFullYear() : 0;
  const evMonth = dateValid ? eventDate.getMonth() : 0;
  const evDay = dateValid ? eventDate.getDate() : 0;
  const monthName = dateValid
    ? lang === "km" ? MONTHS_KM[evMonth] : eventDate.toLocaleString("en-GB", { month: "long" })
    : "";
  const weekdayName = dateValid
    ? lang === "km" ? `ថ្ងៃ${WEEKDAYS_KM[eventDate.getDay()]}` : eventDate.toLocaleString("en-GB", { weekday: "long" })
    : "";
  const calendarCells: (number | null)[] = dateValid
    ? [
        ...Array.from({ length: new Date(evYear, evMonth, 1).getDay() }, () => null),
        ...Array.from({ length: new Date(evYear, evMonth + 1, 0).getDate() }, (_, i) => i + 1),
      ]
    : [];
  const prettyDate = dateValid ? `${evDay} ${monthName} ${evYear}` : card.solar_date;

  // Slight, varied tilts so the collage looks laid out by hand, not by a grid
  const collageTilt = ["-rotate-[1.2deg]", "rotate-[0.8deg]", "rotate-0", "rotate-[1.4deg]", "-rotate-[0.6deg]"];

  const sectionLabel = "wc-smallcaps text-[var(--wc-link)]";

  // The rites of a Khmer wedding, in the order they are usually held
  const KHMER_NUMERALS = ["១", "២", "៣", "៤", "៥", "៦", "៧"];
  const CEREMONIES: { icon: CeremonyIconName; km: string; en: string; kmNote: string; enNote: string }[] = [
    { icon: "procession", km: "ពិធីហែជំនូន", en: "Gift procession", kmNote: "គ្រួសារខាងកូនប្រុសហែជំនូនផ្លែឈើ នំចំណី និងកាដូ ទៅដល់ផ្ទះកូនស្រី។", enNote: "The groom’s family carries trays of fruit, sweets and gifts to the bride’s home." },
    { icon: "blessing", km: "ពិធីសូត្រមន្ត", en: "Monks’ blessing", kmNote: "ព្រះសង្ឃសូត្រមន្ត ប្រសិទ្ធពរជ័យ សិរីមង្គលដល់គូស្វាមីភរិយា។", enNote: "Monks chant blessings over the couple and their life together." },
    { icon: "haircut", km: "ពិធីកាត់សក់បង្កក់សិរី", en: "Hair-cutting", kmNote: "កាត់សក់ជានិមិត្តរូប ដើម្បីជម្រះអតីតកាល ត្រៀមចូលជីវិតថ្មី។", enNote: "A symbolic trim that cleanses the couple for their new life." },
    { icon: "popil", km: "ពិធីបង្វិលពពិល", en: "Circling the candle", kmNote: "ចាស់ទុំបង្វិលទៀនពពិលជុំវិញគូស្វាមីភរិយា ប្រាំពីរជុំ ដើម្បីសិរីមង្គល។", enNote: "Married elders pass a candle around the couple seven times for good fortune." },
    { icon: "sampeah", km: "ពិធីសំពះផ្ទឹម", en: "Sampeah Pthem", kmNote: "កូនកំលោះ និងកូនក្រមុំសំពះគ្នាទៅវិញទៅមក និងសំពះដូនតា។", enNote: "The couple bow to each other and to their ancestors." },
    { icon: "chongdai", km: "ពិធីចងដៃ", en: "Knot tying", kmNote: "ភ្ញៀវចងអំបោះក្រហមនៅកដៃគូស្វាមីភរិយា ព្រមទាំងជូនពរ។", enNote: "Guests tie red threads around the couple’s wrists with their wishes." },
    { icon: "petals", km: "ពិធីបាចផ្កាស្លា", en: "Palm-flower shower", kmNote: "ភ្ញៀវបាចផ្កាស្លាលើគូស្វាមីភរិយា ជាពរជ័យចុងក្រោយ។", enNote: "Guests shower the couple with palm-flower petals as a last blessing." },
  ];

  return (
    <div
      lang={lang}
      className={`wc-root relative min-h-screen overflow-x-clip font-sans ${wcDisplay.variable} ${wcKhmer.variable} ${wcScript.variable} ${heroIn ? "wc-opened" : ""} ${isPreview ? "wc-preview" : ""}`}
      style={themeVars}
    >
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

      {/* Floating Ambient Falling Petals */}
      {isOpen && showPetals && (
        <FloatingWeddingPetals flowerType={template.flowerType} />
      )}

      {/* Corner controls: language, petals, share */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLang(lang === "km" ? "en" : "km")}
          className="h-10 px-4 rounded-full bg-[#fffdf8]/90 backdrop-blur border border-black/10 text-[13px] text-[#2b2520] shadow-sm cursor-pointer"
        >
          {lang === "km" ? "English" : "ភាសាខ្មែរ"}
        </button>
        {isOpen && (
          <button
            type="button"
            onClick={() => setShowPetals(!showPetals)}
            aria-pressed={showPetals}
            aria-label={t.petalsToggle}
            className="w-10 h-10 rounded-full bg-[#fffdf8]/90 backdrop-blur border border-black/10 flex items-center justify-center text-[#2b2520] shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          aria-label={t.shareInvitation}
          className="w-10 h-10 rounded-full bg-[#fffdf8]/90 backdrop-blur border border-black/10 flex items-center justify-center text-[#2b2520] shadow-sm cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          ENVELOPE: tap the wax seal → flap opens → letter rises → into the card
         ========================================================================= */}
      {!isOpen && (
        <div
          className={`wc-overlay fixed inset-0 z-40 flex flex-col items-center justify-center gap-12 px-6 ${isOpeningAnim ? "is-opening" : ""}`}
        >
          <p className={lang === "km" ? "wc-khmer text-lg text-[#e9d3a8]" : "wc-script text-4xl text-[#e9d3a8]"}>
            {lang === "km" ? "លិខិតអញ្ជើញ" : "You are invited"}
          </p>

          <div className="wc-env relative w-[min(86vw,360px)] aspect-[3/2]">
            <div className="wc-env-back absolute inset-0 rounded-[3px] shadow-[0_30px_60px_rgba(0,0,0,0.5)]" />
            <div className="wc-letter wc-grain absolute left-[4%] right-[4%] top-[5%] h-[88%] rounded-[2px] bg-[#fbf7ef] shadow-[0_6px_18px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center gap-1 px-4 text-center text-[#2b2520]">
              <span className="wc-smallcaps text-[10px] text-[var(--wc-link)]">{ui.weddingOf}</span>
              <span className="wc-display text-2xl sm:text-[28px] leading-tight">
                {card.groom_name} <span className="italic text-[var(--wc-link)]">&amp;</span> {card.bride_name}
              </span>
              <span className="text-[11px] text-[#6b6157]">{card.khmer_date || card.solar_date}</span>
              <span className="mt-1.5 text-[11px] text-[#2b2520] truncate max-w-full">
                {customGuestName || (lang === "km" ? "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី" : "Honored Guest")}
              </span>
            </div>
            <div className="wc-env-pocket absolute inset-0 z-[3] rounded-[3px]" />
            <div className="wc-flap absolute left-0 right-0 top-0 h-[66%] rounded-t-[3px]" />
            <button
              type="button"
              onClick={handleOpenEnvelope}
              aria-label={t.tapToOpen}
              className="wc-seal absolute left-1/2 top-[66%] z-[6] w-[76px] h-[76px] flex items-center justify-center cursor-pointer"
            >
              <span className="w-[58px] h-[58px] rounded-full border border-[#f1d6c8]/40 flex items-center justify-center wc-display italic text-[19px] text-[#f6e3d8]/95">
                {monogramInitials.replace(/\s/g, "")}
              </span>
            </button>
          </div>

          <p className={`wc-breathe text-white/70 text-center ${lang === "km" ? "text-sm" : "text-[11px] tracking-[0.25em] uppercase"}`}>
            {t.tapToOpen}
          </p>
        </div>
      )}

      <main className="relative z-20">

        {/* =====================================================================
            COVER: the photo, with the names set like a magazine cover
           ===================================================================== */}
        <section className="relative h-[100svh] min-h-[620px] overflow-hidden bg-[#1a1612] text-[#fbf7ef]">
          <div className="wc-parallax absolute inset-x-0 top-0 h-[118%]">
            <img src={heroImage} alt={`${card.groom_name} & ${card.bride_name}`} className="wc-kb w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,16,12,0.82),rgba(20,16,12,0.2)_55%,rgba(20,16,12,0.35))]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-3 sm:inset-5">
            <span className="wc-frame-line t" />
            <span className="wc-frame-line r" />
            <span className="wc-frame-line b" />
            <span className="wc-frame-line l" />
          </div>
          <KbachBand tiles={3} mode="open" className="absolute top-14 sm:top-10 left-1/2 -translate-x-1/2 w-36 h-6 text-[#e9d3a8]" />

          <div className="absolute inset-x-0 bottom-0 max-w-[1080px] mx-auto px-6 pb-24 sm:pb-20">
            <p className="wc-line d1 wc-smallcaps text-white/75">{ui.weddingOf}</p>
            <h1 className="mt-3 wc-display font-light leading-[0.98] text-[clamp(52px,10vw,124px)]">
              <span className="wc-line d2 block break-words">{card.groom_name}</span>
              <span className="wc-line d3 block italic text-[#e9d3a8] text-[0.55em] leading-none my-2 sm:ml-[10vw]">&amp;</span>
              <span className="wc-line d3 block break-words sm:ml-[16vw]">{card.bride_name}</span>
            </h1>
            <div className="wc-line d4 mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-white/85">
              <span className="w-12 h-px bg-[#e9d3a8]" />
              <span>{weekdayName}{weekdayName && " · "}{prettyDate}</span>
              {card.solar_time && <span className="text-white/60">{ui.at} {card.solar_time}</span>}
            </div>
            {customGuestName && (
              <p className="wc-line d5 mt-5 text-[15px] text-white/85">
                <span className="text-white/60">{t.invitedHonoredGuest} — </span>
                <span className="wc-display italic text-xl">{customGuestName}</span>
              </p>
            )}
          </div>
        </section>

        {/* =====================================================================
            I. THE INVITATION: a printed letter with the parents' names
           ===================================================================== */}
        <section className="px-5 sm:px-6 py-24 sm:py-32">
          <p className={`${sectionLabel} text-center mb-8`}>{ui.s1}</p>
          <div className="wc-reveal relative max-w-[720px] mx-auto bg-[#fffdf8] wc-grain border border-[color-mix(in_oklab,var(--wc-accent)_35%,transparent)] px-6 sm:px-16 py-16 sm:py-20 text-center shadow-[0_24px_50px_-30px_rgba(60,45,30,0.45)]">
            <div aria-hidden="true" className="absolute inset-2.5 border border-[color-mix(in_oklab,var(--wc-accent)_22%,transparent)] pointer-events-none" />
            <CornerFlourish className="absolute top-4 left-4 w-12 h-12 text-[var(--wc-link)]" />
            <CornerFlourish flip="x" className="absolute top-4 right-4 w-12 h-12 text-[var(--wc-link)]" />
            <CornerFlourish flip="y" className="absolute bottom-4 left-4 w-12 h-12 text-[var(--wc-link)]" />
            <CornerFlourish flip="xy" className="absolute bottom-4 right-4 w-12 h-12 text-[var(--wc-link)]" />

            <p className={lang === "km" ? "font-moul text-[22px] sm:text-[26px] text-[var(--wc-link)] leading-[1.7]" : "wc-script text-[44px] sm:text-[52px] text-[var(--wc-link)] leading-none"}>
              {ui.invite}
            </p>
            <LotusDivider className="mx-auto my-6 w-48 h-9 text-[var(--wc-link)]" />
            <p className="wc-khmer text-[16px] sm:text-[17px] leading-[2.1] text-[#3a332c] max-w-[520px] mx-auto">{t.invitationHonor}</p>

            <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-8">
              {[
                { parentsTitle: t.groomParentsTitle, parents: card.groom_parents, title: t.groomTitle, name: card.groom_name },
                null,
                { parentsTitle: t.brideParentsTitle, parents: card.bride_parents, title: t.brideTitle, name: card.bride_name },
              ].map((p, i) =>
                p ? (
                  <div key={i}>
                    <p className="wc-smallcaps text-[#6b6157]">{p.parentsTitle}</p>
                    <p className="mt-2 wc-khmer text-[15px] leading-[1.9] text-[#2b2520]">{p.parents}</p>
                    <p className="mt-6 text-[13px] text-[#6b6157]">{p.title}</p>
                    <p className="wc-display text-[26px] sm:text-[32px] leading-tight text-[#2b2520] break-words">{p.name}</p>
                  </div>
                ) : (
                  <div key={i} className="self-stretch flex flex-col items-center">
                    <span className="flex-1 w-px bg-[color-mix(in_oklab,var(--wc-accent)_35%,transparent)]" />
                    <span className="wc-display italic text-[30px] text-[var(--wc-link)] leading-none py-2">&amp;</span>
                    <span className="flex-1 w-px bg-[color-mix(in_oklab,var(--wc-accent)_35%,transparent)]" />
                  </div>
                )
              )}
            </div>
          </div>
          <p className="mt-8 text-center wc-display italic text-[17px] text-[#6b6157]">{t.auspiciousBlessing}</p>
          <KbachBand className="mx-auto mt-16 w-full max-w-sm h-7 text-[var(--wc-link)]/70" />
        </section>

        {/* =====================================================================
            II. THE COUPLE: two prints, laid off-grid
           ===================================================================== */}
        <section className="px-5 sm:px-6 pb-24 sm:pb-32">
          <div className="max-w-[1080px] mx-auto">
            <p className={`${sectionLabel} mb-10`}>{ui.s2}</p>
            <div className="relative grid grid-cols-1 md:grid-cols-12 gap-14 md:gap-6">
              {[
                { img: groomImage, role: t.theGroom, name: card.groom_name, cls: "relative z-10 md:col-span-6 wc-tilt-l", capCls: "" },
                { img: brideImage, role: t.theBride, name: card.bride_name, cls: "relative z-10 md:col-span-5 md:col-start-8 md:mt-40 wc-tilt-r", capCls: "md:text-right" },
              ].map((p) => (
                <figure key={p.role} className={`wc-reveal m-0 ${p.cls}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(p.img)}
                    className="wc-print wc-develop block w-full aspect-[4/5] cursor-zoom-in"
                    aria-label={p.name}
                  >
                    <img src={p.img} alt={p.name} />
                  </button>
                  <figcaption className={`mt-5 ${p.capCls}`}>
                    <span className="wc-smallcaps text-[#6b6157]">{p.role}</span>
                    <span className="block mt-1 wc-display text-[32px] sm:text-[40px] leading-tight text-[#2b2520]">{p.name}</span>
                  </figcaption>
                </figure>
              ))}
              <RedThread className="pointer-events-none hidden md:block absolute inset-x-0 top-[16%] h-[56%] w-full" />
              <span aria-hidden="true" className="hidden md:block absolute left-[53.5%] top-[50%] -translate-x-1/2 text-[13px] text-[#b3262d] wc-khmer whitespace-nowrap">{ui.thread}</span>
            </div>
            <p className="wc-reveal mt-16 md:mt-10 max-w-xl wc-display italic text-[24px] sm:text-[30px] leading-snug text-[#3a332c]">{t.romanticQuote}</p>
          </div>
        </section>

        {/* =====================================================================
            III. THE DATE: big numeral + the month's calendar page
           ===================================================================== */}
        <section className="px-5 sm:px-6 py-24 sm:py-32 border-y border-[#2b2520]/10">
          <div className="max-w-[1080px] mx-auto grid md:grid-cols-2 gap-14 items-center">
            <div className="wc-reveal">
              <p className={sectionLabel}>{ui.s3}</p>
              {dateValid ? (
                <>
                  <p className="mt-6 text-[15px] text-[#6b6157]">{weekdayName}</p>
                  <p className="wc-display font-light text-[clamp(120px,18vw,200px)] leading-[0.85] text-[#2b2520] tabular-nums">{evDay}</p>
                  <p className="mt-2 wc-display text-[30px] text-[#2b2520]">{monthName} {evYear}</p>
                </>
              ) : (
                <p className="mt-6 wc-display text-[40px]">{card.solar_date}</p>
              )}
              <p className="mt-4 wc-khmer text-[15px] leading-relaxed text-[#6b6157]">{card.khmer_date}</p>
              {card.solar_time && <p className="mt-1 text-[15px] text-[#2b2520]">{ui.at} {card.solar_time}</p>}
              <p className="mt-6 wc-display italic text-[19px] text-[#3a332c] tabular-nums">
                {lang === "en"
                  ? `${timeLeft.days} ${t.days.toLowerCase()}, ${timeLeft.hours} ${t.hours.toLowerCase()} ${ui.toGo}`
                  : `${ui.toGo} ${timeLeft.days} ${t.days} ${timeLeft.hours} ${t.hours}`}
              </p>
              <a href={buildGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="wc-link mt-6 inline-block text-[15px]">
                {ui.addCal}
              </a>
            </div>

            {dateValid && (
              <div className="wc-reveal bg-[#fffdf8] wc-grain border border-[#2b2520]/10 p-6 sm:p-9 shadow-[0_24px_50px_-30px_rgba(60,45,30,0.45)] md:rotate-[0.6deg]">
                <div className="flex items-baseline justify-between mb-6">
                  <span className="wc-display text-[26px] text-[#2b2520]">{monthName}</span>
                  <span className="text-[13px] text-[#6b6157] tabular-nums">{evYear}</span>
                </div>
                <div className="grid grid-cols-7 text-center gap-y-1">
                  {WEEK_HEAD.map((d, i) => (
                    <span key={i} className="text-[11px] text-[#6b6157] pb-2">{d}</span>
                  ))}
                  {calendarCells.map((d, i) =>
                    d === evDay ? (
                      <span key={i} className="relative py-2.5 text-[15px] font-semibold text-[#2b2520] tabular-nums">
                        {d}
                        <HandCircle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[var(--wc-link)]" />
                      </span>
                    ) : (
                      <span key={i} className="py-2.5 text-[15px] text-[#3a332c]/80 tabular-nums">{d ?? ""}</span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            IV. THE PROGRAMME: printed like a menu, on dark card stock
           ===================================================================== */}
        <section className="px-5 sm:px-6 py-24 sm:py-32 bg-[var(--wc-deep)] wc-grain text-[#f3ece0]">
          <div className="max-w-[880px] mx-auto">
            <p className="wc-smallcaps text-[var(--wc-light)]">{ui.s4}</p>
            <h2 className="wc-reveal mt-4 wc-display font-light text-[clamp(40px,6vw,68px)] leading-[1.05]">{ui.programTitle}</h2>

            <div className="mt-14 grid md:grid-cols-2 gap-14 md:gap-16">
              {morningAgendas.length > 0 && (
                <div className="wc-reveal">
                  <h3 className="wc-smallcaps text-[var(--wc-light)] pb-4 border-b border-white/15">{ui.morning}</h3>
                  <ol className="mt-2">
                    {morningAgendas.map((item, index) => (
                      <li key={index} className="py-4 border-b border-white/10">
                        <div className="flex items-baseline gap-3">
                          <span className="wc-khmer text-[17px] leading-snug">{item.title}</span>
                          <span className="wc-leader !border-white/30" />
                          <span className="wc-display text-[22px] tabular-nums shrink-0">{item.time}</span>
                        </div>
                        {item.description && <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{item.description}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className={`wc-reveal ${morningAgendas.length > 0 ? "" : "md:col-span-2"}`}>
                <h3 className="wc-smallcaps text-[var(--wc-light)] pb-4 border-b border-white/15">{ui.evening}</h3>
                <p className="mt-6 wc-display font-light text-[56px] leading-none">{eveningReception.time}</p>
                <p className="mt-2 wc-khmer text-[17px] text-white/85">{t.eveningProgram}</p>
                <div className="mt-8 flex gap-3">
                  <MapPin className="w-5 h-5 mt-1 shrink-0 text-[var(--wc-light)]" strokeWidth={1.5} />
                  <div>
                    <p className="wc-display text-[24px] leading-snug">{eveningReception.venue}</p>
                    {eveningReception.hall && <p className="mt-1 text-[15px] text-white/80">{eveningReception.hall}</p>}
                    <p className="mt-1 text-[14px] leading-relaxed text-white/60">{eveningReception.address}</p>
                  </div>
                </div>
                <div className="mt-6 pl-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
                  {eveningReception.map_url && (
                    <a href={eveningReception.map_url} target="_blank" rel="noopener noreferrer" className="wc-link !text-[var(--wc-light)]">
                      {t.openMap}
                    </a>
                  )}
                  <button type="button" onClick={handleCopyAddress} className="wc-link !text-[var(--wc-light)] cursor-pointer">
                    {copiedAddress ? t.copied : t.copyAddress}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            V. KHMER TRADITIONS: each rite on a palm-leaf manuscript strip
           ===================================================================== */}
        <section className="px-5 sm:px-6 py-24 sm:py-32">
          <div className="max-w-[1080px] mx-auto">
            <p className={sectionLabel}>{ui.s5}</p>
            <h2 className="wc-reveal mt-4 font-moul text-[clamp(24px,3.6vw,38px)] leading-[1.6] text-[#2b2520]">{ui.traditionsTitle}</h2>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[#6b6157]">{ui.traditionsNote}</p>
            <ol className="mt-12 grid md:grid-cols-2 gap-5">
              {CEREMONIES.map((c, i) => (
                <li
                  key={c.icon}
                  className={`wc-reveal relative flex items-center gap-5 rounded-[14px] bg-[#e9dcbf] wc-grain pl-9 pr-9 py-6 shadow-[0_10px_24px_-16px_rgba(60,45,30,0.55)] ${collageTilt[i % collageTilt.length]}`}
                >
                  {/* Binding holes, as on a real palm-leaf manuscript */}
                  <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c9b48c] shadow-inner" />
                  <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c9b48c] shadow-inner" />
                  <span className="wc-khmer text-[30px] leading-none text-[var(--wc-link)] w-6 text-center shrink-0">{KHMER_NUMERALS[i]}</span>
                  <CeremonyIcon name={c.icon} className="w-11 h-11 shrink-0 text-[#4a3b2a]" />
                  <div className="min-w-0">
                    <p className="wc-khmer text-[17px] font-semibold text-[#2b2520]">{c.km}</p>
                    {lang === "en" && <p className="wc-display italic text-[16px] text-[#4a3b2a]">{c.en}</p>}
                    <p className="mt-1 text-[14px] leading-relaxed text-[#5a4c3c]">{lang === "km" ? c.kmNote : c.enNote}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* =====================================================================
            VI. MOMENTS: a loose collage of prints
           ===================================================================== */}
        {gallery.length > 0 && (
          <section className="px-5 sm:px-6 py-24 sm:py-32">
            <div className="max-w-[1080px] mx-auto">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
                <div>
                  <p className={sectionLabel}>{ui.s6}</p>
                  <h2 className="wc-reveal mt-4 wc-display font-light text-[clamp(36px,5vw,56px)] leading-[1.1] text-[#2b2520]">{t.galleryTitle}</h2>
                </div>
                <p className="wc-display italic text-[17px] text-[#6b6157] max-w-xs">{t.gallerySub}</p>
              </div>
              <div className="wc-collage columns-2 md:columns-3 gap-4 sm:gap-6">
                {gallery.map((imgUrl, idx) => (
                  <figure key={idx} className={`wc-reveal m-0 mb-6 sm:mb-8 break-inside-avoid ${collageTilt[idx % collageTilt.length]}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      className="wc-print wc-develop block w-full cursor-zoom-in"
                      aria-label={`${ui.photo} ${idx + 1}`}
                    >
                      <img src={imgUrl} alt="" loading={idx < 6 ? "eager" : "lazy"} className="!h-auto" />
                    </button>
                    <figcaption className="mt-2 wc-display italic text-[14px] text-[#6b6157]">No. {pad2(idx + 1)}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            VII. GOOD TO KNOW: dress code + gift, set as two columns of text
           ===================================================================== */}
        <section className="px-5 sm:px-6 py-24 sm:py-32 border-t border-[#2b2520]/10">
          <div className="max-w-[1080px] mx-auto">
            <p className={`${sectionLabel} mb-12`}>{ui.s7}</p>
            <div className={`grid gap-14 ${card.khqr_image_url ? "md:grid-cols-2 md:divide-x md:divide-[#2b2520]/10" : ""}`}>
              <div className="wc-reveal md:pr-14">
                <h3 className="wc-display text-[32px] leading-tight text-[#2b2520]">{t.dressCodeTitle}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-[#6b6157] max-w-md">{t.dressCodeSub}</p>
                <div className="mt-6 flex gap-3">
                  {(template.palette || []).map((color: string) => (
                    <span key={color} title={color} className="w-12 h-12 rounded-full wc-grain ring-1 ring-black/10" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              {card.khqr_image_url && (
                <div className="wc-reveal md:pl-14">
                  <h3 className="wc-display text-[32px] leading-tight text-[#2b2520]">{t.digitalGift}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-[#6b6157] max-w-md">{t.digitalGiftSub}</p>
                  <button type="button" onClick={() => setShowQrModal(true)} className="wc-link mt-6 inline-flex items-center gap-2 text-[15px] cursor-pointer">
                    <Gift className="w-4 h-4" strokeWidth={1.5} />
                    {t.viewKhqr}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================================
            VIII. KINDLY REPLY: a paper reply card
           ===================================================================== */}
        {card.enable_wishes && (
          <section className="px-5 sm:px-6 pb-24 sm:pb-32">
            <p className={`${sectionLabel} text-center mb-8`}>{ui.s8}</p>
            <div className="wc-reveal relative max-w-[600px] mx-auto bg-[#fffdf8] wc-grain border border-[#2b2520]/15 px-6 sm:px-14 py-12 sm:py-16 shadow-[0_24px_50px_-30px_rgba(60,45,30,0.45)]">
              <div aria-hidden="true" className="absolute inset-2.5 border border-[#2b2520]/10 pointer-events-none" />

              {wishSuccess ? (
                <div role="status" className="text-center py-10">
                  {lang === "km"
                    ? <p className="font-moul text-[24px] text-[var(--wc-link)]">សូមអរគុណ</p>
                    : <p className="wc-script text-[56px] text-[var(--wc-link)] leading-none">Thank you</p>}
                  <p className="mt-4 text-[16px] text-[#3a332c]">{t.blessingSent}</p>
                </div>
              ) : (
                <form onSubmit={handleWishSubmit} className="relative">
                  <div className="text-center">
                    <h2 className="wc-display text-[40px] sm:text-[48px] leading-tight text-[#2b2520]">{ui.reply}</h2>
                    <p className="mt-2 text-[15px] text-[#6b6157]">{ui.replyNote}</p>
                  </div>

                  <label className="block mt-10">
                    <span className="wc-smallcaps text-[#6b6157]">{t.yourName}</span>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="mt-1 w-full h-12 bg-transparent border-0 border-b border-[#2b2520]/30 text-[19px] wc-display text-[#2b2520] focus:outline-none focus:border-[var(--wc-link)]"
                    />
                  </label>
                  <label className="block mt-6">
                    <span className="wc-smallcaps text-[#6b6157]">{t.yourPhone}</span>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="mt-1 w-full h-12 bg-transparent border-0 border-b border-[#2b2520]/30 text-[19px] wc-display text-[#2b2520] focus:outline-none focus:border-[var(--wc-link)]"
                    />
                  </label>

                  {card.enable_rsvp && (
                    <div className="mt-8 flex flex-col gap-1" role="group" aria-label={lang === "km" ? "ការចូលរួមពិធី" : "Attendance"}>
                      {([
                        ["attending", t.willAttend],
                        ["not_attending", t.cannotAttend],
                      ] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          aria-pressed={attendance === val}
                          onClick={() => setAttendance(val)}
                          className="flex items-center gap-4 min-h-12 text-left cursor-pointer"
                        >
                          <span className="relative w-6 h-6 border border-[#2b2520]/50 shrink-0">
                            <HandCheck className="absolute -top-1.5 -right-1.5 w-7 h-7 text-[var(--wc-link)]" />
                          </span>
                          <span className="wc-display text-[22px] text-[#2b2520]">{label}</span>
                        </button>
                      ))}
                      {attendance === "attending" && (
                        <div className="mt-3 flex items-center gap-4 pl-10">
                          <span className="text-[15px] text-[#6b6157]">{t.numGuests}</span>
                          <button type="button" aria-label={ui.fewer} onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-10 h-10 rounded-full border border-[#2b2520]/20 flex items-center justify-center cursor-pointer">
                            <Minus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <span className="wc-display text-[24px] w-6 text-center tabular-nums" aria-live="polite">{guestCount}</span>
                          <button type="button" aria-label={ui.more} onClick={() => setGuestCount(Math.min(10, guestCount + 1))} className="w-10 h-10 rounded-full border border-[#2b2520]/20 flex items-center justify-center cursor-pointer">
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="block mt-8">
                    <span className="wc-smallcaps text-[#6b6157]">{lang === "km" ? "ពាក្យជូនពរ" : "A note for the couple"}</span>
                    <textarea
                      required
                      rows={4}
                      value={blessingMessage}
                      onChange={(e) => setBlessingMessage(e.target.value)}
                      placeholder={t.blessingPlaceholder}
                      className="mt-1 w-full bg-transparent border-0 resize-none text-[18px] leading-[36px] wc-display italic text-[#2b2520] placeholder:text-[#6b6157]/60 focus:outline-none bg-[repeating-linear-gradient(transparent,transparent_35px,rgba(43,37,32,0.18)_35px,rgba(43,37,32,0.18)_36px)]"
                    />
                  </label>

                  <div className="mt-10 text-center">
                    <button
                      type="submit"
                      disabled={isSubmittingWish}
                      className="inline-flex items-center justify-center h-12 px-10 rounded-[2px] bg-[#2b2520] text-[#fbf7ef] text-[15px] tracking-wide hover:bg-[var(--wc-link)] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {t.sendBlessing}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {wishesList.length > 0 && (
              <div className="max-w-[1080px] mx-auto mt-20">
                <p className={`${sectionLabel} text-center mb-10`}>{ui.fromGuests} · {wishesList.length}</p>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishesList.map((wish, i) => (
                    <li key={wish.id} className={`wc-reveal bg-[#fffdf8] wc-grain p-6 shadow-[0_14px_30px_-20px_rgba(60,45,30,0.5)] ${collageTilt[i % collageTilt.length]}`}>
                      <p className="wc-display italic text-[19px] leading-snug text-[#2b2520]">&ldquo;{wish.blessing_message}&rdquo;</p>
                      <p className="mt-4 text-[13px] text-[#6b6157]">— {wish.guest_name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* =====================================================================
            BLESSING: Angkor Wat at dawn, then the traditional "Jayo!" cheer
           ===================================================================== */}
        <section className="relative overflow-hidden px-5 sm:px-6 pt-24 sm:pt-32 pb-16 text-center">
          <p className={sectionLabel}>{ui.blessing}</p>
          <AngkorDawn className="mx-auto mt-8 w-full max-w-[880px] text-[var(--wc-link)]" />
          <p className="mt-8 font-moul text-[clamp(28px,5vw,46px)] leading-[1.6] text-[var(--wc-link)]" aria-label="ជយោ! ជយោ! ជយោ!">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                className="wc-jayo mx-2 sm:mx-4"
                style={{ animationRange: `entry ${20 + i * 18}% cover ${38 + i * 18}%` } as React.CSSProperties}
              >
                ជយោ!
              </span>
            ))}
          </p>
          <p className="mt-4 mx-auto max-w-xl wc-khmer text-[17px] leading-[2] text-[#3a332c]">{ui.blessingLine}</p>
        </section>

        {/* Sign-off */}
        <footer className="px-6 pt-20 pb-24 text-center border-t border-[#2b2520]/10">
          <span className="mx-auto w-20 h-20 rounded-full border border-[var(--wc-link)]/50 flex items-center justify-center wc-display italic text-[24px] text-[var(--wc-link)]">
            {monogramInitials.replace(/\s/g, "")}
          </span>
          <p className={lang === "km" ? "mt-8 wc-khmer text-[18px] text-[#6b6157]" : "mt-8 wc-script text-[44px] leading-none text-[#3a332c]"}>{ui.withLove}</p>
          <p className="mt-3 wc-display text-[26px] text-[#2b2520]">{card.groom_name} &amp; {card.bride_name}</p>
          <p className="mt-2 text-[13px] text-[#6b6157]">{card.khmer_date}</p>
          <p className="mt-10 text-[11px] text-[#6b6157]/80">{ui.madeWith}</p>
        </footer>
      </main>

      {/* =========================================================================
          MODAL: KHQR
         ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.digitalGift}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#fffdf8] wc-grain p-8 shadow-2xl text-center animate-fade-in"
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              aria-label={t.close}
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-[#6b6157] hover:text-[#2b2520] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="wc-smallcaps text-[var(--wc-link)]">{t.digitalGift}</p>
            <h4 className="mt-2 wc-display text-[26px] text-[#2b2520]">{card.khqr_account_name || `${card.groom_name} & ${card.bride_name}`}</h4>
            <div className="wc-print my-6 inline-block">
              <img src={card.khqr_image_url} alt="Bakong KHQR Code" className="!w-52 !h-52 !object-contain" />
            </div>
            {card.khqr_account_number && (
              <div className="flex items-center justify-between gap-3 py-3 border-y border-[#2b2520]/10 text-[15px] text-[#2b2520] mb-6">
                <span className="font-mono">{card.khqr_account_number}</span>
                <button type="button" onClick={handleCopyAccount} className="wc-link min-h-11 cursor-pointer">
                  {copiedAccount ? t.copied : t.copyAccount}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full h-12 rounded-[2px] bg-[#2b2520] text-[#fbf7ef] text-[15px] cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FULLSCREEN LIGHTBOX
         ========================================================================= */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#14110e]/95 animate-fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <div className="wc-print">
              <img src={selectedImage} alt="" className="!w-auto !h-auto max-w-[88vw] max-h-[78vh] !object-contain" />
            </div>
            {gallery.includes(selectedImage) && gallery.length > 1 && (
              <div className="mt-5 flex items-center gap-6 text-white/80">
                <button type="button" onClick={() => stepLightbox(-1)} aria-label={ui.prev} className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center cursor-pointer hover:bg-white/10">
                  <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <span className="wc-display italic text-[15px] tabular-nums">No. {pad2(gallery.indexOf(selectedImage) + 1)} / {pad2(gallery.length)}</span>
                <button type="button" onClick={() => stepLightbox(1)} aria-label={ui.next} className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center cursor-pointer hover:bg-white/10">
                  <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 w-11 h-11 rounded-full text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
              aria-label={t.close}
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
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

      {/* Music: a small record in the corner */}
      {card.music_url && isOpen && (
        <aside aria-label="Wedding Music Player" className="fixed bottom-5 left-5 z-40">
          <button
            type="button"
            onClick={toggleMusic}
            aria-label={isPlayingMusic ? "ផ្អាកភ្លេងការ" : "ចាក់ភ្លេងការ"}
            aria-pressed={isPlayingMusic}
            className="flex items-center gap-3 h-12 pl-1.5 pr-4 rounded-full bg-[#fffdf8]/92 backdrop-blur border border-black/10 shadow-[0_8px_24px_rgba(60,45,30,0.18)] text-[#2b2520] cursor-pointer"
          >
            <span className={`w-9 h-9 rounded-full bg-[#2b2520] flex items-center justify-center ${isPlayingMusic ? "animate-spin-slow" : ""}`}>
              <span className="w-3 h-3 rounded-full bg-[var(--wc-light)]" />
            </span>
            <span className="text-[13px]">
              {isPlayingMusic ? t.musicPlaying : (lang === "km" ? "ចុចចាក់ភ្លេង" : "Play music")}
            </span>
          </button>
        </aside>
      )}
    </div>
  );
}
