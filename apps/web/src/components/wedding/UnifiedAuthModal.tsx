"use client";

import React, { useState } from "react";
import { unifiedWeddingAuth } from "@/lib/wedding-api";
import { WeddingAuthResponse } from "@/types/wedding";
import { Phone, Lock, User, Sparkles, CheckCircle2, Globe, ShieldCheck, ArrowRight, Loader2, HeartHandshake } from "lucide-react";

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authData: WeddingAuthResponse) => void;
}

export function UnifiedAuthModal({ isOpen, onClose, onSuccess }: UnifiedAuthModalProps) {
  const [lang, setLang] = useState<"km" | "en">("km");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ isNew: boolean; name: string } | null>(null);

  if (!isOpen) return null;

  const t = {
    km: {
      title: "ចូលប្រើប្រាស់ ឬ ចុះឈ្មោះស្វ័យប្រវត្តិ",
      subtitle: "ងាយស្រួលបំផុត! គ្រាន់តែបញ្ចូលឈ្មោះ លេខទូរស័ព្ទ និងលេខសម្ងាត់",
      badgeUnified: "⚡ ទម្រង់តែមួយ (Auto Sign In / Sign Up)",
      nameLabel: "ឈ្មោះអ្នកប្រើប្រាស់ (Username / ឈ្មោះពេញ)",
      namePlaceholder: "ឧ. ជា វិសាល ឬ កូនកំលោះ",
      phoneLabel: "លេខទូរស័ព្ទ",
      phonePlaceholder: "ឧ. 012 345 678",
      passLabel: "លេខសម្ងាត់ (Password)",
      passPlaceholder: "បញ្ចូលលេខសម្ងាត់យ៉ាងតិច ៤ ខ្ទង់",
      submitBtn: "ចូលប្រើប្រាស់ / ចុះឈ្មោះភ្លាមៗ",
      helperNote: "ប្រព័ន្ធនឹងផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិ៖ បើលេខទូរស័ព្ទនេះមានរួចហើយ នឹងចូលប្រើ (Login)។ បើថ្មី នឹងបង្កើតជូនភ្លាមៗ (Auto Sign-up)!",
      cancelBtn: "បិទ",
      welcomeNew: "សូមស្វាគមន៍សមាជិកថ្មី! គណនី និងធៀបការគំរូត្រូវបានបង្កើតជូនជោគជ័យ។",
      welcomeBack: "សូមស្វាគមន៍ការត្រឡប់មកវិញ! បានចូលប្រើប្រាស់ដោយជោគជ័យ។",
      loading: "កំពុងដំណើរការ...",
      errRequire: "សូមបញ្ចូលលេខទូរស័ព្ទ និងលេខសម្ងាត់",
      langSwitch: "ភាសាខ្មែរ",
    },
    en: {
      title: "Unified Sign In & Auto-Register",
      subtitle: "Super simple! Just enter your Name, Phone Number, and Password.",
      badgeUnified: "⚡ All-in-One Auth (Smart Auto-Detection)",
      nameLabel: "Full Name / Username",
      namePlaceholder: "e.g. Visal Chea (Groom / Bride)",
      phoneLabel: "Phone Number",
      phonePlaceholder: "e.g. 012 345 678",
      passLabel: "Password",
      passPlaceholder: "Enter at least 4 characters",
      submitBtn: "Sign In / Auto-Register",
      helperNote: "Smart system: If your phone exists, it logs you in. If you're a new user, it automatically registers your account & wedding template!",
      cancelBtn: "Cancel",
      welcomeNew: "Welcome! Your new account & premier wedding card have been created.",
      welcomeBack: "Welcome back! Successfully logged in.",
      loading: "Processing...",
      errRequire: "Please enter your phone number and password",
      langSwitch: "English",
    }
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      setError(lang === "km" ? "សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ" : "Please enter a valid phone number");
      return;
    }

    if (!password || password.length < 4) {
      setError(lang === "km" ? "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ ខ្ទង់" : "Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await unifiedWeddingAuth({
        phone: cleanPhone,
        username: username.trim() || undefined,
        password,
      });

      setSuccessInfo({ isNew: res.is_new, name: res.user.username });
      setTimeout(() => {
        onSuccess(res);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || (lang === "km" ? "មានបញ្ហាក្នុងការចូលប្រើ" : "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#fbf9f5] dark:bg-[#1a1715] rounded-3xl shadow-2xl border-2 border-amber-600/30 overflow-hidden text-[#1c1917] dark:text-[#fbf9f5]">
        
        {/* Top Gold Ribbon & Language Toggle */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 p-4 text-amber-50 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-amber-200" />
            <span className="font-semibold text-sm tracking-wide">
              {lang === "km" ? "ធៀបការឌីជីថលបែបខ្មែរ" : "Khmer Digital Wedding"}
            </span>
          </div>

          {/* Bilingual Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === "km" ? "en" : "km")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-medium transition backdrop-blur-xs cursor-pointer border border-white/20"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === "km" ? "English" : "ភាសាខ្មែរ"}</span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {t.badgeUnified}
            </span>
            <h3 className="text-2xl font-bold font-serif text-[#1c1917] dark:text-white">
              {t.title}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5">
              {t.subtitle}
            </p>
          </div>

          {/* Success Banner */}
          {successInfo && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 flex items-start gap-3 animate-bounce-subtle">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                  {successInfo.isNew ? (lang === "km" ? "ចុះឈ្មោះដោយស្វ័យប្រវត្តិជោគជ័យ!" : "Auto-Registration Successful!") : (lang === "km" ? "ចូលប្រើជោគជ័យ!" : "Login Successful!")}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {successInfo.isNew ? t.welcomeNew : t.welcomeBack}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                {t.nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-xs transition"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                {t.phoneLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-xs transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                {t.passLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-xs transition"
                />
              </div>
            </div>

            {/* Smart notice */}
            <div className="p-3 bg-amber-500/10 dark:bg-amber-950/30 rounded-xl border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{t.helperNote}</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={loading || !!successInfo}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.loading}</span>
                  </>
                ) : (
                  <>
                    <span>{t.submitBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
