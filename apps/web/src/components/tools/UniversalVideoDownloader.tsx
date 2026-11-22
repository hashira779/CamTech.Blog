"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Link as LinkIcon,
  Video,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ClipboardPaste,
  X,
  Play,
  Sparkles,
  ShieldCheck,
  Film,
  Volume2,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  Radio,
  FileCheck2,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

/* ── Standard Vector Brand SVGs (Official Pixel-Perfect Logos) ────────────── */

export function TikTokBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function YouTubeBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <polygon points="9.545,15.568 15.818,12 9.545,8.432" fill="#FFFFFF" />
    </svg>
  );
}

export function FacebookBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M16.5 12.05h-2.85v8.95h-3.7V12.05H8.25V8.95h1.7V6.7c0-2.35 1.4-3.7 3.55-3.7 1.05 0 2.15.2 2.15.2v2.4h-1.2c-1.15 0-1.5.75-1.5 1.5v1.85h2.7z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function InstagramBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="igIconGradV2" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#igIconGradV2)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.3" stroke="url(#igIconGradV2)" strokeWidth="2.2" />
      <circle cx="17.6" cy="6.4" r="1.3" fill="url(#igIconGradV2)" />
    </svg>
  );
}

export function XTwitterBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function DouyinBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#161823" />
      <path
        d="M17.4 8.2a5.4 5.4 0 0 1-2.9-2.3v8.5a4.1 4.1 0 1 1-4.1-4.1c.25 0 .55.04.8.08v2.6a1.6 1.6 0 1 0 .8 1.42V4h2.6a5.5 5.5 0 0 0 2.8 4.2z"
        fill="#FE2C55"
      />
    </svg>
  );
}

interface VideoFormat {
  label: string;
  resolution: string;
  format: string;
  size: string;
  url: string;
  has_audio?: boolean;
}

interface AudioFormat {
  label: string;
  format: string;
  size: string;
  url: string;
}

interface MediaResult {
  platform: string;
  title: string;
  uploader: string;
  thumbnail?: string;
  duration?: string;
  preview_url?: string;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
}

interface PlatformItem {
  id: string;
  name: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  note: string;
  sampleUrl: string;
  accentColor: string;
}

const SUPPORTED_PLATFORMS: PlatformItem[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokBrandIcon,
    note: "No Watermark HD",
    sampleUrl: "https://www.tiktok.com/@scout2015/video/6718335390845095173",
    accentColor: "border-neutral-400/40 text-foreground",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: YouTubeBrandIcon,
    note: "1080p / 720p / MP3",
    sampleUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    accentColor: "border-red-500/40 text-red-600 dark:text-red-400",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FacebookBrandIcon,
    note: "Reels & Video",
    sampleUrl: "https://www.facebook.com/watch/?v=10153231379946729",
    accentColor: "border-blue-500/40 text-blue-600 dark:text-blue-400",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: InstagramBrandIcon,
    note: "Reels & Stories",
    sampleUrl: "https://www.instagram.com/reels/C_something",
    accentColor: "border-pink-500/40 text-pink-600 dark:text-pink-400",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: XTwitterBrandIcon,
    note: "HD MP4",
    sampleUrl: "https://twitter.com/NASA/status/1750580979872583808",
    accentColor: "border-neutral-400/40 text-foreground",
  },
  {
    id: "douyin",
    name: "Douyin",
    icon: DouyinBrandIcon,
    note: "抖音 No Watermark",
    sampleUrl: "https://www.douyin.com/video/7106594312292453675",
    accentColor: "border-rose-500/40 text-rose-600 dark:text-rose-400",
  },
];

function getPlatformBrandIcon(platform?: string) {
  const p = (platform || "").toLowerCase();
  if (p.includes("tiktok")) return <TikTokBrandIcon className="h-4 w-4" />;
  if (p.includes("youtube")) return <YouTubeBrandIcon className="h-4 w-4" />;
  if (p.includes("facebook")) return <FacebookBrandIcon className="h-4 w-4" />;
  if (p.includes("instagram")) return <InstagramBrandIcon className="h-4 w-4" />;
  if (p.includes("twitter") || p === "x") return <XTwitterBrandIcon className="h-4 w-4" />;
  if (p.includes("douyin")) return <DouyinBrandIcon className="h-4 w-4" />;
  return <Film className="h-4 w-4" />;
}

export function UniversalVideoDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activePlatformId, setActivePlatformId] = useState<string | null>(null);

  // Dynamic progress steps animation during loading
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const timer1 = setTimeout(() => setLoadingStep(1), 700);
    const timer2 = setTimeout(() => setLoadingStep(2), 1800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const handlePaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setError(null);
        }
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

  const handleExtract = async (targetUrl?: string) => {
    const finalUrl = (targetUrl || url).trim();
    if (!finalUrl) {
      setError("Please paste a media link from TikTok, YouTube, Facebook, or Instagram.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowPreview(false);

    try {
      const endpoint = `${API_BASE}/tools/execute`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_slug: "universal-video-downloader",
          action: "extract",
          parameters: { url: finalUrl },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.result) {
        setError(data.error || "Could not extract video. Ensure the video is public and try again.");
      } else if (data.result.error) {
        setError(data.result.error);
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Network error while connecting to media extraction engine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDownloadStreamUrl = (streamUrl: string, filename: string, format: string) => {
    const safeTitle = (result?.title || "media").slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeFilename = `${safeTitle}_${filename}`;
    return `${API_BASE}/tools/download-stream?url=${encodeURIComponent(streamUrl)}&filename=${encodeURIComponent(safeFilename)}&format=${encodeURIComponent(format)}`;
  };

  const handleCopy = (link: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-2">
      {/* ── Studio Hero Container (Human-Crafted Glassmorphic Card) ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-surface via-surface/95 to-surface-muted/40 p-6 shadow-md backdrop-blur-xl sm:p-8">
        {/* Subtle decorative glow orb */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Eyebrow Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
              </span>
              <span>2026-2028 Next-Gen Media Engine</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              ⚡ Ultra-Fast · Zero Watermark · Original Sound
            </span>
          </div>

          {/* Headline & Description */}
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Universal Video &amp; Audio Downloader
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              ទាញយកវីដេអូ និងតន្ត្រីកម្រិត Full HD (1080p, 720p, 480p) និង MP3 ដោយគ្មានជាប់ Watermark ពីគ្រប់បណ្តាញសង្គម។ មិនចាំបាច់មានគណនី ឬដំឡើង App បន្ថែមឡើយ។
            </p>
          </div>

          {/* ── Interactive Platform Chips ── */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Supported Platforms (Click to try sample):
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {SUPPORTED_PLATFORMS.map((p) => {
                const BrandIcon = p.icon;
                const isActive = activePlatformId === p.id;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setActivePlatformId(p.id);
                      setUrl(p.sampleUrl);
                      handleExtract(p.sampleUrl);
                    }}
                    className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent shadow-xs"
                        : "border-border/80 bg-surface/90 text-foreground hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated hover:shadow-xs"
                    }`}
                  >
                    <BrandIcon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span>{p.name}</span>
                    <span className="rounded-md bg-surface-muted/90 px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {p.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── The Search Console (Hero Input) ── */}
          <div className="space-y-3 pt-2">
            <div className="group relative flex items-center rounded-2xl border-2 border-border/80 bg-background/80 shadow-xs transition-all duration-200 focus-within:border-accent focus-within:shadow-md focus-within:ring-4 focus-within:ring-accent/15">
              <div className="pointer-events-none pl-4 text-muted-foreground transition-colors group-focus-within:text-accent">
                <LinkIcon size={20} />
              </div>
              <input
                id="video-url-input"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleExtract();
                }}
                placeholder="Paste TikTok, YouTube, Facebook, or Instagram link here..."
                className="w-full bg-transparent py-4 pl-3.5 pr-28 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-base"
              />

              {/* Console Action Buttons inside input */}
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {url ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUrl("");
                      setResult(null);
                      setError(null);
                      setActivePlatformId(null);
                    }}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground active:scale-90"
                    aria-label="Clear input"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:border-accent/40 hover:bg-surface-muted hover:text-accent active:scale-95"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste size={14} />
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Bar: Action Trigger & Shortcuts */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap size={14} className="text-amber-500" />
                <span>Supports 4K/1080p Video, Shorts &amp; MP3 tracks</span>
              </div>

              <button
                type="button"
                onClick={() => handleExtract()}
                disabled={loading || !url.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent via-accent to-amber-600 px-6 py-3 text-sm font-bold text-accent-foreground shadow-md transition-all duration-200 hover:brightness-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Processing Media...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={17} className="animate-pulse" />
                    <span>Download Media</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lively Animated Extraction Indicator ── */}
      {loading && (
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface/90 p-6 shadow-md backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            {/* Animated Equalizer Waves */}
            <div className="flex items-end gap-1.5 h-10">
              <span className="w-1.5 bg-accent rounded-full animate-bounce h-6"></span>
              <span className="w-1.5 bg-accent/80 rounded-full animate-bounce [animation-delay:0.15s] h-10"></span>
              <span className="w-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.3s] h-8"></span>
              <span className="w-1.5 bg-accent/80 rounded-full animate-bounce [animation-delay:0.45s] h-5"></span>
              <span className="w-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.6s] h-9"></span>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-foreground">
                Analyzing Media Stream...
              </h4>
              <p className="text-xs text-muted-foreground">
                {loadingStep === 0 && "Connecting to content distribution network..."}
                {loadingStep === 1 && "Removing watermarks & extracting multi-resolution video tracks..."}
                {loadingStep >= 2 && "Synthesizing lossless audio formats & finalizing..."}
              </p>
            </div>

            {/* Shimmering Progress Bar */}
            <div className="w-full max-w-md overflow-hidden rounded-full bg-surface-muted h-1.5">
              <div className="h-full bg-gradient-to-r from-accent to-amber-500 w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-xs animate-in fade-in duration-200">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">Extraction Notice</p>
            <p className="text-xs leading-relaxed opacity-95">{error}</p>
          </div>
        </div>
      )}

      {/* ── Extracted Result Studio (Cinema Grade Output) ── */}
      {result && (
        <div className="space-y-6 rounded-3xl border border-border/80 bg-surface p-6 shadow-md backdrop-blur-xl animate-in fade-in zoom-in-95 duration-400 sm:p-7">
          {/* Header Media Overview */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {result.thumbnail && (
              <div className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-black shadow-xs sm:w-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Duration Badge */}
                {result.duration && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/85 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                    {result.duration}
                  </span>
                )}

                {/* Platform Badge */}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-lg bg-black/85 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
                  {getPlatformBrandIcon(result.platform)}
                  <span>{result.platform}</span>
                </span>

                {/* Interactive Play Preview Button */}
                {result.preview_url && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-90 transition-opacity hover:opacity-100"
                    aria-label="Toggle preview"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/90 text-white shadow-lg backdrop-blur-xs transition-transform duration-200 hover:scale-110 active:scale-95">
                      <Play size={20} className="ml-0.5 fill-current" />
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Media Metadata */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                  <CheckCircle2 size={13} />
                  Ready to download
                </span>
                <h3 className="text-base font-bold leading-snug text-foreground sm:text-xl">
                  {result.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  By {result.uploader || "Creator"}
                </span>
                {result.duration && (
                  <>
                    <span>·</span>
                    <span>Duration: {result.duration}</span>
                  </>
                )}
                {result.preview_url && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                  >
                    {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{showPreview ? "Hide Preview Player" : "Show Preview Player"}</span>
                  </button>
                )}
              </div>

              {/* Embedded Player Preview (Accordion) */}
              {showPreview && result.preview_url && (
                <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-inner animate-in fade-in duration-300">
                  <video
                    controls
                    autoPlay
                    src={result.preview_url}
                    poster={result.thumbnail}
                    className="max-h-72 w-full object-contain"
                  >
                    Your browser does not support HTML5 video preview.
                  </video>
                </div>
              )}
            </div>
          </div>

          {/* ── Segmented Control Pill Switcher (Video vs Audio) ── */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-2xl border border-border bg-surface-muted/70 p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("video")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    activeTab === "video"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Film size={15} className={activeTab === "video" ? "text-accent" : ""} />
                  <span>Video Downloads ({result.video_formats.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("audio")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    activeTab === "audio"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Music size={15} className={activeTab === "audio" ? "text-amber-500" : ""} />
                  <span>Audio MP3 ({result.audio_formats.length})</span>
                </button>
              </div>

              <span className="hidden text-xs text-muted-foreground sm:inline-block">
                Select your preferred resolution
              </span>
            </div>

            {/* ── Video Downloads Tab ── */}
            {activeTab === "video" && (
              <div className="mt-4 space-y-2.5">
                {result.video_formats.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    No direct video streams found. Check the audio tab or try another link.
                  </p>
                ) : (
                  result.video_formats.map((v, idx) => {
                    const downloadUrl = getDownloadStreamUrl(v.url, `${v.resolution}.mp4`, "mp4");
                    const isHD = v.resolution.includes("1080") || v.resolution.includes("2160") || v.resolution.includes("1440");
                    const is720 = v.resolution.includes("720");
                    const copyId = `video-${idx}`;

                    return (
                      <div
                        key={idx}
                        className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface/70 p-4 transition-all duration-200 hover:border-accent/40 hover:bg-surface-elevated hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* Format Tag & Details */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold shadow-2xs ${
                              isHD
                                ? "border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : is720
                                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border border-border bg-surface-muted text-muted-foreground"
                            }`}
                          >
                            {v.resolution || "MP4"}
                          </span>

                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground">
                              {v.label}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                                {v.format}
                              </span>
                              {v.size && <span>· {v.size}</span>}
                              {v.has_audio && (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <Volume2 size={13} />
                                  <span>Audio Track Included</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Download & Copy Buttons */}
                        <div className="flex items-center gap-2 pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(downloadUrl, copyId)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-muted hover:text-accent active:scale-95"
                            title="Copy Direct Download Link"
                          >
                            {copiedLink === copyId ? (
                              <>
                                <Check size={14} className="text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={downloadUrl}
                            download={`${result.title || "video"}_${v.resolution}.mp4`}
                            className="group/btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs transition-all duration-200 hover:brightness-105 hover:shadow-sm active:scale-95 sm:flex-initial"
                          >
                            <Download size={14} className="transition-transform duration-200 group-hover/btn:translate-y-0.5" />
                            <span>Download MP4</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Audio Downloads Tab ── */}
            {activeTab === "audio" && (
              <div className="mt-4 space-y-2.5">
                {result.audio_formats.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    No extracted audio stream available for this video.
                  </p>
                ) : (
                  result.audio_formats.map((a, idx) => {
                    const downloadUrl = getDownloadStreamUrl(a.url, `audio_${idx}.mp3`, "mp3");
                    const copyId = `audio-${idx}`;

                    return (
                      <div
                        key={idx}
                        className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface/70 p-4 transition-all duration-200 hover:border-amber-500/40 hover:bg-surface-elevated hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/10 font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            MP3
                          </span>

                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground">
                              {a.label}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                                {a.format}
                              </span>
                              {a.size && <span>· {a.size}</span>}
                              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                                <Radio size={13} className="animate-pulse" />
                                <span>High Bitrate Master</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(downloadUrl, copyId)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-muted hover:text-accent active:scale-95"
                            title="Copy Audio Download Link"
                          >
                            {copiedLink === copyId ? (
                              <>
                                <Check size={14} className="text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={downloadUrl}
                            download={`${result.title || "audio"}.mp3`}
                            className="group/btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-amber-600 px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs transition-all duration-200 hover:brightness-105 hover:shadow-sm active:scale-95 sm:flex-initial"
                          >
                            <Download size={14} className="transition-transform duration-200 group-hover/btn:translate-y-0.5" />
                            <span>Download MP3</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Human-Crafted Value Props & Privacy Guarantees ── */}
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/60 p-4 transition-all hover:border-border hover:bg-surface">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-foreground">100% Private &amp; Direct</h5>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              គ្មានការផ្ទុកទិន្នន័យវីដេអូនៅលើ Server ឡើយ។ ដំណើរការដោយផ្ទាល់តាមរយៈ Secure Streaming Tunnel។
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/60 p-4 transition-all hover:border-border hover:bg-surface">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-foreground">No Watermark High-Def</h5>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              បំបាត់ Logo Watermark លើ TikTok និង Douyin ដោយរក្សាកម្រិតច្បាស់ 1080p Full HD និង 60fps។
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/60 p-4 transition-all hover:border-border hover:bg-surface">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <FileCheck2 size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-foreground">All Devices &amp; Browsers</h5>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              ដំណើរការយ៉ាងរលូនលើ iPhone/iPad Safari, Android Chrome, Mac និង Windows ដោយគ្មានបញ្ហា។
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
