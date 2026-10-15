"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  title: string;
  extract: string;
  url?: string;
  thumbnailUrl?: string;
  source: "DuckDuckGo" | "Wikipedia" | "Khmer Wikipedia";
  description?: string;
}

const PRESET_TOPICS = [
  { en: "Cambodia", km: "ប្រទេសកម្ពុជា" },
  { en: "Angkor Wat", km: "ប្រាសាទអង្គរវត្ត" },
  { en: "Phnom Penh", km: "រាជធានីភ្នំពេញ" },
  { en: "Bakong (payment system)", km: "ប្រព័ន្ធបាគង" },
  { en: "Jayavarman VII", km: "ព្រះបាទជ័យវរ្ម័នទី ៧" },
  { en: "Mekong River", km: "ទន្លេមេគង្គ" },
];

export function KnowledgeSearchTool() {
  const [query, setQuery] = useState("Cambodia");
  const [lang, setLang] = useState<"en" | "km">("en");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [relatedList, setRelatedList] = useState<Array<{ title: string; url: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery?: string, searchLang?: "en" | "km") => {
    const q = (searchQuery ?? query).trim();
    const l = searchLang ?? lang;
    if (!q) return;

    setIsLoading(true);
    setHasSearched(true);
    setResult(null);
    setRelatedList([]);

    try {
      if (l === "km") {
        // Khmer Wikipedia OpenSearch API
        const res = await fetch(
          `https://km.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
            q
          )}&limit=5&format=json&origin=*`
        );
        if (res.ok) {
          const data = await res.json();
          // data format: [query, [titles], [descriptions], [urls]]
          const titles: string[] = data[1] || [];
          const descs: string[] = data[2] || [];
          const urls: string[] = data[3] || [];

          if (titles.length > 0) {
            setResult({
              title: titles[0],
              extract: descs[0] || `អត្ថបទវិគីភីឌាភាសាខ្មែរស្ដីអំពី ${titles[0]}`,
              url: urls[0],
              source: "Khmer Wikipedia",
              description: "វិគីភីឌាភាសាខ្មែរ",
            });

            // Related
            const related = titles.slice(1).map((t, idx) => ({
              title: t,
              url: urls[idx + 1] || "",
            }));
            setRelatedList(related);
          }
        }
      } else {
        // 1. Try Wikipedia Summary REST API (richest knowledge card)
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`
        );
        if (wikiRes.ok) {
          const wData = await wikiRes.json();
          if (wData && wData.title && wData.extract) {
            setResult({
              title: wData.title,
              extract: wData.extract,
              url: wData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,
              thumbnailUrl: wData.thumbnail?.source,
              source: "Wikipedia",
              description: wData.description,
            });
          }
        } else {
          // 2. Fallback to DuckDuckGo Instant Answer
          const ddgRes = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`
          );
          if (ddgRes.ok) {
            const dData = await ddgRes.json();
            if (dData.AbstractText) {
              setResult({
                title: dData.Heading || q,
                extract: dData.AbstractText,
                url: dData.AbstractURL,
                source: "DuckDuckGo",
                description: dData.Entity,
              });
            }
          }
        }

        // Fetch related search suggestions from Wikipedia
        const searchSuggestionsRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
            q
          )}&limit=5&format=json&origin=*`
        );
        if (searchSuggestionsRes.ok) {
          const sData = await searchSuggestionsRes.json();
          const titles: string[] = sData[1] || [];
          const urls: string[] = sData[3] || [];
          const related = titles.slice(1).map((t, idx) => ({
            title: t,
            url: urls[idx + 1] || "",
          }));
          setRelatedList(related);
        }
      }
    } catch (err) {
      console.warn("Public knowledge search API error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [query, lang]);

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.title}:
${result.extract}
Source: ${result.url || result.source}`;
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
            Zero Tracking • DuckDuckGo & Wikipedia Open APIs
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Instant Public Knowledge & Wikipedia Search
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm" className="gap-1">
            <Globe size={12} />
            <span>Open Public Data</span>
          </Badge>
        </div>
      </div>

      {/* Preset Topics */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Quick Knowledge Explorations:</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TOPICS.map((topic, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const text = lang === "km" ? topic.km : topic.en;
                setQuery(text);
                handleSearch(text);
              }}
              className="px-2.5 py-1 rounded text-xs border border-border bg-surface hover:bg-surface-muted text-foreground transition-colors"
            >
              {lang === "km" ? topic.km : topic.en}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="grid gap-3 sm:grid-cols-12 items-end">
        <div className="sm:col-span-8">
          <FormField id="knowledge-search-input" label="Search Topic, Person, Place or Term" helperText="Query instant definitions, historical events, and scientific topics">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="knowledge-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={lang === "km" ? "ស្វែងរកប្រធានបទ..." : "Search anything (e.g. Angkor Wat, Cambodia)..."}
                className="pl-9 text-sm"
              />
            </div>
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-foreground block mb-1">Language</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setLang("en");
                if (hasSearched) handleSearch(undefined, "en");
              }}
              className={`py-1.5 rounded text-xs font-semibold border transition-all ${
                lang === "en"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => {
                setLang("km");
                if (hasSearched) handleSearch(undefined, "km");
              }}
              className={`py-1.5 rounded text-xs font-semibold border transition-all ${
                lang === "km"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
              }`}
            >
              ខ្មែរ
            </button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading || !query.trim()}
            className="w-full gap-1.5 text-xs h-9"
          >
            <Search size={14} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Searching..." : "Search"}</span>
          </Button>
        </div>
      </div>

      {/* Result Card */}
      {result ? (
        <div className="p-5 rounded-xl border border-border bg-surface space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm" className="font-semibold text-accent">
                  {result.source}
                </Badge>
                {result.description && (
                  <span className="text-xs text-muted-foreground">{result.description}</span>
                )}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">{result.title}</h3>
            </div>

            {result.thumbnailUrl && (
              <img
                src={result.thumbnailUrl}
                alt={result.title}
                className="h-16 w-16 rounded-lg object-cover border border-border shadow-xs shrink-0"
              />
            )}
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed">{result.extract}</p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
              >
                <span>Read full article on {result.source}</span>
                <ExternalLink size={12} />
              </a>
            )}

            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-8 text-xs">
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy Extract"}</span>
            </Button>
          </div>
        </div>
      ) : hasSearched && !isLoading ? (
        <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-2">
          <BookOpen size={24} className="mx-auto text-muted-foreground opacity-60" />
          <p className="text-xs text-muted-foreground">
            No exact instant article summary found for &ldquo;{query}&rdquo;. Try another topic from the presets above.
          </p>
        </div>
      ) : null}

      {/* Related Topics Suggestions */}
      {relatedList.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-surface-muted/50 space-y-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers size={13} className="text-accent" />
            <span>Related Topics:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {relatedList.map((rel, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(rel.title);
                  handleSearch(rel.title);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-surface border border-border hover:border-accent hover:text-accent transition-colors"
              >
                <span>{rel.title}</span>
                <ArrowRight size={10} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="pt-1">
        <span className="text-[11px] text-muted-foreground">
          Queries are sent directly from your browser to public endpoints (DuckDuckGo & Wikimedia). No search history is retained.
        </span>
      </div>
    </div>
  );
}
