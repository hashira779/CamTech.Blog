"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Info,
  ArrowLeft,
  Send
} from "lucide-react";
import { submitPlaceSuggestion } from "@/lib/api";
import { PlaceSuggestionCreate } from "@/types";

export default function SuggestPlacePage() {
  const [suggestionType, setSuggestionType] = useState<
    "NEW_PLACE" | "UPDATE_INFO" | "REPORT_CLOSED" | "INACCURACY"
  >("NEW_PLACE");
  const [placeName, setPlaceName] = useState("");
  const [destinationSlug, setDestinationSlug] = useState("siem-reap");
  const [placeType, setPlaceType] = useState("ATTRACTION");
  const [details, setDetails] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim() || !details.trim()) {
      setError("Please provide the place name and submission details.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: PlaceSuggestionCreate = {
      suggestion_type: suggestionType,
      place_name: placeName.trim(),
      destination_slug: destinationSlug,
      place_type: placeType,
      details: details.trim(),
      submitter_name: submitterName.trim() || undefined,
      submitter_contact: submitterContact.trim() || undefined,
      source_notes: sourceNotes.trim() || undefined,
    };

    const res = await submitPlaceSuggestion(payload);
    setSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.message || "Failed to submit. Please try again.");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 1. Header Banner */}
      <section className="bg-neutral-900 text-white py-14 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/travel"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:underline mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Travel
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Editorial Review Queue
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Suggest a Place or Report an Update
          </h1>
          <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
            Help maintain Daily Discovery&apos;s verified travel repository. Every submission is
            fact-checked and reviewed by human editors before publication.
          </p>
        </div>
      </section>

      {/* 2. Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {submitted ? (
          <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800 p-8 sm:p-12 text-center shadow-lg">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Submission Received for Editorial Review
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 max-w-md mx-auto leading-relaxed">
              Thank you for contributing to our verified knowledge base. Our editorial team will review
              your information and apply non-destructive updates to the public registry.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/travel"
                className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-sm hover:opacity-90"
              >
                Return to Travel Hub
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setPlaceName("");
                  setDetails("");
                  setSourceNotes("");
                }}
                className="px-6 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-200"
              >
                Submit Another Suggestion
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            {/* Moderation Policy Notice */}
            <div className="mb-8 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 flex items-start gap-3">
              <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <strong className="text-neutral-900 dark:text-white block font-bold">
                  Zero Direct Publishing Policy
                </strong>
                To protect against scraped spam, unverified hours, and promotional manipulation,
                submissions enter our moderation queue and are verified before becoming public.
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Suggestion Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  What would you like to do?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: "NEW_PLACE", label: "Suggest New Place" },
                    { id: "UPDATE_INFO", label: "Suggest Information Update" },
                    { id: "REPORT_CLOSED", label: "Report Place Closed" },
                    { id: "INACCURACY", label: "Report Inaccuracy" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSuggestionType(t.id as any)}
                      className={`p-3 rounded-xl border text-center font-semibold transition-all ${
                        suggestionType === t.id
                          ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 font-bold"
                          : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Place Name & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Place Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Banteay Kdei, Sokha Palace, Haven Cafe"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Destination *
                  </label>
                  <select
                    value={destinationSlug}
                    onChange={(e) => setDestinationSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="siem-reap">Siem Reap</option>
                    <option value="phnom-penh">Phnom Penh</option>
                    <option value="kampot">Kampot</option>
                    <option value="other">Other Province in Cambodia</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Place Type / Category
                </label>
                <select
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="ATTRACTION">Attraction / Cultural Site</option>
                  <option value="TEMPLE">Temple / Sacred Shrine</option>
                  <option value="ACCOMMODATION">Hotel / Resort / Guesthouse</option>
                  <option value="RESTAURANT">Restaurant / Khmer Dining</option>
                  <option value="CAFE">Cafe / Bakery</option>
                  <option value="MARKET">Market / Local Crafts</option>
                  <option value="WATERFALL">Waterfall / Nature Park</option>
                  <option value="ACTIVITY">Activity / Nightlife / Tour</option>
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Details & Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide opening hours, correct address, changes, or why this place is worth discovering..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                />
              </div>

              {/* Sources / Verification Link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Official Website or Verification Source (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://... or official social page"
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Optional Submitter Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sokha Chhay"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Contact Email / Telegram (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="If we need clarification"
                    value={submitterContact}
                    onChange={(e) => setSubmitterContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Sending to Moderation Queue...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit for Editorial Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
