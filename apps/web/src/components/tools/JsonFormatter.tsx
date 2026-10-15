"use client";

import React, { useState } from "react";
import { Check, Copy, Minimize2, Braces } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/input";

/**
 * JSON beautifier and validator.
 *
 * Parsing, minifying and the copy-to-clipboard behaviour are the same; only the
 * surface changed. The error line is now a `role="alert"` sentence in the
 * destructive token rather than a rose block, and every control carries a label.
 */
export function JsonFormatter() {
  const { t } = useI18n();
  const [input, setInput] = useState('{"platform":"CamTech.Blog","founded":2026,"categories":["Cambodia","World","Discover","Play","Tools"],"ready":true}');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={handleFormat} className="gap-1.5">
          <Braces size={14} aria-hidden="true" />
          {t("tool.format")} · 2 spaces
        </Button>
        <Button variant="outline" size="sm" onClick={handleMinify} className="gap-1.5">
          <Minimize2 size={14} aria-hidden="true" />
          Minify
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="ml-auto gap-1.5"
          aria-live="polite"
        >
          {copied ? <Check size={14} className="text-success" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? t("tool.copied") : t("tool.copy")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-destructive">
          <span className="font-semibold">JSON syntax error: </span>
          {error}
        </p>
      )}

      <FormField label="JSON input" id="json-input" helperText="Parses on the device. Nothing is sent anywhere.">
        <Textarea
          id="json-input"
          rows={14}
          value={input}
          error={Boolean(error)}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          spellCheck={false}
          className="min-h-64 font-mono text-sm leading-relaxed"
        />
      </FormField>
    </div>
  );
}
