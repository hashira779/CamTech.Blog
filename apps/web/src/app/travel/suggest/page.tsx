"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Send } from "lucide-react";
import { submitPlaceSuggestion, getDestinations } from "@/lib/api";
import { PlaceSuggestionCreate, Destination } from "@/types";
import { Container } from "@/components/ui/container";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MetaDot } from "@/components/ui/byline";
import travelConfig from "@/data/travel_config.json";

const SUGGESTION_TYPES: { id: PlaceSuggestionCreate["suggestion_type"]; label: string }[] = [
  { id: "NEW_PLACE", label: "Suggest a new place" },
  { id: "UPDATE_INFO", label: "Update information" },
  { id: "REPORT_CLOSED", label: "Report a closure" },
  { id: "INACCURACY", label: "Report an inaccuracy" },
];

export default function SuggestPlacePage() {
  const [suggestionType, setSuggestionType] = useState<
    "NEW_PLACE" | "UPDATE_INFO" | "REPORT_CLOSED" | "INACCURACY"
  >("NEW_PLACE");
  const [placeName, setPlaceName] = useState("");
  const [destinationSlug, setDestinationSlug] = useState("siem-reap");
  const [placeType, setPlaceType] = useState("ATTRACTION");
  const [destinationsList, setDestinationsList] = useState<Destination[]>([]);
  const [details, setDetails] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDestinations().then((dests) => {
      if (dests && dests.length > 0) {
        setDestinationsList(dests);
      }
    });
  }, []);

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
    <div className="flex w-full flex-1 flex-col">
      <Container className="pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <MetaDot />
          <Link href="/travel" className="transition-colors hover:text-foreground">
            Travel
          </Link>
          <MetaDot />
          <span className="text-foreground">Suggest a place</span>
        </nav>
      </Container>

      <Container width="reading" className="pt-8 pb-16 sm:pt-12">
        <Link
          href="/travel"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to travel
        </Link>

        <p className="section-label mt-6 text-accent">Corrections</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl">
          Suggest a place or report an update
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Tell us what has changed. Submissions arrive in the editorial queue and are checked before
          anything appears on the site.
        </p>

        {submitted ? (
          <div className="mt-10 rounded-lg border border-border bg-card p-6 shadow-xs sm:p-8">
            <CheckCircle2 size={24} className="text-success" aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl leading-tight tracking-tight text-foreground">
              Submission received for editorial review
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Thank you for contributing to our verified knowledge base. Our editorial team will review
              your information and apply non-destructive updates to the public registry.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/travel">Return to travel</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setPlaceName("");
                  setDetails("");
                  setSourceNotes("");
                }}
              >
                Submit another suggestion
              </Button>
            </div>
          </div>
        ) : (
          <>
            <aside className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4">
              <Info size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Nothing publishes directly from this form.</span>{" "}
                Submissions are held for review, which keeps scraped listings, unverified opening hours and
                promotional entries out of the registry.
              </p>
            </aside>

            {error && (
              <p
                role="alert"
                className="mt-6 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <fieldset className="space-y-3">
                <legend className="section-label">What would you like to do?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUGGESTION_TYPES.map((t) => {
                    const active = suggestionType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSuggestionType(t.id)}
                        aria-pressed={active}
                        className={
                          active
                            ? "rounded-md border border-accent bg-accent-soft px-4 py-3 text-left text-sm font-medium text-foreground transition-colors"
                            : "rounded-md border border-border bg-surface px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                        }
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Place name"
                  id="suggest-place-name"
                  required
                  helperText="The name locals and travellers actually use."
                >
                  <Input
                    id="suggest-place-name"
                    type="text"
                    required
                    placeholder="e.g. Banteay Kdei"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                  />
                </FormField>

                <FormField label="Destination" id="suggest-destination" required>
                  <Select
                    id="suggest-destination"
                    value={destinationSlug}
                    onChange={(e) => setDestinationSlug(e.target.value)}
                  >
                    {destinationsList.length > 0 ? (
                      destinationsList.map((d) => (
                        <option key={d.slug} value={d.slug}>
                          {d.name} {d.name_km ? `(${d.name_km})` : ""}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="siem-reap">Siem Reap</option>
                        <option value="phnom-penh">Phnom Penh</option>
                        <option value="kampot">Kampot</option>
                      </>
                    )}
                  </Select>
                </FormField>
              </div>

              <FormField label="Place type" id="suggest-place-type">
                <Select id="suggest-place-type" value={placeType} onChange={(e) => setPlaceType(e.target.value)}>
                  {travelConfig.place_categories
                    .filter((c) => c.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </Select>
              </FormField>

              <FormField
                label="Details"
                id="suggest-details"
                required
                helperText="What is wrong or missing, and how you know. Address, phone, closure date or a link help us check it."
              >
                <Textarea
                  id="suggest-details"
                  required
                  rows={5}
                  placeholder="Opening hours, the correct address, what has changed…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </FormField>

              <FormField
                label="Website or source"
                id="suggest-source"
                helperText="Optional. A page we can attribute the correction to."
              >
                <Input
                  id="suggest-source"
                  type="text"
                  placeholder="https://…"
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                />
              </FormField>

              <div className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
                <FormField label="Your name" id="suggest-name" helperText="Optional.">
                  <Input
                    id="suggest-name"
                    type="text"
                    placeholder="How we should credit you"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                  />
                </FormField>

                <FormField label="Contact" id="suggest-contact" helperText="Optional, only if we need to ask a question.">
                  <Input
                    id="suggest-contact"
                    type="text"
                    placeholder="Email or Telegram"
                    value={submitterContact}
                    onChange={(e) => setSubmitterContact(e.target.value)}
                  />
                </FormField>
              </div>

              <Button type="submit" variant="accent" size="lg" isLoading={submitting} className="w-full sm:w-auto">
                {!submitting && <Send size={16} aria-hidden="true" />}
                {submitting ? "Sending to the editorial queue…" : "Send for editorial review"}
              </Button>
            </form>
          </>
        )}
      </Container>
    </div>
  );
}
