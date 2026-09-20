"use client";

import React, { useState, useRef } from "react";
import { Upload, Download, Image as ImageIcon, Sliders } from "lucide-react";

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
    <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl max-w-2xl mx-auto space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {!originalPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-12 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl text-center cursor-pointer hover:border-rose-500 hover:bg-neutral-50 dark:hover:bg-neutral-950/50 transition-all flex flex-col items-center justify-center gap-3 text-neutral-500"
        >
          <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <Upload className="h-7 w-7" />
          </div>
          <div>
            <span className="font-bold text-sm text-neutral-900 dark:text-white block">
              Click or Drag Image Here to Compress
            </span>
            <span className="text-xs text-neutral-400">
              Supports JPEG, PNG, and WebP (Privacy-first: runs entirely in your browser)
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-rose-600" />
                Compression Quality: {Math.round(quality * 100)}%
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-rose-600 hover:underline"
              >
                Choose another image
              </button>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Original Size
              </span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white block">
                {originalFile ? formatBytes(originalFile.size) : "0 KB"}
              </span>
              {originalPreview && (
                <img src={originalPreview} alt="Original" className="h-32 mx-auto object-contain rounded-lg" />
              )}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Compressed Size
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
                {compressedSize ? formatBytes(compressedSize) : "0 KB"}
              </span>
              {compressedPreview && (
                <img src={compressedPreview} alt="Compressed" className="h-32 mx-auto object-contain rounded-lg" />
              )}
            </div>
          </div>

          {compressedPreview && (
            <div className="text-center pt-2">
              <a
                href={compressedPreview}
                download={`compressed-${originalFile?.name || "image.jpg"}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Compressed JPEG
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
