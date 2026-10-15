"use client";

import React, { useState, useMemo } from "react";
import { Link2, Copy, Check, ArrowRightLeft, Table } from "lucide-react";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function UrlEncoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [encodeType, setEncodeType] = useState<"component" | "full">("component");
  const [input, setInput] = useState("https://camtech.blog/search?q=អង្គរវត្ត siem reap&year=2026&tag=travel");
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "encode") {
        return encodeType === "component" ? encodeURIComponent(input) : encodeURI(input);
      } else {
        return decodeURIComponent(input);
      }
    } catch (err: any) {
      return `Error: ${err.message || "Invalid URL component"}`;
    }
  }, [input, mode, encodeType]);

  // Query parameter inspector
  const queryParams = useMemo(() => {
    try {
      const qIndex = input.indexOf("?");
      if (qIndex === -1 && !input.includes("=")) return [];
      const searchStr = qIndex !== -1 ? input.slice(qIndex + 1) : input;
      const searchParams = new URLSearchParams(searchStr);
      const list: Array<{ key: string; value: string }> = [];
      searchParams.forEach((val, k) => {
        list.push({ key: k, value: val });
      });
      return list;
    } catch {
      return [];
    }
  }, [input]);

  const handleCopy = (text: string, isJson = false) => {
    navigator.clipboard.writeText(text);
    if (isJson) {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwap = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output.startsWith("Error:") ? "" : output);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Web & API Utilities
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            URL Encoder, Decoder & Query Inspector
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          RFC 3986
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "encode" ? "primary" : "outline"}
            size="sm"
            onClick={() => setMode("encode")}
          >
            Encode
          </Button>
          <Button
            variant={mode === "decode" ? "primary" : "outline"}
            size="sm"
            onClick={() => setMode("decode")}
          >
            Decode
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSwap} title="Swap input and output">
            <ArrowRightLeft size={14} />
          </Button>
        </div>

        {mode === "encode" && (
          <div className="flex items-center gap-2 text-xs">
            <label className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground">
              <input
                type="radio"
                name="encodeType"
                checked={encodeType === "component"}
                onChange={() => setEncodeType("component")}
                className="text-accent focus:ring-ring"
              />
              encodeURIComponent (query & params)
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground ml-3">
              <input
                type="radio"
                name="encodeType"
                checked={encodeType === "full"}
                onChange={() => setEncodeType("full")}
                className="text-accent focus:ring-ring"
              />
              encodeURI (full address)
            </label>
          </div>
        )}
      </div>

      <FormField
        label={mode === "encode" ? "Plain URL or Query String to Encode" : "Encoded URL to Decode"}
        id="url-input"
      >
        <Textarea
          id="url-input"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste URL or query string here..."
          className="font-mono text-sm leading-relaxed"
        />
      </FormField>

      <FormField
        label={mode === "encode" ? "Encoded URL Output" : "Decoded URL Output"}
        id="url-output"
        helperText={`${output.length.toLocaleString()} characters`}
      >
        <Textarea
          id="url-output"
          rows={4}
          readOnly
          value={output}
          className="font-mono text-sm bg-surface-muted select-all leading-relaxed"
        />
      </FormField>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopy(output)}
          disabled={!output || output.startsWith("Error:")}
          className="gap-1.5"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied output!" : "Copy Output"}
        </Button>
      </div>

      {/* Query Parameters Table Inspector */}
      {queryParams.length > 0 && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Table size={16} className="text-accent" />
              Detected Query Parameters ({queryParams.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleCopy(
                  JSON.stringify(
                    Object.fromEntries(queryParams.map((p) => [p.key, p.value])),
                    null,
                    2
                  ),
                  true
                )
              }
              className="gap-1.5 text-xs h-7"
            >
              {copiedJson ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copiedJson ? "Copied JSON" : "Copy as JSON"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-border text-muted-foreground font-sans">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Parameter Key</th>
                  <th className="py-2 font-semibold">Decoded Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queryParams.map((p, idx) => (
                  <tr key={idx} className="hover:bg-surface-muted transition-colors">
                    <td className="py-2 pr-3 font-semibold text-accent select-all">{p.key}</td>
                    <td className="py-2 text-foreground select-all break-all">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
