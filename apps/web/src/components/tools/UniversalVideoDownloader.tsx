"use client";

import React, { useState } from "react";
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
  Layers,
  Volume2,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

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

/* ── Standard Vector Brand SVGs (Pixel-Perfect Official Logos) ────────────── */

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
        <radialGradient id="igIconGrad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#igIconGrad)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.3" stroke="url(#igIconGrad)" strokeWidth="2.2" />
      <circle cx="17.6" cy="6.4" r="1.3" fill="url(#igIconGrad)" />
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

interface PlatformItem {
  name: string;
  badge: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  note: string;
  chipClass: string;
}

const SUPPORTED_PLATFORMS: PlatformItem[] = [
  {
    name: "TikTok",
    badge: "TikTok",
    icon: TikTokBrandIcon,
    note: "No Watermark HD",
    chipClass: "hover:border-neutral-400 dark:hover:border-neutral-500",
  },
  {
    name: "YouTube",
    badge: "YouTube",
    icon: YouTubeBrandIcon,
    note: "1080p / 720p / MP3",
    chipClass: "hover:border-red-500/50 hover:bg-red-500/5",
  },
  {
    name: "Facebook",
    badge: "Facebook",
    icon: FacebookBrandIcon,
    note: "Reels & Video",
    chipClass: "hover:border-blue-500/50 hover:bg-blue-500/5",
  },
  {
    name: "Instagram",
    badge: "Instagram",
    icon: InstagramBrandIcon,
    note: "Reels & Stories",
    chipClass: "hover:border-pink-500/50 hover:bg-pink-500/5",
  },
  {
    name: "Twitter / X",
    badge: "X (Twitter)",
    icon: XTwitterBrandIcon,
    note: "HD MP4",
    chipClass: "hover:border-neutral-400 dark:hover:border-neutral-500",
  },
  {
    name: "Douyin",
    badge: "抖音",
    icon: DouyinBrandIcon,
    note: "No Watermark",
    chipClass: "hover:border-rose-500/50 hover:bg-rose-500/5",
  },
];

function getPlatformBrandIcon(platform?: string) {
  const p = (platform || "").toLowerCase();
  if (p.includes("tiktok")) return <TikTokBrandIcon className="h-3.5 w-3.5" />;
  if (p.includes("youtube")) return <YouTubeBrandIcon className="h-3.5 w-3.5" />;
  if (p.includes("facebook")) return <FacebookBrandIcon className="h-3.5 w-3.5" />;
  if (p.includes("instagram")) return <InstagramBrandIcon className="h-3.5 w-3.5" />;
  if (p.includes("twitter") || p === "x") return <XTwitterBrandIcon className="h-3.5 w-3.5" />;
  if (p.includes("douyin")) return <DouyinBrandIcon className="h-3.5 w-3.5" />;
  return <Film className="h-3.5 w-3.5" />;
}

export function UniversalVideoDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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
      setError("Please paste a video link from TikTok, YouTube, Facebook, or Instagram.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

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
    } catch (err) {
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

  const handleCopy = (link: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Platform Badges (Official Vector SVGs) ──────────────── */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {SUPPORTED_PLATFORMS.map((p) => {
            const BrandIcon = p.icon;
            return (
              <div
                key={p.name}
                className={`inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:shadow-sm ${p.chipClass}`}
              >
                <BrandIcon className="h-4 w-4 shrink-0" />
                <span>{p.name}</span>
                <span className="rounded-full bg-surface-muted/90 px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                  {p.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Input Bar ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label htmlFor="video-url-input" className="block text-sm font-medium text-foreground">
          Paste Video URL / បិទភ្ជាប់តំណភ្ជាប់វីដេអូ
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 text-muted-foreground">
            <LinkIcon size={18} />
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
            className="w-full rounded-xl border border-border bg-background py-3.5 pl-11 pr-24 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-base"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {url ? (
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setResult(null);
                  setError(null);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                aria-label="Clear input"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-elevated hover:text-accent"
                title="Paste from clipboard"
              >
                <ClipboardPaste size={14} />
                <span>Paste</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Button & Sample Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => {
                const sample = "https://www.tiktok.com/@scout2015/video/6718335390845095173";
                setUrl(sample);
                handleExtract(sample);
              }}
              className="text-accent underline underline-offset-2 transition-colors hover:text-foreground"
            >
              TikTok No-Watermark
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                const sample = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
                setUrl(sample);
                handleExtract(sample);
              }}
              className="text-accent underline underline-offset-2 transition-colors hover:text-foreground"
            >
              YouTube HD
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleExtract()}
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-xs transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Extracting Media...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analyze &amp; Extract</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Extraction Failed</p>
            <p className="text-xs leading-relaxed opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* ── Extracted Result Card ─────────────────────────────────── */}
      {result && (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs animate-fade-in">
          {/* Header Info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {result.thumbnail && (
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted sm:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="h-full w-full object-cover"
                />
                {result.duration && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
                    {result.duration}
                  </span>
                )}
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1.5 rounded-md bg-black/85 px-2 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
                  {getPlatformBrandIcon(result.platform)}
                  <span>{result.platform}</span>
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-base font-bold leading-snug text-foreground sm:text-lg">
                {result.title}
              </h3>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{result.uploader}</span>
                {result.duration && (
                  <>
                    <span>·</span>
                    <span>Duration: {result.duration}</span>
                  </>
                )}
              </p>

              {/* Embedded Player Preview */}
              {result.preview_url && (
                <div className="pt-2">
                  <video
                    controls
                    src={result.preview_url}
                    poster={result.thumbnail}
                    className="max-h-56 w-full rounded-xl border border-border bg-black object-contain shadow-xs"
                    preload="metadata"
                  >
                    Your browser does not support HTML5 video preview.
                  </video>
                </div>
              )}
            </div>
          </div>

          {/* Format Tabs: Video (MP4) vs Audio (MP3) */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "video"
                    ? "bg-accent text-accent-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Film size={15} />
                <span>Video Downloads ({result.video_formats.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "audio"
                    ? "bg-accent text-accent-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Music size={15} />
                <span>Audio MP3 ({result.audio_formats.length})</span>
              </button>
            </div>

            {/* Video List */}
            {activeTab === "video" && (
              <div className="mt-4 space-y-2.5">
                {result.video_formats.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No direct video streams found. Check the audio tab or try another link.
                  </p>
                ) : (
                  result.video_formats.map((v, idx) => {
                    const downloadUrl = getDownloadStreamUrl(v.url, `${v.resolution}.mp4`, "mp4");
                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted/50 p-3 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface font-mono text-xs font-bold text-accent">
                            {v.resolution || "MP4"}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{v.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.format} {v.size ? `· ${v.size}` : ""}{" "}
                              {v.has_audio && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  · <Volume2 size={12} className="inline" /> Audio
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 sm:pt-0">
                          <a
                            href={downloadUrl}
                            download={`${result.title || "video"}_${v.resolution}.mp4`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:flex-initial"
                          >
                            <Download size={14} />
                            <span>Download MP4</span>
                          </a>

                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                            title="Open direct stream in new tab"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Audio List */}
            {activeTab === "audio" && (
              <div className="mt-4 space-y-2.5">
                {result.audio_formats.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No separate audio stream extracted.
                  </p>
                ) : (
                  result.audio_formats.map((a, idx) => {
                    const downloadUrl = getDownloadStreamUrl(a.url, "audio.mp3", "mp3");
                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted/50 p-3 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface font-mono text-xs font-bold text-success">
                            MP3
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{a.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.format} {a.size ? `· ${a.size}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 sm:pt-0">
                          <a
                            href={downloadUrl}
                            download={`${result.title || "audio"}.mp3`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:flex-initial"
                          >
                            <Download size={14} />
                            <span>Download MP3</span>
                          </a>

                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                            title="Open direct audio stream"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 size={14} />
              Extraction completed with instant CDN links.
            </span>
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setResult(null);
              }}
              className="font-medium text-accent hover:underline"
            >
              Paste another video
            </button>
          </div>
        </div>
      )}

      {/* ── Privacy & Notice Footer ────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-surface-muted/40 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <ShieldCheck size={15} className="text-success" />
          High-Speed Private Extraction
        </p>
        <p className="mt-1 leading-relaxed">
          This tool streams directly from official CDNs without recording user history or storing files on public disks.
          Supports TikTok (No Watermark), YouTube HD resolutions up to 1080p, Facebook Watch/Reels, Instagram Stories,
          and high-bitrate MP3 music conversion.
        </p>
      </div>
    </div>
  );
}
