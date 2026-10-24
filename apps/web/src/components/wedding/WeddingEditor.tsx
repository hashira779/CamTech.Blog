"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { WeddingCard, WeddingAgendaItem, WeddingReception, CuratedSong, YouTubeResolveResponse } from "@/types/wedding";
import {
  updateMyWeddingCard,
  resolveYouTubeAudio,
  fetchCuratedSongs,
  DEFAULT_CURATED_SONGS,
  uploadWeddingImages
} from "@/lib/wedding-api";
import { WEDDING_TEMPLATES, getTemplateById, WeddingTemplateDefinition } from "@/lib/wedding-templates";
import { WeddingFlowerIcon } from "./WeddingFlowers";
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
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Music,
  Search,
  Loader2,
  Headphones,
  Radio,
  Palette,
  Image as ImageIcon,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
  Camera,
  Columns2,
  Smartphone,
  Monitor,
  LogOut,
  AlertCircle,
  Crown,
  Link2,
  ShieldCheck,
  Star
} from "lucide-react";

interface WeddingEditorProps {
  initialCard: WeddingCard;
  token: string;
  onLogout: () => void;
}

type TabId = "templates" | "details" | "photos" | "schedule" | "venue" | "music" | "gift" | "settings";
type ViewMode = "editor" | "split" | "preview";
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };

/* Virtual viewport the desktop preview lays out at before scaling to fit */
const DESKTOP_WIDTH = 1280;

const DEFAULT_EVENING: WeddingReception = {
  venue: "មជ្ឈមណ្ឌលសន្និបាត និងពិព័រណ៍ ឌឹ ព្រេមៀ សេនធ័រ សែនសុខ",
  hall: "អាគារ A",
  time: "05:00 ល្ងាច",
  address: "ផ្លូវ 1003 សង្កាត់ភ្នំពេញថ្មី រាជធានីភ្នំពេញ",
  map_url: "https://maps.google.com/?q=The+Premier+Center+Sen+Sok+Phnom+Penh"
};

const STUDIO_PRESETS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80"
];

/* Links end up in public hrefs and srcs, so only plain web URLs are accepted
   (blocks javascript:, data: and friends). Relative upload paths are allowed. */
function isSafeUrl(value?: string): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ─── Small building blocks ─────────────────────────────────────────────── */

const inputCls =
  "w-full h-11 px-3.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none transition duration-200 hover:border-stone-300 dark:hover:border-white/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15";
const textareaCls = inputCls.replace("h-11", "min-h-[84px] py-3 leading-relaxed resize-y");

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300">{label}</span>
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11px] text-rose-600"><AlertCircle className="w-3 h-3" />{error}</span>
      ) : hint ? (
        <span className="block text-[11px] text-stone-400">{hint}</span>
      ) : null}
    </label>
  );
}

function Panel({ icon: Icon, title, subtitle, action, children }: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="we-panel rounded-[28px] p-5 sm:p-7 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <span className="we-icon-chip shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-tight text-stone-900 dark:text-white leading-snug">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] hover:border-amber-400/60 transition text-left cursor-pointer"
    >
      <span>
        <span className="block text-[13px] font-semibold text-stone-900 dark:text-white">{title}</span>
        <span className="block text-[11.5px] text-stone-500 mt-0.5">{desc}</span>
      </span>
      <span className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 ${checked ? "bg-gradient-to-r from-amber-500 to-amber-700" : "bg-stone-300 dark:bg-stone-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

/* ─── Editor ────────────────────────────────────────────────────────────── */

export function WeddingEditor({ initialCard, token, onLogout }: WeddingEditorProps) {
  const [card, setCard] = useState<WeddingCard>(initialCard);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialCard));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("templates");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [lang, setLang] = useState<"km" | "en">("km");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [themeSwap, setThemeSwap] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });

  // Photos
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const groomInputRef = useRef<HTMLInputElement>(null);
  const brideInputRef = useRef<HTMLInputElement>(null);
  const khqrInputRef = useRef<HTMLInputElement>(null);

  // Music
  const [youtubeInput, setYoutubeInput] = useState(card.music_url || "");
  const [isScanningYoutube, setIsScanningYoutube] = useState(false);
  const [scannedSong, setScannedSong] = useState<YouTubeResolveResponse | null>(null);
  const [curatedSongs, setCuratedSongs] = useState<CuratedSong[]>(DEFAULT_CURATED_SONGS);

  const L = (km: string, en: string) => (lang === "km" ? km : en);
  const patch = useCallback((p: Partial<WeddingCard>) => setCard((prev) => ({ ...prev, ...p })), []);

  const isDirty = useMemo(() => JSON.stringify(card) !== savedSnapshot, [card, savedSnapshot]);
  const activeTemplate = getTemplateById(card.theme);

  const parsedAgenda = useMemo(() => parseJson<WeddingAgendaItem[]>(card.morning_agenda, []), [card.morning_agenda]);
  const parsedEvening = useMemo(() => parseJson<WeddingReception>(card.evening_reception, DEFAULT_EVENING), [card.evening_reception]);
  const galleryList = useMemo(() => parseJson<string[]>(card.gallery_images, []), [card.gallery_images]);

  const notify = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    fetchCuratedSongs().then(setCuratedSongs).catch(() => {});
  }, []);

  // The site header is sticky too (and shrinks on scroll): pin the editor bar right below it
  useEffect(() => {
    const siteHeader = document.querySelector("header");
    const root = rootRef.current;
    if (!siteHeader || !root || root.contains(siteHeader)) return;
    const sync = () => root.style.setProperty("--we-top", `${siteHeader.getBoundingClientRect().height}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(siteHeader);
    return () => ro.disconnect();
  }, []);

  /* ─── Live preview iframe ─── */
  const postToFrame = useCallback((msg: object) => {
    frameRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if ((e.data as { type?: string })?.type === "wedding-preview:ready") setFrameReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const previewVisible = viewMode !== "editor";
  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    // Hiding the preview unmounts the frame; it says "ready" again when it comes back
    if (mode === "editor") setFrameReady(false);
  };

  useEffect(() => {
    if (frameReady) postToFrame({ type: "wedding-preview:card", card });
  }, [card, frameReady, postToFrame]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStageSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewVisible]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  /* ─── Template ─── */
  const handleSelectTemplate = (tpl: WeddingTemplateDefinition, e?: React.MouseEvent) => {
    if (tpl.id === activeTemplate.id && card.theme === tpl.id) return;
    setCard((prev) => {
      // Swap the cover only while it is still one of the stock template photos
      const coverIsStock = !prev.cover_image_url || WEDDING_TEMPLATES.some((t) => t.defaultCoverImage === prev.cover_image_url);
      return { ...prev, theme: tpl.id, cover_image_url: coverIsStock ? tpl.defaultCoverImage : prev.cover_image_url };
    });
    setThemeSwap((n) => n + 1);
    postToFrame({ type: "wedding-preview:top" });
    notify("success", L(`បានប្តូរទៅ «${tpl.nameKm}»`, `Switched to “${tpl.nameEn}”`));
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 28,
        scalar: 0.8,
        origin: e ? { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight } : { y: 0.6 },
        colors: [tpl.accentColor, ...tpl.palette.slice(1, 3), "#ffffff"]
      });
    } catch {}
  };

  /* ─── Photos ─── */
  const handleUploadMultipleGallery = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files).filter((f) => f.type.startsWith("image/")) : [];
    if (list.length === 0) return;
    setUploading(true);
    setUploadProgress({ current: 1, total: list.length });
    try {
      const urls = await uploadWeddingImages(list, token, (cur, tot) => setUploadProgress({ current: cur, total: tot }));
      if (urls.length > 0) {
        setCard((prev) => {
          const current = parseJson<string[]>(prev.gallery_images, []);
          return { ...prev, gallery_images: JSON.stringify([...current, ...urls]), cover_image_url: prev.cover_image_url || urls[0] };
        });
        notify("success", L(`បានបន្ថែម ${urls.length} រូប`, `Added ${urls.length} photo(s)`));
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
      notify("error", L("បរាជ័យក្នុងការផ្ទុករូបភាព សូមព្យាយាមម្តងទៀត", "Upload failed, please try again"));
    } finally {
      setUploading(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = "";
    }
  };

  const handleUploadSingleField = async (
    field: "cover_image_url" | "groom_image_url" | "bride_image_url" | "khqr_image_url",
    file: File
  ) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const urls = await uploadWeddingImages([file], token);
      if (urls[0]) {
        patch({ [field]: urls[0] });
        notify("success", L("បានផ្ទុករូបភាព", "Photo updated"));
      }
    } catch (err) {
      console.error(`Upload error for ${field}:`, err);
      notify("error", L("បរាជ័យក្នុងការផ្ទុករូបភាព", "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const setGallery = (next: string[]) => patch({ gallery_images: JSON.stringify(next) });

  const handleAddGalleryUrl = () => {
    const url = newGalleryUrl.trim();
    if (!url) return;
    if (!isSafeUrl(url)) {
      notify("error", L("Link មិនត្រឹមត្រូវ (ត្រូវចាប់ផ្តើមដោយ https://)", "Invalid link (must start with https://)"));
      return;
    }
    setCard((prev) => ({
      ...prev,
      gallery_images: JSON.stringify([...parseJson<string[]>(prev.gallery_images, []), url]),
      cover_image_url: prev.cover_image_url || url,
    }));
    setNewGalleryUrl("");
  };

  const handleMoveGalleryImage = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= galleryList.length) return;
    const next = [...galleryList];
    [next[index], next[target]] = [next[target], next[index]];
    setGallery(next);
  };

  /* ─── Save ─── */
  const validate = (): string | null => {
    const urlFields: [string | undefined, string][] = [
      [card.cover_image_url, "Cover"],
      [card.groom_image_url, L("រូបកូនប្រុស", "Groom photo")],
      [card.bride_image_url, L("រូបកូនស្រី", "Bride photo")],
      [card.khqr_image_url, "KHQR"],
      [card.music_url, L("បទភ្លេង", "Music")],
      [parsedEvening.map_url, "Google Maps"],
      ...galleryList.map((u, i): [string, string] => [u, `Gallery #${i + 1}`]),
    ];
    const bad = urlFields.find(([u]) => !isSafeUrl(u));
    if (bad) return L(`Link មិនត្រឹមត្រូវ៖ ${bad[1]}`, `Invalid link: ${bad[1]}`);
    if (!card.slug || card.slug.length < 3) return L("Slug ត្រូវមានយ៉ាងហោចណាស់ ៣ តួអក្សរ", "Slug must be at least 3 characters");
    return null;
  };

  const handleSave = async () => {
    if (saving) return;
    const problem = validate();
    if (problem) {
      notify("error", problem);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyWeddingCard(token, card);
      setCard(updated);
      setSavedSnapshot(JSON.stringify(updated));
      notify("success", L("បានរក្សាទុកជោគជ័យ!", "Saved successfully!"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg || L("បរាជ័យក្នុងការរក្សាទុក", "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  // Ctrl/Cmd + S saves
  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    if (isDirty && !window.confirm(L("អ្នកមានការកែប្រែមិនទាន់រក្សាទុក។ ចាកចេញដែរឬទេ?", "You have unsaved changes. Log out anyway?"))) return;
    onLogout();
  };

  /* ─── Schedule & venue ─── */
  const setAgenda = (next: WeddingAgendaItem[]) => patch({ morning_agenda: JSON.stringify(next) });
  const handleAgendaChange = (index: number, field: keyof WeddingAgendaItem, val: string) => {
    const next = [...parsedAgenda];
    next[index] = { ...next[index], [field]: val };
    setAgenda(next);
  };
  const handleEveningChange = (field: keyof WeddingReception, val: string) =>
    patch({ evening_reception: JSON.stringify({ ...parsedEvening, [field]: val }) });

  const invitationUrl = typeof window !== "undefined" ? `${window.location.origin}/wedding/${card.slug}` : `/wedding/${card.slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      notify("error", L("មិនអាចចម្លងបាន", "Could not copy"));
    }
  };

  /* ─── Music ─── */
  const handleScanYoutube = async () => {
    if (!youtubeInput.trim()) return;
    setIsScanningYoutube(true);
    try {
      const result = await resolveYouTubeAudio(youtubeInput.trim());
      setScannedSong(result);
      if (result.valid && result.music_url) patch({ music_url: result.music_url });
      else notify("error", L("រកមិនឃើញបទចម្រៀងនេះទេ", "Couldn't find that song"));
    } catch (e) {
      console.error(e);
      notify("error", L("ស្កេនមិនបានសម្រេច", "Scan failed"));
    } finally {
      setIsScanningYoutube(false);
    }
  };

  const handleSelectCuratedSong = (song: CuratedSong) => {
    patch({ music_url: song.youtube_url });
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

  /* ─── Completion meter ─── */
  const completion = useMemo(() => {
    const checks = [
      !!card.groom_name, !!card.bride_name, !!card.groom_parents, !!card.bride_parents,
      !!card.solar_date, !!card.cover_image_url, galleryList.length >= 5, parsedAgenda.length > 0,
      !!parsedEvening.venue, !!card.music_url, !!card.khqr_account_number, !!card.theme,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [card, galleryList.length, parsedAgenda.length, parsedEvening.venue]);

  const TABS: { id: TabId; km: string; en: string; icon: React.ElementType }[] = [
    { id: "templates", km: "គំរូរចនា", en: "Templates", icon: Palette },
    { id: "details", km: "កូនកំលោះ & ក្រមុំ", en: "Couple", icon: Heart },
    { id: "photos", km: "រូបថត & Gallery", en: "Photos", icon: ImageIcon },
    { id: "schedule", km: "កាលវិភាគ", en: "Schedule", icon: Clock },
    { id: "venue", km: "ទីកន្លែង", en: "Venue", icon: MapPin },
    { id: "music", km: "បទភ្លេង", en: "Music", icon: Music },
    { id: "gift", km: "ចងដៃ KHQR", en: "Gift KHQR", icon: QrCode },
    { id: "settings", km: "ការកំណត់", en: "Settings", icon: Settings },
  ];

  const VIEWS: { id: ViewMode; km: string; en: string; icon: React.ElementType }[] = [
    { id: "editor", km: "កែសម្រួល", en: "Edit", icon: Edit3 },
    { id: "split", km: "ទន្ទឹមគ្នា", en: "Split", icon: Columns2 },
    { id: "preview", km: "មើលគំរូ", en: "Preview", icon: Eye },
  ];
  const viewIndex = VIEWS.findIndex((v) => v.id === viewMode);

  const showEditor = viewMode !== "preview";
  const showPreview = viewMode !== "editor";

  const photoSlot = (
    field: "cover_image_url" | "groom_image_url" | "bride_image_url",
    label: string,
    ref: React.RefObject<HTMLInputElement | null>
  ) => (
    <div className="group relative">
      <input
        type="file"
        ref={ref}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUploadSingleField(field, e.target.files[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="relative block w-full aspect-[3/4] rounded-t-[999px] rounded-b-3xl overflow-hidden bg-stone-100 dark:bg-white/5 ring-1 ring-stone-200 dark:ring-white/10 shadow-[0_18px_40px_-24px_rgba(60,40,10,0.55)] cursor-pointer disabled:cursor-wait"
      >
        {card[field] ? (
          <img src={card[field]} alt={label} loading="lazy" decoding="async" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
            <Camera className="w-6 h-6" />
            {L("បន្ថែមរូប", "Add photo")}
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-4">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-stone-900 text-[11px] font-bold shadow-lg translate-y-2 group-hover:translate-y-0 transition duration-300">
            <Camera className="w-3.5 h-3.5" />
            {L("ប្តូររូប", "Replace")}
          </span>
        </span>
      </button>
      <p className="mt-2.5 text-center text-[12px] font-semibold text-stone-700 dark:text-stone-300">{label}</p>
    </div>
  );

  return (
    <div ref={rootRef} className="we-root min-h-screen text-stone-900 dark:text-stone-100">
      {/* ═══════════════════════ TOP BAR ═══════════════════════ */}
      <header className="sticky top-[var(--we-top,0px)] z-40 we-glass border-b border-stone-200/70 dark:border-white/10">
        <div className="max-w-[1680px] mx-auto px-3 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-[#2b2116] to-[#0f0c08] flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(120,80,20,0.7)] ring-1 ring-amber-400/30">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-[15px] font-bold leading-tight truncate tracking-tight">
                {card.groom_name || "—"} <span className="we-gold-text">&</span> {card.bride_name || "—"}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <span className="font-mono truncate">/wedding/{card.slug}</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-px rounded-full font-semibold ${card.is_published ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-stone-500/10 text-stone-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${card.is_published ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                  {card.is_published ? L("កំពុងផ្សាយ", "Live") : L("ព្រាង", "Draft")}
                </span>
              </div>
            </div>
          </div>

          {/* View switcher with sliding indicator */}
          <div className="relative grid grid-cols-3 p-1 rounded-2xl bg-stone-900/[0.05] dark:bg-white/[0.06] ring-1 ring-inset ring-stone-900/5 dark:ring-white/10">
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-white dark:bg-stone-800 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.3)] transition-transform duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]"
              style={{ transform: `translateX(${viewIndex * 100}%)` }}
            />
            {VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => changeView(v.id)}
                  aria-pressed={viewMode === v.id}
                  className={`relative z-10 flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3.5 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer ${viewMode === v.id ? "text-stone-900 dark:text-white" : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline whitespace-nowrap">{L(v.km, v.en)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "km" ? "en" : "km")}
              className="we-icon-btn h-9 px-2.5 text-[12px] font-bold"
              title="Language"
            >
              {lang === "km" ? "EN" : "ខ្មែរ"}
            </button>
            <button type="button" onClick={handleCopyLink} className="we-icon-btn hidden md:flex w-9 h-9" title={L("ចម្លង Link", "Copy link")}>
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => setShowShareModal(true)} className="we-icon-btn w-9 h-9" title={L("ចែករំលែក & QR", "Share & QR")}>
              <QrCode className="w-4 h-4" />
            </button>
            <a href={`/wedding/${card.slug}`} target="_blank" rel="noopener noreferrer" className="we-icon-btn hidden md:flex w-9 h-9" title={L("បើកមើលផ្ទាល់", "Open live card")}>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="we-primary relative h-9 pl-3 pr-4 rounded-xl text-[12.5px] font-bold flex items-center gap-2 cursor-pointer disabled:cursor-default"
              title="Ctrl + S"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isDirty ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {saving ? L("កំពុងរក្សាទុក...", "Saving...") : isDirty ? L("រក្សាទុក", "Save") : L("បានរក្សាទុក", "Saved")}
              </span>
              {isDirty && !saving && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-900 animate-pulse" />}
            </button>
            <button type="button" onClick={handleLogout} className="we-icon-btn w-9 h-9 hover:!text-rose-600" title={L("ចាកចេញ", "Log out")}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ WORKSPACE ═══════════════════════ */}
      <div
        className={`max-w-[1680px] mx-auto px-3 sm:px-6 py-5 sm:py-7 grid gap-6 ${
          viewMode === "split"
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] xl:grid-cols-[210px_minmax(0,1fr)_minmax(380px,440px)]"
            : viewMode === "editor"
              ? "xl:grid-cols-[210px_minmax(0,1fr)]"
              : "grid-cols-1"
        }`}
      >
        {/* ─── Section navigation ─── */}
        {showEditor && (
          <nav aria-label={L("ផ្នែកកែសម្រួល", "Editor sections")} className="min-w-0 lg:col-span-full xl:col-span-1 xl:sticky xl:top-[calc(var(--we-top,0px)+88px)] xl:self-start">
            <div className="flex xl:flex-col gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 xl:mx-0 xl:px-0 pb-1 xl:pb-0">
              {TABS.map((tab, i) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={active ? "page" : undefined}
                    className={`we-nav-item group relative flex items-center gap-3 shrink-0 h-11 pl-3 pr-4 rounded-2xl text-[13px] font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-[#1c1610] text-amber-50 shadow-[0_12px_28px_-14px_rgba(60,40,10,0.9)] dark:bg-amber-500/15 dark:text-amber-200"
                        : "text-stone-600 dark:text-stone-400 hover:bg-white/80 dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${active ? "text-amber-300" : ""}`} />
                    <span>{L(tab.km, tab.en)}</span>
                    <span className={`hidden xl:inline ml-auto text-[10px] font-mono ${active ? "text-amber-200/60" : "text-stone-300 dark:text-stone-600"}`}>
                      0{i + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Completion meter */}
            <div className="hidden xl:block mt-5 p-4 rounded-2xl we-panel">
              <div className="flex items-center justify-between text-[12px] font-semibold">
                <span>{L("ភាពពេញលេញ", "Completion")}</span>
                <span className="we-gold-text font-bold">{completion}%</span>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-stone-200/80 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-700 transition-[width] duration-700" style={{ width: `${completion}%` }} />
              </div>
              <p className="mt-2.5 text-[11px] text-stone-500 leading-relaxed">
                {completion < 100 ? L("បំពេញព័ត៌មានបន្ថែម ដើម្បីធៀបការដ៏ល្អឥតខ្ចោះ", "Fill in more details for a flawless invitation") : L("ធៀបការរួចរាល់ហើយ!", "Your invitation is complete!")}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{L("រក្សាទុកដោយសុវត្ថិភាព", "Secure, encrypted save")} · Ctrl+S</span>
              </div>
            </div>
          </nav>
        )}

        {/* ─── Editor panel ─── */}
        {showEditor && (
          <main key={activeTab} className={`we-rise min-w-0 ${viewMode === "editor" ? "max-w-4xl w-full" : ""}`}>
            {/* TEMPLATES */}
            {activeTab === "templates" && (
              <Panel
                icon={Palette}
                title={L("ជ្រើសរើសគំរូរចនាធៀបការ", "Choose your invitation design")}
                subtitle={L("ចុចលើគំរូណាមួយ ដើម្បីប្តូរភ្លាមៗ — មើលការផ្លាស់ប្តូរនៅលើទូរស័ព្ទខាងស្តាំ", "Tap any design to apply it instantly — watch it transform in the live preview")}
                action={
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/25 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" /> {WEDDING_TEMPLATES.length} {L("គំរូ", "designs")}
                  </span>
                }
              >
                {/* Active template spotlight */}
                <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/5" style={{ ["--tpl" as string]: activeTemplate.accentColor }}>
                  <img key={activeTemplate.id} src={activeTemplate.thumbnailUrl} alt="" className="we-kenburns absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
                  <div className="relative p-5 sm:p-6 flex items-end justify-between gap-4 min-h-[150px]">
                    <div className="text-white min-w-0" key={activeTemplate.id + "-t"}>
                      <span className="we-rise inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10.5px] font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3" /> {L("កំពុងប្រើ", "Active design")}
                      </span>
                      <h3 className="we-rise mt-2.5 text-xl sm:text-2xl font-bold tracking-tight">{L(activeTemplate.nameKm, activeTemplate.nameEn)}</h3>
                      <p className="we-rise text-[12.5px] text-white/75 mt-1 max-w-md">{L(activeTemplate.taglineKm, activeTemplate.taglineEn)}</p>
                    </div>
                    <div className="flex -space-x-1.5 shrink-0">
                      {activeTemplate.palette.map((c) => (
                        <span key={c} className="w-7 h-7 rounded-full ring-2 ring-white/80 shadow-md" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
                  {WEDDING_TEMPLATES.map((tpl, i) => {
                    const isSelected = activeTemplate.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={(e) => handleSelectTemplate(tpl, e)}
                        aria-pressed={isSelected}
                        data-active={isSelected}
                        className="we-tpl group relative text-left rounded-3xl p-2 cursor-pointer"
                        style={{ ["--tpl" as string]: tpl.accentColor, animationDelay: `${i * 40}ms` }}
                      >
                        <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-stone-200 dark:bg-stone-800">
                          <img
                            src={tpl.thumbnailUrl}
                            alt={tpl.nameEn}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition duration-[900ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 mix-blend-soft-light"
                            style={{ background: `radial-gradient(circle at 30% 20%, ${tpl.accentColor}, transparent 70%)` }}
                          />

                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[10.5px] font-semibold ring-1 ring-white/15">
                            <WeddingFlowerIcon type={tpl.flowerType} className="w-3.5 h-3.5 text-amber-200" />
                            {tpl.badgeTextKm}
                          </span>
                          {tpl.isPopular && (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold shadow-md">
                              <Star className="w-3 h-3 fill-current" /> {L("ពេញនិយម", "Popular")}
                            </span>
                          )}

                          <div className="absolute bottom-2.5 left-2.5 flex -space-x-1">
                            {tpl.palette.map((c) => (
                              <span key={c} className="w-4 h-4 rounded-full ring-[1.5px] ring-white/90" style={{ backgroundColor: c }} />
                            ))}
                          </div>

                          {/* Apply pill */}
                          <span
                            className={`absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg transition-all duration-300 ${
                              isSelected
                                ? "bg-white text-stone-900"
                                : "bg-white/95 text-stone-900 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
                            }`}
                          >
                            {isSelected ? <><Check className="w-3.5 h-3.5" style={{ color: tpl.accentColor }} />{L("កំពុងប្រើ", "Active")}</> : <>{L("ប្រើគំរូនេះ", "Use design")}<ArrowRight className="w-3 h-3" /></>}
                          </span>
                        </div>

                        <div className="px-2 pt-3 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tpl.accentColor, boxShadow: `0 0 0 3px color-mix(in oklab, ${tpl.accentColor} 20%, transparent)` }} />
                            <h4 className="font-bold text-[13.5px] text-stone-900 dark:text-white truncate">{L(tpl.nameKm, tpl.nameEn)}</h4>
                          </div>
                          <p className="mt-1 text-[11.5px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">{L(tpl.taglineKm, tpl.taglineEn)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* DETAILS */}
            {activeTab === "details" && (
              <Panel icon={Heart} title={L("ព័ត៌មានកូនកំលោះ និងកូនក្រមុំ", "The couple")} subtitle={L("ឈ្មោះ តួនាទី និងមាតាបិតា ដែលនឹងបង្ហាញលើធៀបការ", "Names, titles and parents shown on the invitation")}>
                <div className="grid md:grid-cols-2 gap-4">
                  {([
                    { side: "groom", km: "ខាងកូនប្រុស", en: "Groom", tone: "from-amber-500/10" },
                    { side: "bride", km: "ខាងកូនស្រី", en: "Bride", tone: "from-rose-500/10" },
                  ] as const).map(({ side, km, en, tone }) => (
                    <div key={side} className={`p-5 rounded-3xl bg-gradient-to-br ${tone} to-transparent ring-1 ring-stone-200/80 dark:ring-white/10 space-y-4`}>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${side === "groom" ? "bg-amber-600" : "bg-rose-500"}`} />
                        {L(km, en)}
                      </span>
                      <Field label={L("ឈ្មោះ", "Full name")}>
                        <input className={inputCls} value={card[`${side}_name`]} onChange={(e) => patch({ [`${side}_name`]: e.target.value })} />
                      </Field>
                      <Field label={L("តួនាទី", "Title")} hint={L("ឧ. កូនច្បង, កូនពៅ", "e.g. eldest son, youngest daughter")}>
                        <input className={inputCls} value={card[`${side}_title`]} onChange={(e) => patch({ [`${side}_title`]: e.target.value })} />
                      </Field>
                      <Field label={L("ឈ្មោះមាតាបិតា", "Parents")}>
                        <input className={inputCls} value={card[`${side}_parents`]} onChange={(e) => patch({ [`${side}_parents`]: e.target.value })} />
                      </Field>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <Field label={L("ថ្ងៃខែឆ្នាំតាមចន្ទគតិខ្មែរ", "Khmer lunar date")}>
                      <input className={inputCls} value={card.khmer_date} onChange={(e) => patch({ khmer_date: e.target.value })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label={L("កាលបរិច្ឆេទ", "Wedding date")}>
                      <input type="date" className={inputCls} value={card.solar_date} onChange={(e) => patch({ solar_date: e.target.value })} />
                    </Field>
                  </div>
                  <Field label={L("ម៉ោងពិសាភោជនាហារ", "Reception time")}>
                    <input className={inputCls} value={card.solar_time} onChange={(e) => patch({ solar_time: e.target.value })} />
                  </Field>
                </div>
              </Panel>
            )}

            {/* PHOTOS */}
            {activeTab === "photos" && (
              <Panel
                icon={ImageIcon}
                title={L("រូបថត & Love Story Gallery", "Photos & love-story gallery")}
                subtitle={L("រូបភាពត្រូវបានបង្រួមដោយស្វ័យប្រវត្តិ ដើម្បីល្បឿនលឿន", "Images are compressed automatically for fast loading")}
                action={
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-900/5 dark:bg-white/10 whitespace-nowrap">
                    {galleryList.length} {L("រូប", "photos")}
                  </span>
                }
              >
                <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto">
                  {photoSlot("cover_image_url", L("រូបក្រប", "Cover"), coverInputRef)}
                  {photoSlot("groom_image_url", L("កូនកំលោះ", "Groom"), groomInputRef)}
                  {photoSlot("bride_image_url", L("កូនក្រមុំ", "Bride"), brideInputRef)}
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !uploading && multiFileInputRef.current?.click()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && multiFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUploadMultipleGallery(e.dataTransfer.files); }}
                  className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer group ${
                    dragOver ? "border-amber-500 bg-amber-500/10 scale-[1.01]" : "border-stone-300 dark:border-white/15 hover:border-amber-400 hover:bg-amber-500/[0.04]"
                  }`}
                >
                  <input type="file" ref={multiFileInputRef} multiple accept="image/*" className="hidden" onChange={(e) => handleUploadMultipleGallery(e.target.files)} />
                  <span className="mx-auto w-14 h-14 rounded-2xl we-icon-chip flex items-center justify-center transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                  </span>
                  <h5 className="mt-3 font-bold text-[14px]">
                    {uploading
                      ? L(`កំពុងផ្ទុក... (${uploadProgress.current}/${uploadProgress.total})`, `Uploading... (${uploadProgress.current}/${uploadProgress.total})`)
                      : L("អូសរូបមកទីនេះ ឬចុចដើម្បីជ្រើសរើស", "Drop photos here or click to browse")}
                  </h5>
                  <p className="text-[12px] text-stone-500 mt-1">JPG · PNG · WebP — {L("ច្រើនរូបក្នុងពេលតែមួយ", "select many at once")}</p>
                  {uploading && (
                    <div className="w-56 mx-auto mt-4 h-1.5 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-700 transition-all duration-300" style={{ width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%` }} />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className={inputCls}
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddGalleryUrl()}
                    placeholder={L("ឬបិទភ្ជាប់ Link រូបភាព https://...", "Or paste an image link https://...")}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddGalleryUrl} className="we-dark-btn h-11 px-4 rounded-xl text-[12.5px] font-bold whitespace-nowrap cursor-pointer">
                      <Plus className="w-4 h-4 inline -mt-0.5" /> {L("បន្ថែម", "Add")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setGallery(STUDIO_PRESETS); if (!card.cover_image_url) patch({ cover_image_url: STUDIO_PRESETS[0] }); }}
                      className="we-icon-btn h-11 px-4 rounded-xl text-[12.5px] font-semibold whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" /> {L("រូបគំរូ", "Sample set")}
                    </button>
                  </div>
                </div>

                {galleryList.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl bg-stone-900/[0.03] dark:bg-white/[0.03] text-[13px] text-stone-500">
                    {L("មិនទាន់មានរូបថតនៅឡើយទេ", "No photos yet — your gallery will appear here")}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {galleryList.map((url, idx) => {
                      const isCover = card.cover_image_url === url;
                      return (
                        <figure key={url + idx} className="we-rise group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800 ring-1 ring-black/5" style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}>
                          <img src={url} alt={`Photo ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur text-[10px] font-mono text-white font-bold">#{idx + 1}</span>
                          {isCover && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold">Cover</span>}

                          <figcaption className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition duration-300 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <button type="button" disabled={idx === 0} onClick={() => handleMoveGalleryImage(idx, "left")} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer" title={L("រំកិលទៅមុខ", "Move left")}>
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" disabled={idx === galleryList.length - 1} onClick={() => handleMoveGalleryImage(idx, "right")} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer" title={L("រំកិលទៅក្រោយ", "Move right")}>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button type="button" onClick={() => setGallery(galleryList.filter((_, i) => i !== idx))} className="w-7 h-7 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer" title={L("លុប", "Remove")}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                              <button type="button" onClick={() => patch({ cover_image_url: url })} className="py-1 rounded-md bg-amber-400 text-amber-950 hover:bg-amber-300 cursor-pointer">Cover</button>
                              <button type="button" onClick={() => patch({ groom_image_url: url })} className="py-1 rounded-md bg-white/90 text-stone-900 hover:bg-white cursor-pointer">{L("កំលោះ", "Groom")}</button>
                              <button type="button" onClick={() => patch({ bride_image_url: url })} className="py-1 rounded-md bg-white/90 text-stone-900 hover:bg-white cursor-pointer">{L("ក្រមុំ", "Bride")}</button>
                            </div>
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                )}
              </Panel>
            )}

            {/* SCHEDULE */}
            {activeTab === "schedule" && (
              <Panel
                icon={Clock}
                title={L("កាលវិភាគពិធីពេលព្រឹក", "Morning ceremony programme")}
                subtitle={L("រៀបចំលំដាប់ពិធីតាមប្រពៃណីខ្មែរ", "Order each traditional rite of the day")}
                action={
                  <button
                    type="button"
                    onClick={() => setAgenda([...parsedAgenda, { time: "08:00 ព្រឹក", title: L("កម្មវិធីថ្មី", "New item"), description: "" }])}
                    className="we-primary h-9 px-3.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> {L("បន្ថែម", "Add")}
                  </button>
                }
              >
                <ol className="relative space-y-3 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-amber-400 before:to-amber-200/0">
                  {parsedAgenda.map((item, idx) => (
                    <li key={idx} className="we-rise relative pl-12" style={{ animationDelay: `${idx * 40}ms` }}>
                      <span className="absolute left-2 top-4 w-[23px] h-[23px] rounded-full bg-white dark:bg-stone-900 ring-2 ring-amber-500 flex items-center justify-center text-[10px] font-bold text-amber-700">
                        {idx + 1}
                      </span>
                      <div className="p-4 rounded-2xl ring-1 ring-stone-200/80 dark:ring-white/10 bg-white/70 dark:bg-white/[0.03] space-y-2.5 hover:ring-amber-400/50 transition">
                        <div className="flex gap-2">
                          <input className={`${inputCls} !w-36 font-semibold`} value={item.time} onChange={(e) => handleAgendaChange(idx, "time", e.target.value)} placeholder="07:00 ព្រឹក" />
                          <input className={`${inputCls} font-bold`} value={item.title} onChange={(e) => handleAgendaChange(idx, "title", e.target.value)} placeholder={L("ពិធីហែជំនូន", "Ceremony title")} />
                          <button type="button" onClick={() => setAgenda(parsedAgenda.filter((_, i) => i !== idx))} className="shrink-0 w-11 h-11 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-500/10 flex items-center justify-center transition cursor-pointer" title={L("លុប", "Remove")}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea rows={2} className={textareaCls} value={item.description} onChange={(e) => handleAgendaChange(idx, "description", e.target.value)} placeholder={L("ការពិពណ៌នា...", "Description...")} />
                      </div>
                    </li>
                  ))}
                  {parsedAgenda.length === 0 && (
                    <li className="p-8 text-center text-[13px] text-stone-500">{L("មិនទាន់មានកម្មវិធី", "No programme items yet")}</li>
                  )}
                </ol>
              </Panel>
            )}

            {/* VENUE */}
            {activeTab === "venue" && (
              <Panel icon={MapPin} title={L("ទីកន្លែងពិធីពិសាភោជនាហារ", "Reception venue")} subtitle={L("ភ្ញៀវអាចបើកផែនទីដោយចុចតែម្តង", "Guests open directions with one tap")}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label={L("ឈ្មោះទីកន្លែង / សណ្ឋាគារ", "Venue name")}>
                      <input className={inputCls} value={parsedEvening.venue} onChange={(e) => handleEveningChange("venue", e.target.value)} />
                    </Field>
                  </div>
                  <Field label={L("សាល ឬ អាគារ", "Hall / building")}>
                    <input className={inputCls} value={parsedEvening.hall || ""} onChange={(e) => handleEveningChange("hall", e.target.value)} placeholder={L("ឧ. អាគារ A", "e.g. Hall A")} />
                  </Field>
                  <Field label={L("ម៉ោង", "Time")}>
                    <input className={inputCls} value={parsedEvening.time || ""} onChange={(e) => handleEveningChange("time", e.target.value)} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={L("អាសយដ្ឋាន", "Address")}>
                      <textarea rows={2} className={textareaCls} value={parsedEvening.address} onChange={(e) => handleEveningChange("address", e.target.value)} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Google Maps URL" error={!isSafeUrl(parsedEvening.map_url) ? L("ត្រូវចាប់ផ្តើមដោយ https://", "Must start with https://") : undefined}>
                      <input className={`${inputCls} font-mono`} value={parsedEvening.map_url} onChange={(e) => handleEveningChange("map_url", e.target.value)} placeholder="https://maps.google.com/?q=..." />
                    </Field>
                  </div>
                </div>
                {isSafeUrl(parsedEvening.map_url) && parsedEvening.map_url && (
                  <a href={parsedEvening.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                    <MapPin className="w-4 h-4" /> {L("សាកល្បងបើកផែនទី", "Test the map link")} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </Panel>
            )}

            {/* MUSIC */}
            {activeTab === "music" && (
              <Panel icon={Music} title={L("បទភ្លេងការ", "Wedding music")} subtitle={L("ស្កេនបទពី YouTube ឬជ្រើសរើសភ្លេងការបុរាណខ្មែរ", "Scan a YouTube song or pick a classic Khmer wedding tune")}>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      className={`${inputCls} pl-10 font-mono`}
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScanYoutube()}
                      placeholder="https://youtu.be/..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleScanYoutube}
                    disabled={isScanningYoutube || !youtubeInput.trim()}
                    className="we-primary h-11 px-5 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isScanningYoutube ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                    {isScanningYoutube ? L("កំពុងស្កេន...", "Scanning...") : L("ស្កេនបទ", "Scan song")}
                  </button>
                </div>

                {scannedSong && scannedSong.valid && (
                  <div className="we-rise relative overflow-hidden rounded-3xl bg-[#1c1610] text-white p-4 flex gap-4 items-center">
                    {scannedSong.thumbnail_url && (
                      <img src={scannedSong.thumbnail_url} alt="" className="w-24 h-16 rounded-xl object-cover ring-1 ring-white/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <span className="flex items-end gap-0.5 h-3">
                          <span className="we-eq w-0.5 bg-amber-300" /><span className="we-eq w-0.5 bg-amber-300 [animation-delay:.2s]" /><span className="we-eq w-0.5 bg-amber-300 [animation-delay:.4s]" />
                        </span>
                        {card.music_url === scannedSong.music_url ? L("បានភ្ជាប់ក្នុងធៀបការ", "Linked to card") : L("បទដែលបានស្កេន", "Scanned song")}
                      </span>
                      <h4 className="text-[14px] font-bold truncate mt-1">{scannedSong.title}</h4>
                      <p className="text-[11.5px] text-white/60 truncate">{scannedSong.author_name}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-stone-500 flex items-center gap-1.5 mb-3">
                    <Headphones className="w-3.5 h-3.5" /> {L("ភ្លេងការបុរាណខ្មែរ", "Curated classics")}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {curatedSongs.map((song) => {
                      const isSelected = !!card.music_url?.includes(song.video_id);
                      return (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => handleSelectCuratedSong(song)}
                          className={`group flex items-center gap-3 p-2.5 pr-3 rounded-2xl text-left transition-all duration-300 cursor-pointer ring-1 ${
                            isSelected ? "ring-amber-500 bg-amber-500/10 shadow-[0_10px_30px_-18px_rgba(180,120,20,0.9)]" : "ring-stone-200/80 dark:ring-white/10 hover:ring-amber-400/60 hover:-translate-y-0.5"
                          }`}
                        >
                          <span className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0">
                            <img src={song.thumbnail_url} alt="" loading="lazy" className={`w-full h-full object-cover ${isSelected ? "animate-spin-slow rounded-full" : ""}`} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[10.5px] text-amber-700 dark:text-amber-400 font-semibold truncate">{song.category}</span>
                            <span className="block text-[12.5px] font-bold truncate">{L(song.title_km, song.title_en)}</span>
                          </span>
                          {isSelected ? <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" /> : <Plus className="w-4 h-4 text-stone-400 group-hover:text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field label={L("ឬបញ្ចូល URL Audio / MP3 ផ្ទាល់", "Or a direct MP3 link")} error={!isSafeUrl(card.music_url) ? L("Link មិនត្រឹមត្រូវ", "Invalid link") : undefined}>
                  <input
                    className={`${inputCls} font-mono`}
                    value={card.music_url || ""}
                    onChange={(e) => { patch({ music_url: e.target.value }); setYoutubeInput(e.target.value); }}
                    placeholder="https://.../wedding-audio.mp3"
                  />
                </Field>
              </Panel>
            )}

            {/* GIFT */}
            {activeTab === "gift" && (
              <Panel icon={QrCode} title={L("ចំណងដៃតាមអេឡិចត្រូនិក", "Digital gift (KHQR)")} subtitle={L("ABA / Bakong KHQR សម្រាប់ភ្ញៀវចងដៃពីចម្ងាយ", "ABA / Bakong KHQR so guests can send a gift from anywhere")}>
                <div className="grid sm:grid-cols-[1fr_200px] gap-6 items-start">
                  <div className="space-y-4">
                    <Field label={L("ឈ្មោះម្ចាស់គណនី", "Account name")}>
                      <input className={`${inputCls} font-mono uppercase`} value={card.khqr_account_name || ""} onChange={(e) => patch({ khqr_account_name: e.target.value })} placeholder="CHEA VISAL & SOK SOVANNARY" />
                    </Field>
                    <Field label={L("លេខគណនី", "Account number")}>
                      <input className={`${inputCls} font-mono`} value={card.khqr_account_number || ""} onChange={(e) => patch({ khqr_account_number: e.target.value })} placeholder="000 123 456 (ABA Bank)" />
                    </Field>
                    <Field label={L("Link រូប QR", "QR image link")} error={!isSafeUrl(card.khqr_image_url) ? L("Link មិនត្រឹមត្រូវ", "Invalid link") : undefined}>
                      <input className={`${inputCls} font-mono`} value={card.khqr_image_url || ""} onChange={(e) => patch({ khqr_image_url: e.target.value })} placeholder="https://..." />
                    </Field>
                  </div>
                  <div className="text-center">
                    <input type="file" ref={khqrInputRef} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUploadSingleField("khqr_image_url", e.target.files[0]); e.target.value = ""; }} />
                    <button
                      type="button"
                      onClick={() => khqrInputRef.current?.click()}
                      className="group relative w-full aspect-square rounded-3xl overflow-hidden bg-white ring-1 ring-stone-200 dark:ring-white/10 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)] cursor-pointer"
                    >
                      {card.khqr_image_url ? (
                        <img src={card.khqr_image_url} alt="KHQR" className="w-full h-full object-contain p-3" />
                      ) : (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400 text-[12px]">
                          <QrCode className="w-8 h-8" /> {L("ផ្ទុក QR", "Upload QR")}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[12px] font-bold gap-1.5">
                        <UploadCloud className="w-4 h-4" /> {L("ផ្ទុករូប", "Upload")}
                      </span>
                    </button>
                  </div>
                </div>
              </Panel>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <Panel icon={Settings} title={L("ការកំណត់ & តំណភ្ជាប់", "Settings & link")} subtitle={L("គ្រប់គ្រងការផ្សព្វផ្សាយ និងមុខងារសម្រាប់ភ្ញៀវ", "Control publishing and guest features")}>
                <Field label={L("តំណភ្ជាប់ផ្ទាល់ខ្លួន", "Custom link")} hint={L("អក្សរតូច លេខ - និង _ ប៉ុណ្ណោះ", "Lowercase letters, numbers, - and _ only")}>
                  <div className="flex items-stretch rounded-xl overflow-hidden ring-1 ring-stone-200 dark:ring-white/10 focus-within:ring-2 focus-within:ring-amber-500 transition">
                    <span className="px-3.5 flex items-center bg-stone-100 dark:bg-white/5 text-stone-500 text-[12.5px] font-mono">/wedding/</span>
                    <input
                      className="flex-1 h-11 px-3 bg-white dark:bg-transparent text-[13px] font-mono outline-none"
                      value={card.slug}
                      maxLength={60}
                      onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                    />
                    <button type="button" onClick={handleCopyLink} className="px-3.5 bg-stone-100 dark:bg-white/5 hover:bg-amber-500/15 transition cursor-pointer" title={L("ចម្លង", "Copy")}>
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <div className="space-y-2.5">
                  <Toggle checked={card.is_published} onChange={(v) => patch({ is_published: v })} title={L("ផ្សព្វផ្សាយជាសាធារណៈ", "Publish invitation")} desc={L("ភ្ញៀវអាចបើកមើលតាម Link", "Anyone with the link can view it")} />
                  <Toggle checked={card.enable_rsvp} onChange={(v) => patch({ enable_rsvp: v })} title={L("ឆ្លើយតបការចូលរួម (RSVP)", "Guest RSVP")} desc={L("ភ្ញៀវបញ្ជាក់ការចូលរួម និងចំនួនមនុស្ស", "Guests confirm attendance and party size")} />
                  <Toggle checked={card.enable_wishes} onChange={(v) => patch({ enable_wishes: v })} title={L("សៀវភៅពាក្យជូនពរ", "Guestbook wishes")} desc={L("ភ្ញៀវផ្ញើពាក្យជូនពរដល់គូស្វាមីភរិយា", "Guests leave blessings for the couple")} />
                </div>
              </Panel>
            )}
          </main>
        )}

        {/* ─── Live preview ─── */}
        {showPreview && (
          <aside className={`min-w-0 ${viewMode === "split" ? "lg:sticky lg:top-[calc(var(--we-top,0px)+88px)] lg:self-start" : ""}`}>
            <div className="flex items-center justify-between gap-3 mb-3 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: activeTemplate.accentColor }} />
                  <span className="relative inline-flex w-2 h-2 rounded-full" style={{ backgroundColor: activeTemplate.accentColor }} />
                </span>
                <span className="text-[12px] font-bold truncate">
                  {L("មើលផ្ទាល់", "Live")} · <span className="text-stone-500 font-semibold">{L(activeTemplate.nameKm, activeTemplate.nameEn)}</span>
                </span>
              </div>
              <div className="flex p-0.5 rounded-xl bg-stone-900/[0.05] dark:bg-white/[0.06]">
                {([["mobile", Smartphone], ["desktop", Monitor]] as const).map(([d, Icon]) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    aria-pressed={device === d}
                    className={`w-8 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${device === d ? "bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white" : "text-stone-400 hover:text-stone-700"}`}
                    title={d}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`mx-auto transition-[max-width] duration-700 [transition-timing-function:cubic-bezier(.22,1,.36,1)] ${
                device === "mobile" ? "max-w-[400px]" : viewMode === "preview" ? "max-w-[1180px]" : "max-w-full"
              }`}
            >
              <div className={device === "mobile" ? "we-phone p-[10px] rounded-[48px]" : "we-browser rounded-2xl overflow-hidden"}>
                {device === "desktop" && (
                  <div className="h-9 px-3 flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-white/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-3 flex-1 h-6 rounded-md bg-white dark:bg-stone-900 text-[10.5px] text-stone-500 font-mono flex items-center px-2.5 truncate">
                      <ShieldCheck className="w-3 h-3 mr-1.5 text-emerald-600 shrink-0" />{invitationUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                )}
                {/* The card renders inside an iframe so it lays out at a real
                    device width and its fixed layers (petals, corner buttons,
                    modals) stay inside the device instead of covering the editor */}
                <div
                  ref={stageRef}
                  className={`relative overflow-hidden bg-[#f4eee3] ${device === "mobile" ? "rounded-[38px]" : ""}`}
                  style={{ height: viewMode === "preview" ? "calc(100vh - 150px)" : "min(calc(100vh - 150px), 820px)" }}
                >
                  {device === "mobile" && (
                    <span aria-hidden="true" className="absolute top-2 left-1/2 -translate-x-1/2 z-[60] w-24 h-6 rounded-full bg-black pointer-events-none" />
                  )}
                  <iframe
                    ref={frameRef}
                    src="/wedding/preview-frame"
                    title={L("មើលធៀបការផ្ទាល់", "Live invitation preview")}
                    className={`absolute top-0 left-0 border-0 bg-[#f4eee3] origin-top-left transition-opacity duration-500 ${frameReady ? "opacity-100" : "opacity-0"}`}
                    style={
                      device === "desktop" && stageSize.w > 0
                        ? { width: DESKTOP_WIDTH, height: stageSize.h / (stageSize.w / DESKTOP_WIDTH), transform: `scale(${stageSize.w / DESKTOP_WIDTH})` }
                        : { width: "100%", height: "100%" }
                    }
                  />
                  {!frameReady && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    </span>
                  )}
                  {themeSwap > 0 && (
                    <span
                      key={themeSwap}
                      aria-hidden="true"
                      className="we-theme-wipe absolute inset-0 z-[70] pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 30%, ${activeTemplate.palette[1] || "#fff"} 0%, ${activeTemplate.accentColor} 70%)` }}
                    />
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((tst) => (
          <div
            key={tst.id}
            className={`we-toast pointer-events-auto flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl text-[12.5px] font-semibold shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] ring-1 backdrop-blur-xl ${
              tst.kind === "error" ? "bg-rose-600/95 text-white ring-rose-400/40" : "bg-[#1c1610]/95 text-amber-50 ring-amber-400/25"
            }`}
          >
            {tst.kind === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-amber-300" />}
            {tst.text}
          </div>
        ))}
      </div>

      <WeddingShareModal card={card} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
}
