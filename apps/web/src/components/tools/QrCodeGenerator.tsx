"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, QrCode as QrIcon, Check, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";

/**
 * Encodes text into a QR image on the device.
 *
 * `QRCode.toDataURL` runs with the same width and margin as before. The preview
 * sits on `bg-surface` rather than a hardcoded white: the generated PNG carries
 * its own light background, so the scannable contrast does not depend on a
 * palette class that would ignore the theme switch.
 */
export function QrCodeGenerator() {
  const { t } = useI18n();
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
    <div className="space-y-6">
      <FormField
        label="Text or web URL to encode"
        id="qr-input"
        helperText="Encoded in your browser; the text is never uploaded."
      >
        <Input
          id="qr-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="https://example.com or any text"
        />
      </FormField>

      <div
        aria-live="polite"
        className="flex flex-col items-center gap-5 rounded-lg bg-surface-muted p-6"
      >
        {qrUrl ? (
          <div className="rounded-md border border-border bg-surface p-4 shadow-xs">
            <img src={qrUrl} alt="QR code for the text entered above" className="h-52 w-52 object-contain" />
          </div>
        ) : (
          <div className="flex h-52 w-52 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-muted-foreground">
            <QrIcon size={28} aria-hidden="true" />
            <span className="text-xs">Enter text to generate a code</span>
          </div>
        )}

        {qrUrl && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download size={14} aria-hidden="true" />
              Download PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
              {copied ? <Check size={14} className="text-success" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? t("tool.copied") : "Copy URL"}
            </Button>
          </div>
        )}
      </div>

      {/* The canvas the download path assumes exists stays mounted but hidden. */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
