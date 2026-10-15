"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/input";

/**
 * Word, character and reading-time counters.
 *
 * The counting rules and the 200 / 130 words-per-minute assumptions are the
 * original ones, so every figure is measured from the text in the box. Reading
 * and speaking times only appear once there is a word to measure.
 */
export function WordCounter() {
  const [text, setText] = useState<string>(
    "CamTech.Blog is a modern editorial platform delivering verified news, scientific discoveries, interactive quizzes, and practical online tools."
  );

  const stats = React.useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const charsWithSpaces = text.length;
    const charsWithoutSpaces = text.replace(/\s+/g, "").length;
    const sentences = trimmed ? (trimmed.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;

    // Reading time (200 words per min)
    const readingTimeMins = Math.ceil(words / 200);
    // Speaking time (130 words per min)
    const speakingTimeMins = Math.ceil(words / 130);

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      sentences,
      paragraphs,
      readingTimeMins,
      speakingTimeMins,
    };
  }, [text]);

  const hasText = stats.words > 0;

  return (
    <div className="space-y-6">
      <FormField
        label="Input text"
        id="word-counter-input"
        helperText="Counted on this device only."
      >
        <Textarea
          id="word-counter-input"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here to analyse"
          className="text-sm leading-relaxed"
        />
      </FormField>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
          Clear text
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface-muted px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Words
          </dt>
          <dd className="mt-1 font-display text-2xl leading-none tabular-nums text-foreground">
            {stats.words}
          </dd>
        </div>

        <div className="bg-surface-muted px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Characters
          </dt>
          <dd className="mt-1 text-xl font-semibold leading-none tabular-nums text-foreground">
            {stats.charsWithSpaces}
          </dd>
          <dd className="mt-1 text-xs tabular-nums text-muted-foreground">
            {stats.charsWithoutSpaces} without spaces
          </dd>
        </div>

        <div className="bg-surface-muted px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sentences
          </dt>
          <dd className="mt-1 text-xl font-semibold leading-none tabular-nums text-foreground">
            {stats.sentences}
          </dd>
        </div>

        {stats.paragraphs > 0 && (
          <div className="bg-surface-muted px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Paragraphs
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-none tabular-nums text-foreground">
              {stats.paragraphs}
            </dd>
          </div>
        )}

        {hasText && (
          <div className="bg-surface-muted px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Reading time
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-none tabular-nums text-foreground">
              ~{stats.readingTimeMins} min
            </dd>
          </div>
        )}

        {hasText && (
          <div className="bg-surface-muted px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Speaking time
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-none tabular-nums text-foreground">
              ~{stats.speakingTimeMins} min
            </dd>
          </div>
        )}
      </dl>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Timings assume 200 words a minute reading and 130 speaking.
      </p>
    </div>
  );
}
