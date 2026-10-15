"use client";

import React, { useState, useMemo } from "react";
import { Palette, ArrowRightLeft, CheckCircle2, XCircle, Info } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Calculate relative luminance according to WCAG 2.1 / 2.2
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const PRESETS = [
  { name: "Editorial Slate", fg: "#0F172A", bg: "#F8FAFC" },
  { name: "Dark Modern", fg: "#F8FAFC", bg: "#0F172A" },
  { name: "Khmer Silk Amber", fg: "#92400E", bg: "#FEF3C7" },
  { name: "Forest Emerald", fg: "#064E3B", bg: "#ECFDF5" },
  { name: "Classic Navy", fg: "#1E3A8A", bg: "#FFFFFF" },
];

export function ColorContrastChecker() {
  const [fgColor, setFgColor] = useState("#0F172A");
  const [bgColor, setBgColor] = useState("#F8FAFC");

  const ratio = useMemo(() => {
    return getContrastRatio(fgColor, bgColor);
  }, [fgColor, bgColor]);

  const handleSwap = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
  };

  const passes = {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7.0,
    largeAA: ratio >= 3.0,
    largeAAA: ratio >= 4.5,
    uiComponents: ratio >= 3.0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Accessibility & Design
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Color Palette & WCAG 2.2 Contrast Checker
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          WCAG 2.2 AA / AAA
        </Badge>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Presets:</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setFgColor(p.fg);
              setBgColor(p.bg);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-surface-muted transition-colors"
          >
            <span
              className="h-2.5 w-2.5 rounded-full border border-border"
              style={{ backgroundColor: p.fg }}
            />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Color Selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Text / Foreground Color" id="fg-color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <Input
              id="fg-color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="font-mono uppercase tabular-nums"
            />
          </div>
        </FormField>

        <FormField label="Background Color" id="bg-color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <Input
              id="bg-color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="font-mono uppercase tabular-nums"
            />
            <Button variant="ghost" size="sm" onClick={handleSwap} title="Swap foreground and background">
              <ArrowRightLeft size={14} />
            </Button>
          </div>
        </FormField>
      </div>

      {/* Live Ratio Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-muted p-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Contrast Ratio
          </span>
          <div className="mt-1 font-display text-4xl font-bold tabular-nums text-foreground">
            {ratio.toFixed(2)} : 1
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ratio >= 7 ? (
            <Badge variant="success" size="md">
              Level AAA Enhanced
            </Badge>
          ) : ratio >= 4.5 ? (
            <Badge variant="success" size="md">
              Level AA Compliant
            </Badge>
          ) : ratio >= 3 ? (
            <Badge variant="warning" size="md">
              Large Text Only (3:1)
            </Badge>
          ) : (
            <Badge variant="destructive" size="md">
              Fails WCAG Standards
            </Badge>
          )}
        </div>
      </div>

      {/* Live Sample Card with Actual Colors */}
      <div
        style={{ backgroundColor: bgColor, color: fgColor }}
        className="rounded-lg border border-border p-6 shadow-sm transition-colors space-y-3"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
          Live Readability Preview
        </span>
        <h3 className="font-display text-2xl font-bold leading-tight">
          Empowering readers with verified facts, independent journalism, and practical tools.
        </h3>
        <p className="text-sm leading-relaxed opacity-90">
          This sample demonstrates how body paragraph text, captions, and headings appear to readers
          across different lighting conditions, mobile screens, and contrast sensitivity levels.
        </p>
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            style={{ borderColor: fgColor, color: fgColor }}
            className="rounded border px-3 py-1.5 text-xs font-semibold"
          >
            Sample Interactive Button
          </button>
          <span className="text-xs opacity-75">
            Caption & Metadata Text (12px)
          </span>
        </div>
      </div>

      {/* WCAG Compliance Matrix Table */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Palette size={16} className="text-accent" />
          WCAG 2.2 Accessibility Compliance Matrix
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Normal Text */}
          <div className="rounded-md border border-border bg-surface p-3 space-y-2">
            <span className="text-xs font-semibold text-foreground">Normal Body Text (&lt; 18pt)</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AA (4.5:1 min):</span>
                {passes.normalAA ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <CheckCircle2 size={13} /> Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                    <XCircle size={13} /> Fail
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AAA (7.0:1 min):</span>
                {passes.normalAAA ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <CheckCircle2 size={13} /> Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                    <XCircle size={13} /> Fail
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Large Text */}
          <div className="rounded-md border border-border bg-surface p-3 space-y-2">
            <span className="text-xs font-semibold text-foreground">Large Text (&gt;= 18pt or bold 14pt)</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AA (3.0:1 min):</span>
                {passes.largeAA ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <CheckCircle2 size={13} /> Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                    <XCircle size={13} /> Fail
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AAA (4.5:1 min):</span>
                {passes.largeAAA ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <CheckCircle2 size={13} /> Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                    <XCircle size={13} /> Fail
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Graphical UI */}
          <div className="rounded-md border border-border bg-surface p-3 space-y-2">
            <span className="text-xs font-semibold text-foreground">UI Components & Icons</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AA (3.0:1 min):</span>
                {passes.uiComponents ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <CheckCircle2 size={13} /> Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                    <XCircle size={13} /> Fail
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Applies to borders, toggles, form fields, and status icons.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
