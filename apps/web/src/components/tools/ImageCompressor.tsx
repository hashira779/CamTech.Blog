"use client";

import React, { useState, useRef } from "react";
import { Upload, Download, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Client-side JPEG recompression.
 *
 * The canvas pipeline, the accepted mime list and `formatBytes` are untouched.
 * What changed is how you reach it: the click-anywhere drop div is now a real,
 * keyboard-focusable button next to the file input it opens, and the two size
 * figures sit in one quiet panel instead of a rose tile and an emerald tile.
 */
export function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [quality, setQuality] = useState(0.7);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      const url = URL.createObjectURL(file);
      setOriginalPreview(url);
      compressImage(file, quality);
    }
  };

  const compressImage = (file: File, q: number) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Keep aspect ratio
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCompressedSize(blob.size);
              const compUrl = URL.createObjectURL(blob);
              setCompressedPreview(compUrl);
            }
          },
          "image/jpeg",
          q
        );
      };
    };
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (originalFile) {
      compressImage(originalFile, newQ);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <input
        id="image-source"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
      />

      {!originalPreview ? (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-surface-muted px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-category-tools">
            <Upload size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Choose an image to compress</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              JPEG, PNG and WebP. The picture stays in your browser — it is never uploaded.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Select image
          </Button>
          <label htmlFor="image-source" className="text-xs text-muted-foreground underline-offset-4">
            or pick a file with the system dialog
          </label>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="image-quality"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
                Quality
              </label>
              <span className="text-sm tabular-nums text-foreground">{Math.round(quality * 100)}%</span>
            </div>
            <input
              id="image-quality"
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-accent"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="-ml-2"
            >
              Choose another image
            </Button>
          </div>

          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            <div className="space-y-2 bg-surface-muted px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Original
              </dt>
              <dd className="text-lg font-semibold leading-none tabular-nums text-foreground">
                {originalFile ? formatBytes(originalFile.size) : "—"}
              </dd>
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="The image you selected, before compression"
                  className="mx-auto h-32 rounded-md object-contain"
                />
              )}
            </div>

            <div className="space-y-2 bg-surface-muted px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Compressed
              </dt>
              <dd className="text-lg font-semibold leading-none tabular-nums text-foreground">
                {compressedSize !== null ? formatBytes(compressedSize) : "—"}
              </dd>
              {compressedPreview && (
                <img
                  src={compressedPreview}
                  alt="The same image after compression"
                  className="mx-auto h-32 rounded-md object-contain"
                />
              )}
            </div>
          </dl>

          {compressedPreview && (
            <div className="flex justify-center border-t border-border pt-5">
              <Button variant="primary" size="md" asChild className="gap-2">
                <a
                  href={compressedPreview}
                  download={`compressed-${originalFile?.name || "image.jpg"}`}
                >
                  <Download size={15} aria-hidden="true" />
                  Download compressed JPEG
                </a>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
