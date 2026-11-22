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

const SUPPORTED_PLATFORMS = [
  { name: "TikTok", icon: "🎵", note: "No Watermark HD" },
  { name: "YouTube", icon: "▶️", note: "1080p / 720p / MP3" },
  { name: "Facebook", icon: "📘", note: "Reels & Video" },
  { name: "Instagram", icon: "📸", note: "Reels & Stories" },
  { name: "Twitter / X", icon: "🐦", note: "HD MP4" },
  { name: "Douyin", icon: "🇨🇳", note: "抖音 No Watermark" },
];

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
      {/* ── Platform Badges ────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {SUPPORTED_PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent/40"
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
              <span className="text-[11px] text-muted-foreground">({p.note})</span>
            </div>
          ))}
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
                <span className="absolute left-1.5 top-1.5 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {result.platform}
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
                              {v.format} {v.size ? `· ${v.size}` : ""} {v.has_audio ? "· 🔊 Audio included" : ""}
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
