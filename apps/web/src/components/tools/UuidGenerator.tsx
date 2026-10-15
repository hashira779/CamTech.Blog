"use client";

import React, { useState, useEffect } from "react";
import { Fingerprint, Copy, Check, RefreshCw, Download, Clock } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UuidType = "v7" | "v4" | "nanoid" | "short";

function generateUuidV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const now = Date.now();
  // 48-bit timestamp in milliseconds
  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = Math.floor(now / 0x1000000) & 0xff;
  bytes[3] = Math.floor(now / 0x10000) & 0xff;
  bytes[4] = Math.floor(now / 0x100) & 0xff;
  bytes[5] = now & 0xff;
  // Version 7 (0111)
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  // Variant (10xxxxxx)
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateNanoId(length = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function generateShortId(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function UuidGenerator() {
  const [type, setType] = useState<UuidType>("v7");
  const [count, setCount] = useState("5");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [items, setItems] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = () => {
    const num = Math.min(50, Math.max(1, parseInt(count, 10) || 5));
    const generated: string[] = [];

    for (let i = 0; i < num; i++) {
      let val = "";
      if (type === "v7") val = generateUuidV7();
      else if (type === "v4") val = generateUuidV4();
      else if (type === "nanoid") val = generateNanoId(21);
      else if (type === "short") val = generateShortId(10);

      if (!hyphens && (type === "v7" || type === "v4")) {
        val = val.replace(/-/g, "");
      }
      if (uppercase) {
        val = val.toUpperCase();
      }
      generated.push(val);
    }
    setItems(generated);
  };

  useEffect(() => {
    generate();
  }, [type, count, uppercase, hyphens]);

  // Decode timestamp from the first UUID v7
  const v7DecodedDate = React.useMemo(() => {
    if (type !== "v7" || items.length === 0) return null;
    try {
      const clean = items[0].replace(/-/g, "").toLowerCase();
      const ms = parseInt(clean.slice(0, 12), 16);
      if (isNaN(ms) || ms < 1000000000000) return null;
      return new Date(ms);
    } catch {
      return null;
    }
  }, [items, type]);

  const handleCopySingle = (val: string, idx: number) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(items.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([items.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${type}-${items.length}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Cryptographic Identifiers
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            UUID v4, v7 & NanoID Generator
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          RFC 9562 Compliant
        </Badge>
      </div>

      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Identifier Standard" id="uuid-type">
          <Select id="uuid-type" value={type} onChange={(e) => setType(e.target.value as UuidType)}>
            <option value="v7">UUID v7 (Time-Ordered 2026 standard)</option>
            <option value="v4">UUID v4 (Random / Cryptographic)</option>
            <option value="nanoid">NanoID (21-char URL friendly)</option>
            <option value="short">Short ID (10-char alphanumeric)</option>
          </Select>
        </FormField>

        <FormField label="Batch Quantity (1 - 50)" id="uuid-count">
          <Input
            id="uuid-count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <div className="flex flex-col justify-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded border-input text-accent focus:ring-ring"
            />
            Uppercase Letters
          </label>
        </div>

        {(type === "v7" || type === "v4") && (
          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={hyphens}
                onChange={(e) => setHyphens(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Include Hyphens
            </label>
          </div>
        )}
      </div>

      {/* Live UUID v7 Timestamp Inspector */}
      {type === "v7" && v7DecodedDate && (
        <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
          <Clock size={16} className="text-accent shrink-0" />
          <div className="text-muted-foreground">
            <span className="font-semibold text-foreground">UUID v7 Decoded Timestamp: </span>
            <span className="font-mono text-accent">{v7DecodedDate.toISOString()}</span>{" "}
            <span>({v7DecodedDate.toLocaleString()})</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="primary" size="sm" onClick={generate} className="gap-1.5">
          <RefreshCw size={14} />
          Regenerate Batch
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
            {copiedAll ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {copiedAll ? "Copied all!" : "Copy All"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download size={14} />
            Download .txt
          </Button>
        </div>
      </div>

      {/* Output List */}
      <div className="divide-y divide-border rounded-lg border border-border bg-surface font-mono text-xs shadow-xs">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-muted transition-colors"
          >
            <span className="truncate select-all text-foreground">{item}</span>
            <button
              type="button"
              onClick={() => handleCopySingle(item, idx)}
              className="inline-flex items-center gap-1 shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              title="Copy to clipboard"
            >
              {copiedIndex === idx ? (
                <>
                  <Check size={13} className="text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
