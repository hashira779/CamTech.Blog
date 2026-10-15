"use client";

import React, { useState, useCallback } from "react";
import {
  Globe,
  Search,
  RefreshCw,
  Copy,
  Check,
  Server,
  ShieldCheck,
  Clock,
  Layers,
  Code,
  Sparkles,
} from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
  typeName?: string;
}

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA"] as const;
type RecordType = (typeof RECORD_TYPES)[number];

const TYPE_ID_MAP: Record<number, string> = {
  1: "A",
  28: "AAAA",
  5: "CNAME",
  15: "MX",
  16: "TXT",
  2: "NS",
  6: "SOA",
};

const PRESET_DOMAINS = [
  "cam-tech.blog",
  "google.com",
  "bakong.nbc.gov.kh",
  "smart.com.kh",
  "cloudflare.com",
  "github.com",
];

export function DnsLookupInspector() {
  const [domain, setDomain] = useState("cam-tech.blog");
  const [selectedType, setSelectedType] = useState<RecordType | "ALL">("A");
  const [records, setRecords] = useState<DnsAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchedDomain, setSearchedDomain] = useState("cam-tech.blog");

  const cleanDomain = (d: string) => {
    return d.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim().toLowerCase();
  };

  const handleLookup = useCallback(async (targetDomain?: string, targetType?: RecordType | "ALL") => {
    const rawDom = targetDomain ?? domain;
    const typeToQuery = targetType ?? selectedType;
    const sanitized = cleanDomain(rawDom);
    if (!sanitized) return;

    setIsLoading(true);
    setSearchedDomain(sanitized);

    const startTime = performance.now();
    try {
      if (typeToQuery === "ALL") {
        const types: RecordType[] = ["A", "MX", "TXT", "NS"];
        const promises = types.map((t) =>
          fetch(`https://dns.google/resolve?name=${encodeURIComponent(sanitized)}&type=${t}`, {
            headers: { Accept: "application/dns-json" },
          }).then((r) => r.json())
        );

        const results = await Promise.all(promises);
        const combined: DnsAnswer[] = [];
        results.forEach((res, idx) => {
          if (Array.isArray(res.Answer)) {
            res.Answer.forEach((ans: DnsAnswer) => {
              combined.push({
                ...ans,
                typeName: TYPE_ID_MAP[ans.type] || types[idx],
              });
            });
          }
        });

        const endTime = performance.now();
        setResponseTimeMs(Math.round(endTime - startTime));
        setRecords(combined);
        setRawJson(JSON.stringify(results, null, 2));
      } else {
        const res = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(sanitized)}&type=${typeToQuery}`,
          { headers: { Accept: "application/dns-json" } }
        );
        const endTime = performance.now();
        setResponseTimeMs(Math.round(endTime - startTime));

        if (res.ok) {
          const data = await res.json();
          const answers: DnsAnswer[] = (data.Answer || []).map((a: DnsAnswer) => ({
            ...a,
            typeName: TYPE_ID_MAP[a.type] || typeToQuery,
          }));
          setRecords(answers);
          setRawJson(JSON.stringify(data, null, 2));
        } else {
          setRecords([]);
          setRawJson(null);
        }
      }
    } catch (err) {
      console.warn("DNS query error:", err);
      setRecords([]);
      setRawJson(null);
    } finally {
      setIsLoading(false);
    }
  }, [domain, selectedType]);

  const handleCopy = () => {
    if (records.length === 0) return;
    const text = `DNS Lookup for ${searchedDomain}:
${records.map((r) => `• [${r.typeName || r.type}] ${r.data} (TTL: ${r.TTL}s)`).join("\n")}
Response time: ${responseTimeMs} ms via Google Public DNS (DoH)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Google DNS-over-HTTPS (DoH) • Instant Query
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Browser DNS & Domain Health Inspector
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {responseTimeMs !== null && (
            <Badge variant="success" size="sm" className="font-mono text-xs">
              {responseTimeMs} ms
            </Badge>
          )}
          <Badge variant="secondary" size="sm">
            DNS Resolver 8.8.8.8
          </Badge>
        </div>
      </div>

      {/* Preset Domain Chips */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Quick Test Domains:</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDomain(d);
                handleLookup(d);
              }}
              className="px-2.5 py-1 rounded text-xs border border-border bg-surface hover:bg-surface-muted text-foreground transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Input Domain & Type Bar */}
      <div className="grid gap-3 sm:grid-cols-12 items-end">
        <div className="sm:col-span-7">
          <FormField id="dns-domain-input" label="Domain Name to Inspect" helperText="Enter hostname without http/https (e.g. cam-tech.blog)">
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dns-domain-input"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="example.com"
                className="pl-9 font-mono text-sm"
              />
            </div>
          </FormField>
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-semibold text-foreground block mb-1">Record Type</label>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedType("ALL")}
              className={`px-2 py-1.5 rounded text-xs font-semibold border transition-all ${
                selectedType === "ALL"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
              }`}
            >
              ALL
            </button>
            {RECORD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-2 py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
                  selectedType === t
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Button
            onClick={() => handleLookup()}
            disabled={isLoading || !domain}
            className="w-full gap-1.5 text-xs h-9"
          >
            <Search size={14} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Querying..." : "Lookup"}</span>
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              Results for <span className="font-mono text-accent">{searchedDomain}</span>
            </span>
            <Badge variant="outline" size="sm">
              {records.length} records found
            </Badge>
          </div>

          {rawJson && (
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Code size={13} />
              <span>{showRawJson ? "Show Table" : "View Raw JSON"}</span>
            </button>
          )}
        </div>

        {showRawJson && rawJson ? (
          <pre className="p-4 rounded-xl border border-border bg-surface-muted text-xs font-mono overflow-x-auto text-foreground">
            {rawJson}
          </pre>
        ) : records.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Host / Name</th>
                    <th className="py-2.5 px-3">Resolved Data / Target</th>
                    <th className="py-2.5 px-3 text-right">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface font-mono">
                  {records.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" size="sm" className="font-bold text-accent">
                          {r.typeName || r.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[150px]">{r.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground break-all">{r.data}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{r.TTL}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-2">
            <Server size={24} className="mx-auto text-muted-foreground opacity-60" />
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Querying Google DNS over HTTPS resolvers..."
                : "No DNS records found or lookup has not run yet. Enter a domain and click Lookup."}
            </p>
          </div>
        )}
      </div>

      {/* Footer & Copy */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Queries are executed via Google Public DNS (DoH RFC 8484) without local terminal requirements.
        </span>
        {records.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? "Copied Records" : "Copy DNS Results"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
