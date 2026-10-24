"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, AlertCircle, CheckCircle2, Link2, Sparkles } from "lucide-react";
import { checkWeddingSlugs, SlugCheck } from "@/lib/wedding-api";
import { suggestSlugs } from "@/lib/khmer-romanize";

type Props = {
  token: string;
  slug: string;
  /** The link as last saved, so a cache answer of "yours" stays right after a save */
  savedSlug: string;
  groomName: string;
  brideName: string;
  solarDate?: string;
  onChange: (slug: string) => void;
  onCopy: () => void;
  copied: boolean;
  L: (km: string, en: string) => string;
};

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{2,59}$/;

/* The couple's own link: ideas made from their names, and a live answer on
   whether the one typed is free, so a taken link is caught before Save. */
export function WeddingLinkBox({ token, slug, savedSlug, groomName, brideName, solarDate, onChange, onCopy, copied, L }: Props) {
  const [checks, setChecks] = useState<{ owner: string; map: Record<string, SlugCheck> }>({ owner: savedSlug, map: {} });
  const [failed, setFailed] = useState(false);
  // Answers are about this card's saved link; start over once it changes
  const known = useMemo(() => (checks.owner === savedSlug ? checks.map : {}), [checks, savedSlug]);

  const ideas = useMemo(
    () => suggestSlugs(groomName, brideName, solarDate).filter((s) => s !== slug),
    [groomName, brideName, solarDate, slug]
  );

  useEffect(() => {
    const wanted = [slug, ...ideas].filter((s) => SLUG_RE.test(s) && !(s in known)).slice(0, 6);
    if (wanted.length === 0) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await checkWeddingSlugs(token, wanted);
        if (!live) return;
        setFailed(false);
        setChecks((prev) => ({
          owner: savedSlug,
          map: { ...(prev.owner === savedSlug ? prev.map : {}), ...Object.fromEntries(res.map((r) => [r.slug, r])) },
        }));
      } catch {
        if (live) setFailed(true);
      }
    }, 450);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [slug, ideas, known, token, savedSlug]);

  const current = known[slug];
  const tooShort = slug.length < 3;
  const status: { tone: "ok" | "bad" | "wait" | "idle"; text: string } = tooShort
    ? { tone: "bad", text: L("យ៉ាងហោចណាស់ ៣ តួអក្សរ", "At least 3 characters") }
    : !SLUG_RE.test(slug)
      ? { tone: "bad", text: L("ចាប់ផ្តើមដោយអក្សរ ឬលេខ", "Start with a letter or number") }
      : failed && !current
        ? { tone: "idle", text: L("មិនអាចពិនិត្យបានទេ — នឹងពិនិត្យពេលរក្សាទុក", "Couldn't check now — it is checked again on Save") }
        : !current
          ? { tone: "wait", text: L("កំពុងពិនិត្យ...", "Checking...") }
          : current.reason === "yours"
            ? { tone: "ok", text: L("នេះជា Link បច្ចុប្បន្នរបស់អ្នក", "This is your current link") }
            : current.reason === "free"
              ? { tone: "ok", text: L("ទំនេរ — ចុច «រក្សាទុក» ដើម្បីប្រើ", "Available — press Save to use it") }
              : current.reason === "taken"
                ? { tone: "bad", text: L("មានគូស្វាមីភរិយាផ្សេងប្រើរួចហើយ", "Another couple already has this link") }
                : current.reason === "reserved"
                  ? { tone: "bad", text: L("Link នេះមិនអាចប្រើបានទេ", "This link is reserved") }
                  : { tone: "bad", text: L("Link មិនត្រឹមត្រូវ", "This link isn't valid") };

  const changed = slug !== savedSlug;
  const host = typeof window !== "undefined" ? window.location.host : "camtech.cam";

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent ring-1 ring-stone-200/80 dark:ring-white/10 space-y-3.5">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-amber-700 dark:text-amber-300" />
        <span className="text-[12.5px] font-bold text-stone-800 dark:text-stone-100">{L("Link ធៀបការរបស់អ្នក", "Your invitation link")}</span>
      </div>

      <div
        className={`flex items-stretch rounded-xl overflow-hidden ring-1 transition focus-within:ring-2 ${
          status.tone === "bad" ? "ring-rose-400 focus-within:ring-rose-500" : "ring-stone-200 dark:ring-white/10 focus-within:ring-amber-500"
        }`}
      >
        <span className="hidden sm:flex px-3 items-center bg-stone-100 dark:bg-white/5 text-stone-500 text-[12px] font-mono whitespace-nowrap">{host}/wedding/</span>
        <span className="sm:hidden px-2.5 flex items-center bg-stone-100 dark:bg-white/5 text-stone-500 text-[12px] font-mono">/</span>
        <input
          className="flex-1 min-w-0 h-11 px-3 bg-white dark:bg-transparent text-[13px] font-mono outline-none"
          value={slug}
          maxLength={60}
          spellCheck={false}
          autoCapitalize="off"
          aria-label={L("Link ធៀបការ", "Invitation link")}
          aria-invalid={status.tone === "bad"}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, ""))}
        />
        <button type="button" onClick={onCopy} className="px-3.5 bg-stone-100 dark:bg-white/5 hover:bg-amber-500/15 transition cursor-pointer" title={L("ចម្លង", "Copy")}>
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <p
        aria-live="polite"
        className={`flex items-center gap-1.5 text-[11.5px] font-medium ${
          status.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : status.tone === "bad" ? "text-rose-600" : "text-stone-500"
        }`}
      >
        {status.tone === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : status.tone === "bad" ? <AlertCircle className="w-3.5 h-3.5" /> : status.tone === "wait" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {status.text}
      </p>

      {ideas.length > 0 && (
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500">
            <Sparkles className="w-3 h-3 text-amber-600" />
            {L("ណែនាំពីឈ្មោះរបស់អ្នក", "Ideas from your names")}
          </span>
          <div className="flex flex-wrap gap-2">
            {ideas.map((idea) => {
              const c = known[idea];
              const taken = c && !c.available;
              return (
                <button
                  key={idea}
                  type="button"
                  disabled={taken}
                  onClick={() => onChange(idea)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-mono ring-1 transition cursor-pointer disabled:cursor-not-allowed ${
                    taken
                      ? "ring-stone-200 dark:ring-white/10 text-stone-400 line-through"
                      : "ring-amber-500/30 bg-white/80 dark:bg-white/5 text-stone-800 dark:text-stone-100 hover:ring-amber-500 hover:bg-amber-500/10"
                  }`}
                  title={taken ? L("មានគេប្រើរួចហើយ", "Already taken") : L("ប្រើ Link នេះ", "Use this link")}
                >
                  {c?.available ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : !c ? <span className="w-1.5 h-1.5 rounded-full bg-stone-300" /> : null}
                  {idea}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-stone-500 leading-relaxed">
        {changed
          ? L("ចុច «រក្សាទុក» ដើម្បីប្តូរ។ Link ចាស់នឹងលែងដំណើរការ — សូមប្តូរមុនពេលផ្ញើទៅភ្ញៀវ។", "Press Save to switch. The old link stops working, so change it before sending invitations.")
          : L("អក្សរតូច a-z លេខ - និង _ ប៉ុណ្ណោះ (អក្សរខ្មែរមិនអាចដាក់ក្នុង Link បានទេ)", "Lowercase a-z, numbers, - and _ only (Khmer letters can't go in a web link)")}
      </p>
    </div>
  );
}
