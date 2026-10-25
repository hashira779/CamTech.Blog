"use client";

import React, { useRef, useState } from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { uploadWeddingImages } from "@/lib/wedding-api";
import { ORNAMENT_SLOT_INFO, type OrnamentSlot, type OrnamentSlotInfo, type WeddingOrnaments } from "@/lib/wedding-ornaments";

/* The couple's own kbach ornament images, one card per place in the
   wedding-hall scene. An upload or a removal is saved straight away (like
   the photos); a place without an image keeps the scene's own drawing. */

interface Props {
  ornaments: WeddingOrnaments;
  token: string;
  lang: "km" | "en";
  /** Saves the whole new set; resolves false if it couldn't be saved */
  onSave: (next: WeddingOrnaments) => Promise<boolean>;
  notify: (kind: "success" | "error" | "info", text: string) => void;
}

const ASPECT: Record<OrnamentSlotInfo["shape"], string> = { wide: "aspect-[16/9]", tall: "aspect-[3/4]", square: "aspect-square" };

/* Light checkerboard, so a transparent PNG shows that it is transparent */
const CHECKER = "bg-[conic-gradient(#e7e1d6_25%,#fbf8f2_0_50%,#e7e1d6_0_75%,#fbf8f2_0)] bg-[length:16px_16px] dark:bg-[conic-gradient(#2a2620_25%,#1d1a16_0_50%,#2a2620_0_75%,#1d1a16_0)]";

export function WeddingOrnamentsPanel({ ornaments, token, lang, onSave, notify }: Props) {
  const L = (km: string, en: string) => (lang === "km" ? km : en);
  const [busy, setBusy] = useState<OrnamentSlot | null>(null);
  const [dragging, setDragging] = useState<OrnamentSlot | null>(null);
  const inputs = useRef(new Map<OrnamentSlot, HTMLInputElement>());

  const upload = async (slot: OrnamentSlot, file: File | undefined) => {
    if (!file || busy) return;
    if (!file.type.startsWith("image/")) {
      notify("error", L("សូមជ្រើសរើសរូបភាព PNG", "Please choose a PNG image"));
      return;
    }
    setBusy(slot);
    try {
      const [url] = await uploadWeddingImages([file], token);
      if (url && (await onSave({ ...ornaments, [slot]: url }))) {
        notify("success", L("បានដាក់ក្បាច់ និងរក្សាទុក", "Ornament uploaded and saved"));
      }
    } catch (err) {
      notify("error", err instanceof Error ? err.message : L("បរាជ័យក្នុងការផ្ទុករូបភាព", "Upload failed"));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (slot: OrnamentSlot) => {
    if (busy) return;
    setBusy(slot);
    const next = { ...ornaments };
    delete next[slot];
    if (await onSave(next)) notify("success", L("បានត្រឡប់ទៅក្បាច់ដើម", "Back to the built-in drawing"));
    setBusy(null);
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {ORNAMENT_SLOT_INFO.map((info) => {
        const url = ornaments[info.slot];
        const working = busy === info.slot;
        return (
          <div
            key={info.slot}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(info.slot);
            }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(null);
              void upload(info.slot, e.dataTransfer.files[0]);
            }}
            className={`rounded-3xl border p-3.5 transition ${dragging === info.slot ? "border-amber-500 bg-amber-500/10" : "border-stone-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03]"}`}
          >
            <input
              type="file"
              accept="image/png,image/webp,image/gif,image/jpeg"
              className="hidden"
              ref={(el) => {
                if (el) inputs.current.set(info.slot, el);
                else inputs.current.delete(info.slot);
              }}
              onChange={(e) => {
                void upload(info.slot, e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputs.current.get(info.slot)?.click()}
              disabled={!!busy}
              className={`relative w-full ${ASPECT[info.shape]} max-h-48 rounded-2xl overflow-hidden ring-1 ring-stone-200 dark:ring-white/10 ${CHECKER} cursor-pointer disabled:cursor-wait`}
              aria-label={url ? L(`ប្តូរ ${info.km}`, `Replace ${info.en}`) : L(`ដាក់ ${info.km}`, `Upload ${info.en}`)}
            >
              {url ? (
                <img src={url} alt={info.en} className={`absolute inset-0 w-full h-full p-2 ${info.tiles ? "object-cover" : "object-contain"}`} />
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-stone-400 text-[11.5px] font-medium">
                  <UploadCloud className="w-6 h-6" />
                  {L("ក្បាច់ដើម · ដាក់ PNG របស់អ្នក", "Built-in drawing · add your PNG")}
                </span>
              )}
              {working && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                </span>
              )}
            </button>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-stone-900 dark:text-white leading-snug">
                  {L(info.km, info.en)}
                  {info.tiles && <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">{L("បន្តដដែលៗ", "repeats")}</span>}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-400">{L(info.hintKm, info.hintEn)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => inputs.current.get(info.slot)?.click()}
                  disabled={!!busy}
                  className="h-8 px-3 rounded-full text-[11.5px] font-bold bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {url ? L("ប្តូរ", "Replace") : L("ដាក់", "Upload")}
                </button>
                {url && (
                  <button
                    type="button"
                    onClick={() => void remove(info.slot)}
                    disabled={!!busy}
                    title={L("ដកចេញ ត្រឡប់ទៅក្បាច់ដើម", "Remove, back to the built-in drawing")}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
