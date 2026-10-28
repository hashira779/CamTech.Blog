"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Cormorant_Garamond, Kantumruy_Pro, Pinyon_Script } from "next/font/google";
import { WeddingCard, WeddingAgendaItem, WeddingReception, WeddingWish } from "@/types/wedding";
import { postWeddingWish, extractYouTubeVideoId } from "@/lib/wedding-api";
import { WeddingShareModal } from "./WeddingShareModal";
import { getTemplateById, getEnvelopeStyle, WEDDING_TEMPLATES } from "@/lib/wedding-templates";
import { isSafeUrl } from "@/lib/safe-url";
import { KhmerCornerFiligree } from "./WeddingFlowers";
import { CeremonyPiece } from "./khmer3d/CeremonyPiece";
import { HandCircle, HandCheck } from "./WeddingInk";
import { KbachArch, KbachBorder, KbachBurst, KbachChan, KbachCorner, KBACH_LATTICE_BG } from "./KhmerKbach";
import { RedThread, CeremonyIcon, type CeremonyIconName } from "./KhmerArt";
import { AngkorBlessing } from "./AngkorBlessing";
import { VenueEntrance } from "./VenueEntrance";
import { PhotoInvitation } from "./PhotoInvitation";
import { KhmerCouple } from "./KhmerCouple";
import { useSmoothWheel } from "./useSmoothWheel";
import { FlowerBank, PhotoFlowerDefs } from "./VenuePhotoFlowers";
import { Flower, GoldFrame } from "./InvitationDecor";
import { CoupleNames, PersonName } from "./CoupleNames";
import confetti from "canvas-confetti";
import {
  MapPin,
  X,
  Gift,
  ChevronLeft,
  ChevronRight,
  Share2,
  Minus,
  Plus
} from "lucide-react";

/* The invitation's own type: a Garamond for Latin display, Kantumruy Pro
   (a clean modern Khmer face) for all Khmer copy and names, and a pen
   script for a few English accents.
   All self-hosted by next/font like the site fonts. */
// Only the weights the card uses (measured: 300, 400, 600 and italic 300/400).
// Decorative Latin display: not preloaded, swap keeps text visible meanwhile
const wcDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-wc-display",
  display: "swap",
  preload: false,
});
// Khmer body and names: preloaded, it carries the invitation's content
const wcKhmer = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-wc-khmer",
  display: "swap",
});
// Pen-script accents in English mode only: never worth a preload
const wcScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-wc-script",
  display: "swap",
  preload: false,
});

/* Timeline of the envelope opening (ms), matched to the transition delays in
   globals.css: flap 0.25–1.2s, letter 1–2.1s, overlay fades 2.1–3s. */
const OPEN_CONFETTI_AT = 1500;
const OPEN_HERO_AT = 2100;
const OPEN_DONE_AT = 3000;
/* A returning guest gets the same ceremony at a brisker pace */
const REPLAY_SPEED = 0.45;

const noopSubscribe = () => () => {};

/* The rites in the order the ceremony section shows them */
const CEREMONY_KINDS: CeremonyIconName[] = ["procession", "blessing", "haircut", "popil", "sampeah", "chongdai", "petals"];

/* Fixed positions for the gold dust on the envelope stage (no Math.random in render) */
const STAGE_DUST = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 18 + ((i * 29) % 5) * 14,
  delay: `${(i * 0.7) % 6}s`,
  dur: `${7 + (i % 5) * 1.6}s`,
}));

/* Petals scattered when the seal breaks: end offset x, y (px), turn, delay */
const ENV_PETALS = [
  [-150, -120, 220, 0], [140, -150, -200, 0.05], [-190, 10, 160, 0.1], [180, -20, -140, 0.08], [-90, -190, 260, 0.12],
  [100, -210, -260, 0.02], [-210, -70, 200, 0.15], [220, -90, -180, 0.06], [-40, -230, 300, 0.1], [40, -170, -220, 0.14],
  [-160, 80, 140, 0.18], [170, 70, -160, 0.2],
] as const;

/* Khmer stacks vowels and subscript consonants above and below the line, so
   Khmer names need far more leading than Latin display type */
const KHMER_RE = /[\u1780-\u17FF\u19E0-\u19FF]/;
const hasKhmer = (text?: string | null) => !!text && KHMER_RE.test(text);

interface PremierRoyalKhmerCardProps {
  card: WeddingCard;
  isPreview?: boolean;
}

/* Days and hours until the wedding. Its own component, so the minute tick
   re-renders this one line and not the whole invitation (the hall scene
   alone is thousands of shapes) */
function TimeToGo({ target, format }: { target: number; format: (days: number, hours: number) => string }) {
  const [left, setLeft] = useState({ days: 0, hours: 0 });
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setLeft((prev) => {
        const days = Math.floor(diff / 86400000), hours = Math.floor((diff % 86400000) / 3600000);
        return prev.days === days && prev.hours === hours ? prev : { days, hours };
      });
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [target]);
  return <>{format(left.days, left.hours)}</>;
}

export function PremierRoyalKhmerCard({ card, isPreview = false }: PremierRoyalKhmerCardProps) {
  const [isOpen, setIsOpen] = useState(isPreview);
  // Wheel scrolling glides once the invitation is open (not in the editor preview)
  useSmoothWheel(isOpen && !isPreview);
  const [isOpeningAnim, setIsOpeningAnim] = useState(false);
  const [heroIn, setHeroIn] = useState(isPreview);
  const [openSpeed, setOpenSpeed] = useState(1);
  const envRef = useRef<HTMLDivElement | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  // The song can't be played here (removed, private, or embedding blocked)
  const [musicBroken, setMusicBroken] = useState(false);
  const [lang, setLang] = useState<"km" | "en">("km");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // Guest name from a personal link (?guest=). Read through
  // useSyncExternalStore so the first client render matches the server's
  // (which has no URL), then fills in: reading it in a useState initialiser
  // made every personal link a hydration mismatch (React error #418)
  const guestParam = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("guest"),
    () => null
  );
  const customGuestName = guestParam && guestParam.trim() ? guestParam.trim() : null;
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
  const [wishError, setWishError] = useState<string | null>(null);
  // Honeypot: hidden from people, filled in by form-spamming bots
  const [website, setWebsite] = useState("");

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

  const envelope = getEnvelopeStyle(template);
  const envVars = {
    "--env-stage": envelope.stage,
    "--env-body": envelope.body,
    "--env-flap": envelope.flap,
    "--env-foil": envelope.foil,
    "--env-wax": envelope.wax,
    "--env-wax-ink": envelope.waxInk,
    "--env-ink": envelope.ink,
    "--wc-t": String(openSpeed),
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
  // Names as typed can carry zero-width characters and runs of spaces
  const cleanName = (n: string) => (n || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  const groomName = cleanName(card.groom_name);
  const brideName = cleanName(card.bride_name);
  // Only a photo the couple gave us goes on the stage; never a template's stock couple
  const isStockPhoto = (u?: string) => !u || u.includes("images.unsplash.com") || WEDDING_TEMPLATES.some((tpl) => tpl.defaultCoverImage === u);
  const couplePortrait = !isStockPhoto(card.cover_image_url) ? card.cover_image_url : !isStockPhoto(card.groom_image_url) ? card.groom_image_url : undefined;
  const groomImage = card.groom_image_url || gallery[0] || heroImage;
  const brideImage = card.bride_image_url || gallery[1] || gallery[0] || heroImage;

  const eventDate = new Date(`${card.solar_date || "2026-11-28"}T${card.solar_time || "17:00"}:00`);
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // Once the invitation is open, prepare the 3D ceremony pieces in the
  // background so they are ready before the guest scrolls down to them
  useEffect(() => {
    if (!heroIn) return;
    const kinds = CEREMONY_KINDS;
    const start = () => {
      void import("./khmer3d/engine").then((m) => m.warmUpPieces(template.accentColor, kinds)).catch(() => {});
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(start, 600);
    return () => globalThis.clearTimeout(id);
  }, [heroIn, template.accentColor]);

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
  const openedKey = `wc-opened:${card.slug}`;

  /* Music. Browsers only let a page start sound from a tap, so it starts
     when the guest opens the envelope. Two things could still lose it: a
     YouTube player that hadn't loaded yet when they tapped, and a browser
     that refuses anyway. So the play request waits for the player, the
     button shows what is really playing (from the player's own events, not
     what we asked for), and if nothing plays, the guest's next tap anywhere
     on the card starts it. */
  const wantMusic = useRef(false);
  const ytReady = useRef(false);
  const ytCommand = (func: "playVideo" | "pauseVideo") => {
    ytIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: "" }), "https://www.youtube.com");
  };

  const startMusic = () => {
    if (!card.music_url) return;
    wantMusic.current = true;
    if (youtubeId) {
      if (ytReady.current) ytCommand("playVideo"); // otherwise sent once the player says it's ready
    } else {
      audioRef.current?.play().catch(() => {});
    }
  };

  const stopMusic = () => {
    wantMusic.current = false;
    if (youtubeId) ytCommand("pauseVideo");
    else audioRef.current?.pause();
  };

  // YouTube player events: ready, and its real playing state
  useEffect(() => {
    if (!youtubeId) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com" || e.source !== ytIframeRef.current?.contentWindow) return;
      let msg: { event?: string; info?: unknown };
      try { msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (msg.event === "onError") {
        setMusicBroken(true);
        return;
      }
      if (msg.event === "onReady" || (msg.event === "initialDelivery" && !ytReady.current)) {
        ytReady.current = true;
        if (wantMusic.current) ytCommand("playVideo");
      }
      const state = msg.event === "onStateChange" ? msg.info
        : msg.event === "infoDelivery" ? (msg.info as { playerState?: number } | null)?.playerState
        : undefined;
      if (typeof state === "number") setIsPlayingMusic(state === 1 || state === 3);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [youtubeId]);

  // Ask the player to report its events (the iframe API handshake)
  const handleYtLoad = () => {
    const w = ytIframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify({ event: "listening", id: "wedding-youtube-audio", channel: "widget" }), "https://www.youtube.com");
    w.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "https://www.youtube.com");
  };

  // If the music still isn't playing a moment after opening, the guest's
  // next tap or key press anywhere starts it
  useEffect(() => {
    if (!isOpen || isPreview || !card.music_url) return;
    let armed = false;
    const retry = () => { if (wantMusic.current && !isPlayingMusic) startMusic(); };
    const t = window.setTimeout(() => {
      if (!wantMusic.current || isPlayingMusic) return;
      armed = true;
      document.addEventListener("pointerup", retry, { once: true });
      document.addEventListener("keydown", retry, { once: true });
    }, 1500);
    return () => {
      window.clearTimeout(t);
      if (armed) {
        document.removeEventListener("pointerup", retry);
        document.removeEventListener("keydown", retry);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPlayingMusic, isPreview, card.music_url]);

  // Quiet while the guest is in another app or tab, back when they return
  useEffect(() => {
    if (!card.music_url || isPreview) return;
    const onVis = () => {
      if (!wantMusic.current) return;
      if (document.hidden) { if (youtubeId) ytCommand("pauseVideo"); else audioRef.current?.pause(); }
      else if (youtubeId) ytCommand("playVideo");
      else audioRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [card.music_url, isPreview, youtubeId]);

  // Straight to the invitation (returning guests, or anyone who'd rather not wait)
  const handleSkipEnvelope = () => {
    openTimers.current.forEach((id) => window.clearTimeout(id));
    startMusic();
    try { localStorage.setItem(openedKey, "1"); } catch {}
    setHeroIn(true);
    setIsOpen(true);
    setIsOpeningAnim(false);
  };

  // Pointer parallax: the envelope leans toward the cursor (mouse only)
  const handleStagePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || isOpeningAnim || !envRef.current) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    envRef.current.style.setProperty("--tilt-y", `${x * 14}deg`);
    envRef.current.style.setProperty("--tilt-x", `${-y * 10}deg`);
  };

  const handleOpenEnvelope = () => {
    if (isOpeningAnim) return;
    let seen = false;
    try { seen = localStorage.getItem(openedKey) === "1"; localStorage.setItem(openedKey, "1"); } catch {}
    const speed = seen ? REPLAY_SPEED : 1;
    setOpenSpeed(speed);
    envRef.current?.style.setProperty("--tilt-x", "0deg");
    envRef.current?.style.setProperty("--tilt-y", "0deg");
    setIsOpeningAnim(true);

    // Start music inside the tap itself so browsers allow the autoplay
    startMusic();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reduceMotion ? 0 : speed;
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
    if (isPlayingMusic) stopMusic();
    else startMusic();
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
    if (isSubmittingWish || !guestName.trim() || !blessingMessage.trim()) return;
    // The editor's preview renders this same card: never send a real response from it
    if (isPreview) {
      setWishError(lang === "km" ? "នេះជាការមើលគំរូ — ភ្ញៀវនឹងផ្ញើការឆ្លើយតបពី Link ពិត" : "This is a preview — guests reply from the real link");
      return;
    }

    setIsSubmittingWish(true);
    setWishError(null);
    try {
      const newWish = await postWeddingWish(card.slug, {
        guest_name: guestName.trim(),
        phone: guestPhone.trim() || undefined,
        attendance,
        guest_count: attendance === "attending" ? guestCount : 0,
        blessing_message: blessingMessage.trim(),
        website: website || undefined,
      });

      // Only what the server stored is shown, and a resubmission isn't listed twice
      setWishesList((prev) => (card.enable_wishes ? [newWish, ...prev.filter((w) => w.id !== newWish.id)] : prev));
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

      setTimeout(() => setWishSuccess(false), 6000);
    } catch (err) {
      setWishError(err instanceof Error ? err.message : String(err));
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
      auspiciousBlessing: "សិរីសួស្ដី ជ័យមង្គល",
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
      blessingLine: "សូមឱ្យគូស្វាមីភរិយាថ្មី រស់នៅជាមួយគ្នាដោយសុខដុមរមនា រហូតដល់ចាស់កោងខ្នង។",
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
        <audio
          ref={audioRef}
          loop
          src={card.music_url}
          preload="auto"
          playsInline
          onPlaying={() => setIsPlayingMusic(true)}
          onPause={() => setIsPlayingMusic(false)}
          onError={() => setMusicBroken(true)}
        />
      )}
      {card.music_url && youtubeId && (
        <div className="fixed -bottom-96 -left-96 pointer-events-none opacity-0 h-1 w-1 overflow-hidden" aria-hidden="true">
          <iframe
            ref={ytIframeRef}
            id="wedding-youtube-audio"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&loop=1&playlist=${youtubeId}`}
            allow="autoplay"
            title="Wedding Audio Player"
            onLoad={handleYtLoad}
          />
        </div>
      )}

      {/* Floating Ambient Falling Petals */}


      {/* Corner controls: language, petals, share */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLang(lang === "km" ? "en" : "km")}
          className="h-10 px-4 rounded-full bg-[#fffdf8]/90 backdrop-blur border border-black/10 text-[13px] text-[#2b2520] shadow-sm cursor-pointer"
        >
          {lang === "km" ? "English" : "ភាសាខ្មែរ"}
        </button>
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
          className={`wc-overlay fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 sm:gap-9 px-5 py-6 overflow-hidden ${isOpeningAnim ? "is-opening" : ""}`}
          style={envVars}
          onPointerMove={handleStagePointer}
          onPointerLeave={() => {
            envRef.current?.style.setProperty("--tilt-x", "0deg");
            envRef.current?.style.setProperty("--tilt-y", "0deg");
          }}
        >
          {/* Gold kbach sprays framing the stage; they glide away as it opens */}
          <KbachCorner className="wc-stage-corner absolute top-3 left-3 w-20 h-20 sm:w-28 sm:h-28 opacity-80 pointer-events-none" />
          <KbachCorner flip="x" className="wc-stage-corner absolute top-3 right-3 w-20 h-20 sm:w-28 sm:h-28 opacity-80 pointer-events-none" />
          <KbachCorner flip="y" className="wc-stage-corner absolute bottom-3 left-3 w-20 h-20 sm:w-28 sm:h-28 opacity-80 pointer-events-none" />
          <KbachCorner flip="xy" className="wc-stage-corner absolute bottom-3 right-3 w-20 h-20 sm:w-28 sm:h-28 opacity-80 pointer-events-none" />

          {/* Stage: warm key light behind the envelope, drifting gold dust */}
          <div aria-hidden="true" className="wc-stage-light absolute inset-0 pointer-events-none" />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            {STAGE_DUST.map((d, i) => (
              <span
                key={i}
                className="wc-dust absolute rounded-full"
                style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.dur }}
              />
            ))}
          </div>

          {/* Before the envelope is opened the guest should already know whose
              wedding it is, that it is addressed to them, when and where */}
          <div className="wc-env-intro relative text-center max-w-[min(92vw,520px)]">
            <div className="wc-env-crest"><KbachArch className="mx-auto w-16 h-[74px] sm:w-20 sm:h-[92px]" /></div>
            <p className={lang === "km" ? "wc-khmer mt-2 text-base text-[var(--env-foil)]" : "wc-script mt-1 text-3xl text-[var(--env-foil)]"}>
              {lang === "km" ? "លិខិតអញ្ជើញ" : "You are invited"}
            </p>
            <h1 className={`mt-2 wc-display text-[clamp(22px,5.4vw,34px)] text-[#fbf3e1] ${hasKhmer(card.groom_name + card.bride_name) ? "wc-km-lh" : "leading-tight"}`}>
              <CoupleNames groom={card.groom_name} bride={card.bride_name} ampClassName="not-italic font-sans text-[0.8em] align-middle text-[var(--env-foil)]" />
            </h1>
            <p className="mt-3 text-[13px] sm:text-sm text-white/70 wc-km-lh">
              {lang === "km" ? "សូមគោរពអញ្ជើញ" : "Respectfully inviting"}
            </p>
            <p className="wc-khmer text-[clamp(16px,4.2vw,20px)] font-semibold text-[var(--env-foil)] wc-km-lh break-words">
              {customGuestName || (lang === "km" ? "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី" : "Our honored guest")}
            </p>
          </div>

          <div className="wc-env-float relative">
            <div ref={envRef} className="wc-env relative w-[min(86vw,380px)] aspect-[3/2]">
              <div aria-hidden="true" className="wc-env-shadow absolute -inset-x-[6%] -bottom-[18%] h-[22%] rounded-[50%]" />
              <div className="wc-env-back absolute inset-0 rounded-[4px]" />

              {/* The invitation card inside */}
              <div className="wc-letter wc-grain absolute left-[4%] right-[4%] top-[5%] h-[88%] rounded-[2px] bg-[#fbf7ef] flex flex-col items-center justify-center gap-1 px-4 text-center text-[#2b2520]">
                <span aria-hidden="true" className="absolute inset-[5px] border border-[color-mix(in_oklab,var(--env-foil)_60%,transparent)] pointer-events-none" />
                <KhmerCornerFiligree position="top-left" className="absolute top-1.5 left-1.5 w-5 h-5 text-[var(--wc-link)] opacity-70" />
                <KhmerCornerFiligree position="top-right" className="absolute top-1.5 right-1.5 w-5 h-5 text-[var(--wc-link)] opacity-70" />
                <span className="wc-smallcaps text-[10px] text-[var(--wc-link)]">{ui.weddingOf}</span>
                <span className={`wc-display text-2xl sm:text-[28px] ${hasKhmer(card.groom_name + card.bride_name) ? "wc-km-lh" : "leading-tight"}`}>
                  <CoupleNames groom={card.groom_name} bride={card.bride_name} ampClassName="italic text-[var(--wc-link)]" />
                </span>
                <span className="text-[11px] text-[#6b6157] wc-km-lh">{card.khmer_date || card.solar_date}</span>
                <span className="mt-1.5 text-[11px] text-[#2b2520] truncate max-w-full">
                  {customGuestName || (lang === "km" ? "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី" : "Honored Guest")}
                </span>
              </div>

              {/* Front pocket: silk-like material, foil hairline, kbach corners and a passing sheen */}
              <div className="wc-env-pocket absolute inset-0 z-[3] rounded-[4px]">
                {/* The three folds of the envelope's back: each lit a little
                    differently, with a fine shadow and highlight along the seams */}
                <svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
                  <path d="M0 0 L150 112 L0 200 Z" fill="#fff" fillOpacity="0.07" />
                  <path d="M300 0 L150 112 L300 200 Z" fill="#000" fillOpacity="0.08" />
                  <path d="M0 200 L150 96 L300 200 Z" fill="#fff" fillOpacity="0.05" />
                  <path d="M0 200 L150 96 L300 200" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1.6" vectorEffect="non-scaling-stroke" transform="translate(0 1.5)" />
                  <path d="M0 200 L150 96 L300 200" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <path d="M0 0 L150 112 M300 0 L150 112" fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
                <span aria-hidden="true" className="wc-env-foil absolute inset-[7px] rounded-[2px]" />
                <KhmerCornerFiligree position="bottom-left" className="absolute bottom-2 left-2 w-7 h-7 text-[var(--env-foil)]" />
                <KhmerCornerFiligree position="bottom-right" className="absolute bottom-2 right-2 w-7 h-7 text-[var(--env-foil)]" />
                <span aria-hidden="true" className="wc-env-sheen absolute inset-0" />
              </div>

              {/* Flap: an outer face and a foil-patterned lining that shows once it turns */}
              <div className="wc-flap absolute left-0 right-0 top-0 h-[66%]">
                <span className="wc-flap-face wc-flap-front absolute inset-0" />
                <span className="wc-flap-face wc-flap-back absolute inset-0" />
              </div>

              {/* Template flowers bloom out of the envelope as it opens */}
              {/* Sprays of flowers tucked over two corners of the envelope */}
              <svg viewBox="-70 -60 140 80" aria-hidden="true" className="wc-env-spray wc-env-spray-l pointer-events-none absolute z-[7] -left-[9%] -bottom-[12%] w-[46%] h-auto overflow-visible">
                <defs><PhotoFlowerDefs /></defs>
                <FlowerBank x={0} y={14} w={120} h={66} n={9} seed={5} />
              </svg>
              <svg viewBox="-70 -60 140 80" aria-hidden="true" className="wc-env-spray wc-env-spray-r pointer-events-none absolute z-[7] -right-[8%] -top-[14%] w-[34%] h-auto overflow-visible">
                <FlowerBank x={0} y={14} w={110} h={58} n={7} seed={9} mix={["rumduol", "rose", "jasmine", "rumduol", "blush", "orchid"]} />
              </svg>
              {/* Petals thrown out as the seal breaks */}
              {ENV_PETALS.map(([x, y, r, d], i) => (
                <span key={i} aria-hidden="true" className={`wc-burst-petal pointer-events-none absolute z-[8] ${i % 3 === 1 ? "wc-burst-petal--rose" : ""}`} style={{ "--px": `${x}px`, "--py": `${y}px`, "--pr": `${r}deg`, "--pd": `${d}s` } as React.CSSProperties} />
              ))}

              <KbachBurst className="absolute left-1/2 top-[66%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 z-[8]" />
              <button
                type="button"
                onClick={handleOpenEnvelope}
                aria-label={t.tapToOpen}
                className="wc-seal absolute left-1/2 top-[66%] z-[6] w-[78px] h-[78px] flex items-center justify-center cursor-pointer"
              >
                <span aria-hidden="true" className="wc-seal-ring absolute inset-0 rounded-full" />
                <span aria-hidden="true" className="wc-seal-gloss absolute inset-0" />
                <span className={`relative w-[58px] h-[58px] rounded-full border border-[color-mix(in_oklab,var(--env-wax-ink)_45%,transparent)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.25)] flex items-center justify-center text-[var(--env-wax-ink)] ${hasKhmer(monogramInitials) ? "font-moul text-[15px] leading-none" : "wc-display italic text-[19px]"}`}>
                  {monogramInitials.replace(/\s/g, "")}
                </span>
              </button>
            </div>
          </div>

          <div className="wc-env-intro relative flex flex-col items-center gap-3 max-w-[min(92vw,520px)]">
            {/* When and where, readable without opening anything */}
            <p className="text-center text-[13px] sm:text-sm text-white/80 wc-km-lh">
              {weekdayName}{weekdayName && " · "}{prettyDate}{card.solar_time && ` · ${card.solar_time}`}
            </p>
            {eveningReception.venue && (
              <p className="flex items-start justify-center gap-1.5 text-center text-[13px] sm:text-sm text-white/70 wc-km-lh">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--env-foil)]" aria-hidden="true" />
                <span>{eveningReception.venue}{eveningReception.hall ? ` · ${eveningReception.hall}` : ""}</span>
              </p>
            )}
            <p className={`wc-breathe mt-2 text-white/75 text-center ${lang === "km" ? "text-sm" : "text-[11px] tracking-[0.25em] uppercase"}`}>
              {t.tapToOpen}
            </p>
            <button
              type="button"
              onClick={handleSkipEnvelope}
              className="text-[12px] text-white/45 hover:text-white/80 underline underline-offset-4 decoration-white/20 transition cursor-pointer"
            >
              {lang === "km" ? "រំលង ›" : "Skip ›"}
            </button>
          </div>
        </div>
      )}

      <main className="relative z-20">

        {/* =====================================================================
            ARRIVAL: the gate, the path to the wedding hall, inside to the stage
            (VenueEntrance.tsx). Everything shown comes from this card.
           ===================================================================== */}
        <VenueEntrance
          groom={groomName}
          bride={brideName}
          khmerNames={hasKhmer(groomName + brideName)}
          kicker={ui.weddingOf}
          dateLine={`${weekdayName}${weekdayName ? " · " : ""}${prettyDate}`}
          timeLine={card.solar_time ? `${ui.at} ${card.solar_time}` : undefined}
          venue={[eveningReception.venue, eveningReception.hall].filter(Boolean).join(" · ") || undefined}
          guestLine={customGuestName ? `${t.invitedHonoredGuest} — ${customGuestName}` : undefined}
          portrait={couplePortrait}
          ornaments={card.ornaments}
          scrollHint={lang === "km" ? "រំកិលចុះ ដើម្បីចូលរោងការ" : "Scroll to enter"}
        />

        {/* =====================================================================
            I. THE INVITATION: a printed letter with the parents' names
           ===================================================================== */}
        <PhotoInvitation
          lang={lang}
          label={ui.s1}
          invite={ui.invite}
          honor={t.invitationHonor}
          blessing={t.auspiciousBlessing}
          groom={{ name: groomName, title: t.groomTitle, parents: card.groom_parents, parentsTitle: t.groomParentsTitle }}
          bride={{ name: brideName, title: t.brideTitle, parents: card.bride_parents, parentsTitle: t.brideParentsTitle }}
          dateLine={`${weekdayName}${weekdayName ? " · " : ""}${prettyDate}`}
          timeLine={card.solar_time ? `${ui.at} ${card.solar_time}` : undefined}
          venue={[eveningReception.venue, eveningReception.hall].filter(Boolean).join(" · ") || undefined}
          portrait={couplePortrait}
        />

        {/* =====================================================================
            II. THE COUPLE: two prints, laid off-grid
           ===================================================================== */}
        <section className="px-5 sm:px-6 pb-24 sm:pb-32">
          <div className="max-w-[1080px] mx-auto">
            <p className={sectionLabel}>{ui.s2}</p>
            <KbachBorder className="mt-3 mb-10 w-48 sm:w-56 h-auto" />
            <div className="relative grid grid-cols-1 md:grid-cols-12 gap-14 md:gap-6">
              {[
                { img: groomImage, role: t.theGroom, name: card.groom_name, cls: "relative z-10 md:col-span-6 wc-tilt-l", capCls: "" },
                { img: brideImage, role: t.theBride, name: card.bride_name, cls: "relative z-10 md:col-span-5 md:col-start-8 md:mt-40 wc-tilt-r", capCls: "md:text-right" },
              ].map((p) => (
                <figure key={p.role} className={`wc-reveal m-0 ${p.cls}`}>
                  <KbachChan className="absolute -top-5 left-1/2 -translate-x-1/2 w-11 h-11 z-[2] pointer-events-none" />
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
                    <span className="block mt-1 wc-display text-[32px] sm:text-[40px] leading-tight text-[#2b2520]"><PersonName name={p.name} /></span>
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
        <section className="relative overflow-clip px-5 sm:px-6 py-24 sm:py-32">
          <div className="max-w-[1080px] mx-auto grid md:grid-cols-2 gap-14 items-center">
            <div className="wc-reveal">
              <p className={sectionLabel}>{ui.s3}</p>
              <KbachBorder className="mt-3 w-44 sm:w-52 h-auto" />
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
                <TimeToGo
                  target={eventDate.getTime()}
                  format={(days, hours) =>
                    lang === "en"
                      ? `${days} ${t.days.toLowerCase()}, ${hours} ${t.hours.toLowerCase()} ${ui.toGo}`
                      : `${ui.toGo} ${days} ${t.days} ${hours} ${t.hours}`
                  }
                />
              </p>
              <a href={buildGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="wc-link mt-6 inline-block text-[15px]">
                {ui.addCal}
              </a>
            </div>

            {dateValid && (
              <div className="relative mx-3 sm:mx-6">
              <Flower name="orchid-white" from="r" delay={0.2} className="z-20 -right-[14%] -top-[26%] w-[34%] max-w-[180px] -scale-x-100" />
              <Flower name="rose-white" delay={0.35} className="z-20 -left-[14%] -bottom-[20%] w-[26%] max-w-[130px] -rotate-[12deg]" />
              <Flower name="plumeria" delay={0.45} className="z-20 left-[6%] -bottom-[15%] w-[11%] max-w-[56px] rotate-[20deg]" />
              <div className="wc-reveal relative bg-[#fffdf8] wc-grain p-8 sm:p-11 shadow-[0_30px_60px_-34px_rgba(60,45,30,0.5)]">
                <GoldFrame corner="w-12 h-12 sm:w-14 sm:h-14" />
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
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            IV. THE PROGRAMME: printed like a menu, on dark card stock
           ===================================================================== */}
        <section className="relative overflow-clip px-5 sm:px-6 py-24 sm:py-32 bg-[var(--wc-deep)] wc-grain text-[#f3ece0]">
          <Flower name="orchid-spray" sway delay={0.1} className="z-20 right-[2%] -top-[2%] w-[26%] max-w-[200px] -scale-x-100" />
          <Flower name="jasmine" delay={0.3} className="z-20 -left-[4%] -bottom-[2%] w-[32%] max-w-[260px]" />
          <div className="relative max-w-[920px] mx-auto px-5 sm:px-12 py-14 sm:py-16">
            <GoldFrame tone="dark" />
            <p className="wc-smallcaps text-[var(--wc-light)]">{ui.s4}</p>
            <KbachBorder className="mt-3 w-48 sm:w-56 h-auto" />
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
                <div className="relative mt-8 px-6 py-7 text-center">
                  <div aria-hidden="true" className="absolute inset-0 border border-[#D9B45A]/60" />
                  <div aria-hidden="true" className="absolute inset-1.5 border border-[#D9B45A]/25" />
                  <KbachChan className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8" />
                  <p className="wc-khmer text-[22px] sm:text-[24px] font-semibold leading-snug text-[#FBEFCF]">{eveningReception.venue}</p>
                  {eveningReception.hall && <p className="mt-1 wc-khmer text-[15px] text-[#F1D683]/90">{eveningReception.hall}</p>}
                  <p className="mt-2 wc-khmer text-[14px] leading-relaxed text-white/65">{eveningReception.address}</p>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px]">
                  {eveningReception.map_url && isSafeUrl(eveningReception.map_url) && (
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
            V. KHMER TRADITIONS: the rites in order, each object of the rite
            standing on a carved plinth (real 3D, see khmer3d/), joined by a
            gold thread that draws itself as the guest scrolls
           ===================================================================== */}
        <section className="wc-rites relative px-5 sm:px-6 py-24 sm:py-32 overflow-x-clip" style={{ backgroundImage: KBACH_LATTICE_BG }}>
          <div className="relative max-w-[1080px] mx-auto">
            <header className="text-center max-w-2xl mx-auto">
              <p className={sectionLabel}>{ui.s5}</p>
              <KbachArch className="mx-auto mt-6 w-16 h-[74px]" />
              <h2 className="wc-reveal mt-3 font-moul text-[clamp(24px,3.6vw,38px)] leading-[1.75] text-[#1a1816]">{ui.traditionsTitle}</h2>
              <p className="mt-3 text-[17px] leading-[1.9] text-[#2a241e]">{ui.traditionsNote}</p>
            </header>

            <ol className="relative mt-16 sm:mt-20">
              {/* The red-gold thread binding the rites together */}
              <span aria-hidden="true" className="wc-rite-thread absolute top-0 bottom-0 left-[27px] md:left-1/2 w-[2px] -translate-x-1/2" />
              {CEREMONIES.map((c, i) => {
                const flip = i % 2 === 1;
                return (
                  <li key={c.icon} className="wc-rite relative grid md:grid-cols-2 items-center gap-x-16 gap-y-6 pl-16 md:pl-0 pb-16 md:pb-24 last:pb-0">
                    {/* Knot on the thread */}
                    <span aria-hidden="true" className="wc-rite-knot absolute left-[27px] md:left-1/2 top-8 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-[18px] h-[18px] rotate-45" />

                    {/* The object of the rite in its niche */}
                    <div className={`wc-rite-niche relative mx-auto md:mx-0 w-full max-w-[340px] aspect-[4/5] ${flip ? "md:order-2 md:justify-self-start" : "md:justify-self-end"}`}>
                      {/* Pka chan flower crowning the arch of each niche */}
                      <KbachChan className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 z-[2] pointer-events-none" />
                      <span aria-hidden="true" className="absolute inset-[10px] rounded-t-[999px] rounded-b-[6px] border border-[color-mix(in_oklab,var(--wc-accent)_45%,transparent)] pointer-events-none z-[1]" />
                      <KhmerCornerFiligree position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-[var(--wc-link)] opacity-80 z-[1]" />
                      <KhmerCornerFiligree position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-[var(--wc-link)] opacity-80 z-[1]" />
                      {card.ornaments?.[`rite_${c.icon}`] ? (
                        // The couple's own photo of this ceremony, in the arch of the niche
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.ornaments[`rite_${c.icon}`]} alt={c.km} loading="lazy" decoding="async" className="absolute inset-[10px] h-[calc(100%-20px)] w-[calc(100%-20px)] rounded-t-[999px] rounded-b-[6px] object-cover" />
                      ) : (
                      <CeremonyPiece
                        kind={c.icon}
                        accent={template.accentColor}
                        baseTurn={(i % 3 - 1) * 0.5}
                        className="absolute inset-x-0 bottom-[6%] top-[12%]"
                        fallback={<CeremonyIcon name={c.icon} className="w-24 h-24 text-[var(--wc-link)]" />}
                      />
                      )}
                    </div>

                    {/* Its name and meaning */}
                    <div className={`relative ${flip ? "md:order-1 md:text-right" : ""}`}>
                      <span className="block font-moul text-[34px] leading-[1.4] text-[var(--wc-link)]" aria-hidden="true">{KHMER_NUMERALS[i]}</span>
                      <h3 className="mt-1 wc-khmer text-[clamp(21px,2.4vw,26px)] font-semibold leading-[1.75] text-[#1a1816]">{c.km}</h3>
                      {lang === "en" && <p className="wc-display italic text-[20px] leading-snug text-[#3a3128]">{c.en}</p>}
                      <span aria-hidden="true" className={`block mt-4 h-px w-24 bg-[linear-gradient(90deg,var(--wc-gold),transparent)] ${flip ? "md:ml-auto md:bg-[linear-gradient(270deg,var(--wc-gold),transparent)]" : ""}`} />
                      <p className={`mt-4 wc-khmer text-[16.5px] leading-[1.95] text-[#2a241e] max-w-[44ch] ${flip ? "md:ml-auto" : ""}`}>{lang === "km" ? c.kmNote : c.enNote}</p>
                    </div>
                  </li>
                );
              })}
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
                  <KbachBorder className="mt-3 w-44 sm:w-52 h-auto" />
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
            <p className={sectionLabel}>{ui.s7}</p>
            <KbachBorder className="mt-3 mb-12 w-44 sm:w-52 h-auto" />
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
        {(card.enable_wishes || card.enable_rsvp) && (
          <section className="relative overflow-clip px-5 sm:px-6 pt-8 pb-24 sm:pb-32">
            <p className={`${sectionLabel} text-center`}>{ui.s8}</p>
            <KbachBorder className="mx-auto mt-3 mb-8 w-48 sm:w-56 h-auto" />
            <div className="relative max-w-[600px] mx-auto">
            <Flower name="rose-white" delay={0.1} className="z-20 -left-[9%] -top-[5%] w-[24%] max-w-[150px] -rotate-[10deg]" />
            <Flower name="plumeria" delay={0.2} className="z-20 left-[11%] -top-[4%] w-[10%] max-w-[60px] rotate-[24deg]" />
            <Flower name="plumeria-pink" from="r" delay={0.25} className="z-20 -right-[8%] -top-[4%] w-[24%] max-w-[150px] rotate-[12deg]" />
            <Flower name="orchid-white" from="r" delay={0.4} className="z-20 -right-[10%] -bottom-[4%] w-[30%] max-w-[190px] -scale-x-100" />
            <div className="wc-reveal relative bg-[#fffdf8] wc-grain px-7 sm:px-14 py-14 sm:py-16 shadow-[0_30px_60px_-34px_rgba(60,45,30,0.5)]">
              <GoldFrame />

              {wishSuccess ? (
                <div role="status" className="text-center py-10">
                  {lang === "km"
                    ? <p className="font-moul text-[24px] text-[var(--wc-link)]">សូមអរគុណ</p>
                    : <p className="wc-script text-[56px] text-[var(--wc-link)] leading-none">Thank you</p>}
                  <p className="mt-4 text-[16px] text-[#3a332c]">{t.blessingSent}</p>
                </div>
              ) : (
                <form onSubmit={handleWishSubmit} className="relative" aria-busy={isSubmittingWish}>
                  <label aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                    Website
                    <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </label>
                  <div className="text-center">
                    <h2 className="wc-display text-[40px] sm:text-[48px] leading-tight text-[#2b2520]">{ui.reply}</h2>
                    <p className="mt-2 text-[15px] text-[#6b6157]">{ui.replyNote}</p>
                  </div>

                  <label className="block mt-10">
                    <span className="wc-smallcaps text-[#6b6157]">{t.yourName}</span>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="mt-1 w-full h-12 bg-transparent border-0 border-b border-[#2b2520]/30 text-[19px] wc-display text-[#2b2520] focus:outline-none focus:border-[var(--wc-link)]"
                    />
                  </label>
                  <label className="block mt-6">
                    <span className="wc-smallcaps text-[#6b6157]">{t.yourPhone}</span>
                    <input
                      type="tel"
                      maxLength={30}
                      autoComplete="tel"
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
                      maxLength={1000}
                      value={blessingMessage}
                      onChange={(e) => setBlessingMessage(e.target.value)}
                      placeholder={t.blessingPlaceholder}
                      className="mt-1 w-full bg-transparent border-0 resize-none text-[18px] leading-[36px] wc-display italic text-[#2b2520] placeholder:text-[#6b6157]/60 focus:outline-none bg-[repeating-linear-gradient(transparent,transparent_35px,rgba(43,37,32,0.18)_35px,rgba(43,37,32,0.18)_36px)]"
                    />
                  </label>

                  {wishError && (
                    <p role="alert" className="mt-8 px-4 py-3 border border-[#9e1927]/30 bg-[#9e1927]/[0.06] text-[14px] text-[#7f1d1d] text-center">
                      {wishError}
                    </p>
                  )}

                  <div className="mt-10 text-center">
                    <button
                      type="submit"
                      disabled={isSubmittingWish}
                      className="inline-flex items-center justify-center gap-2 h-12 px-10 rounded-[2px] bg-[#2b2520] text-[#fbf7ef] text-[15px] tracking-wide hover:bg-[var(--wc-link)] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isSubmittingWish && <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                      {t.sendBlessing}
                    </button>
                  </div>
                </form>
              )}
            </div>
            </div>

            {card.enable_wishes && wishesList.length > 0 && (
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
            BLESSING: Angkor Wat at dawn in gilded sandstone relief, then the
            «សិរីសួស្ដី ជ័យមង្គល» blessing (see AngkorBlessing.tsx)
           ===================================================================== */}
        <AngkorBlessing label={ui.blessing} line={ui.blessingLine} labelClassName={sectionLabel} />

        {/* Sign-off */}
        <footer className="relative overflow-clip px-6 pt-24 pb-20 text-center bg-[radial-gradient(60%_38%_at_50%_42%,rgba(255,250,238,0.9),transparent_75%)]">
          {/* The bride and groom in a gold-ringed medallion, cradled by a
              crescent of drawn flowers (rumduol among them) that stays
              beside and below the ring, clear of the words */}
          <div className="relative mx-auto w-[min(86vw,360px)] h-[190px]">
            <svg viewBox="-180 -95 360 190" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
              <defs><PhotoFlowerDefs /></defs>
              <FlowerBank x={-104} y={58} w={120} h={70} n={10} seed={61} mix={["rumduol", "blush", "rose", "jasmine", "rumduol", "orchid"]} />
              <FlowerBank x={104} y={58} w={120} h={70} n={10} seed={62} mix={["rumduol", "rose", "blush", "jasmine", "rumduol", "plumeria"]} />
              <FlowerBank x={0} y={92} w={150} h={40} n={8} seed={63} mix={["rumduol", "rose", "jasmine", "blush"]} />
            </svg>
            <span className="wc-reveal absolute left-1/2 top-0 -translate-x-1/2 z-10 w-36 h-36 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fffdf8,#f6ecda)] shadow-[0_0_0_1.5px_#C9A24A,0_0_0_7px_#fffdf8,0_0_0_8px_rgba(201,162,74,0.55),0_18px_40px_-18px_rgba(90,55,20,0.45)] flex items-end justify-center overflow-hidden">
              <KhmerCouple className="w-[84%] h-auto -mb-[3%]" />
            </span>
          </div>

          <p className={lang === "km" ? "mt-10 wc-khmer text-[15px] font-medium text-[#8B1E24]" : "mt-10 wc-script text-[40px] leading-none text-[#8B1E24]"}>{ui.withLove}</p>
          <p className={`mt-3 ${hasKhmer(card.groom_name + card.bride_name) ? "wc-khmer font-semibold leading-[1.4]" : "wc-display leading-tight"} text-[clamp(24px,6vw,32px)] text-[#2b2520]`}>
            <span className="block"><PersonName name={card.groom_name} /></span>
            <span className="block text-[0.6em] font-light text-[#B08A3E]">&amp;</span>
            <span className="block"><PersonName name={card.bride_name} /></span>
          </p>
          <div aria-hidden="true" className="mx-auto mt-5 flex w-44 items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A24A]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#C9A24A]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A24A]" />
          </div>
          <p className="mt-4 wc-khmer text-[13px] leading-relaxed text-[#6b6157]">{card.khmer_date}</p>
          <p className="mt-12 text-[11px] tracking-wide text-[#6b6157]/70">{ui.madeWith}</p>
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
      {card.music_url && isOpen && !musicBroken && (
        <aside aria-label="Wedding Music Player" className="fixed bottom-5 left-5 z-40">
          <button
            type="button"
            onClick={toggleMusic}
            aria-label={isPlayingMusic ? "ផ្អាកភ្លេងការ" : "ចាក់ភ្លេងការ"}
            aria-pressed={isPlayingMusic}
            className={`flex items-center gap-3 h-12 pl-1.5 pr-4 rounded-full bg-[#fffdf8]/92 ${isPlayingMusic ? "" : "wc-music-nudge"} backdrop-blur border border-black/10 shadow-[0_8px_24px_rgba(60,45,30,0.18)] text-[#2b2520] cursor-pointer`}
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
