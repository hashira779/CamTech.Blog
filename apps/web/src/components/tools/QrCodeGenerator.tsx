"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, QrCode as QrIcon, Copy, Check } from "lucide-react";

export function QrCodeGenerator() {
  const [text, setText] = useState("https://dailydiscovery.com");
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text.trim()) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(text, { width: 300, margin: 2 })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [text]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "daily-discovery-qr.png";
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Text or Web URL to Encode
        </label>
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com or any text..."
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-medium focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
        {qrUrl ? (
          <div className="p-4 bg-white rounded-2xl shadow-md">
            <img src={qrUrl} alt="Generated QR Code" className="w-52 h-52 object-contain" />
          </div>
        ) : (
          <div className="w-52 h-52 flex flex-col items-center justify-center text-neutral-400 gap-2 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
            <QrIcon className="h-8 w-8" />
            <span className="text-xs">Enter text to generate QR</span>
          </div>
        )}

        {qrUrl && (
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
