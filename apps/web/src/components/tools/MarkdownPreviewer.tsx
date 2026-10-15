"use client";

import React, { useState, useMemo } from "react";
import {
  FileCode,
  Bold,
  Italic,
  Heading2,
  Code,
  List,
  Quote,
  Table as TableIcon,
  Copy,
  Check,
  Download,
  Eye,
} from "lucide-react";
import { FormField, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_MARKDOWN = `# Exploring Angkor Wat in 2026: The Complete Guide

Angkor Wat remains one of humankind's greatest architectural achievements. Built in the early 12th century by King Suryavarman II, the temple represents the earthly model of Mount Meru.

## Key Travel Essentials

- **Archaeological Pass**: $37 (1-day) or $62 (3-day)
- **Best Sunrise Spot**: Reflection pond by the Northern Library
- **Required Dress Code**: Shoulders and knees must be respectfully covered

### Recommended 3-Day Itinerary

| Day | Circuit | Top Attractions |
|---|---|---|
| Day 1 | Small Circuit | Angkor Wat, Bayon, Ta Prohm |
| Day 2 | Grand Circuit | Preah Khan, Neak Pean, Banteay Srei |
| Day 3 | Outer Sites | Beng Mealea, Koh Ker, Tonle Sap |

> *"The monument is of such grandeur that to describe it truthfully is to risk being accused of exaggeration."* — Henri Mouhot (1860)

### Code Sample for Travel API:
\`\`\`json
{
  "destination": "Siem Reap",
  "country": "Cambodia",
  "currency": "USD"
}
\`\`\`
`;

// Simple safe markdown parser
function renderMarkdownToHtml(md: string): string {
  let html = md
    // Escape angle brackets
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks ```
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="my-3 overflow-x-auto rounded-md bg-surface-muted p-3 text-xs font-mono text-foreground border border-border"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-accent">$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="mt-4 mb-2 font-display text-lg font-bold text-foreground">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="mt-5 mb-2 font-display text-xl font-bold text-foreground border-b border-border pb-1">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="mt-2 mb-3 font-display text-2xl font-bold text-foreground">$1</h1>');

  // Blockquotes
  html = html.replace(/^\&gt;\s*(.*$)/gim, '<blockquote class="my-3 border-l-4 border-accent pl-4 italic text-muted-foreground">$1</blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Markdown Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split(/\r?\n/).map((r) =>
      r
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    );
    if (rows.length < 2) return tableBlock;

    const headers = rows[0];
    const dataRows = rows.slice(2); // Skip separator row
    let tableHtml = '<div class="my-4 overflow-x-auto"><table class="w-full text-left text-xs border border-border rounded">';
    tableHtml += '<thead class="bg-surface-muted border-b border-border"><tr>';
    headers.forEach((h) => {
      tableHtml += `<th class="px-3 py-2 font-semibold text-foreground">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody class="divide-y divide-border">';
    dataRows.forEach((row) => {
      tableHtml += '<tr class="hover:bg-surface-muted/50">';
      row.forEach((c) => {
        tableHtml += `<td class="px-3 py-2 text-muted-foreground">${c}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm text-muted-foreground my-1">$1</li>');

  // Paragraphs (lines separated by double newlines)
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      if (
        p.startsWith("<h1") ||
        p.startsWith("<h2") ||
        p.startsWith("<h3") ||
        p.startsWith("<pre") ||
        p.startsWith("<blockquote") ||
        p.startsWith("<div") ||
        p.startsWith("<li")
      ) {
        return p;
      }
      return `<p class="my-2.5 text-sm leading-relaxed text-muted-foreground">${p.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

export function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const renderedHtml = useMemo(() => {
    return renderMarkdownToHtml(markdown);
  }, [markdown]);

  // Statistics
  const stats = useMemo(() => {
    const text = markdown.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readingMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingMinutes };
  }, [markdown]);

  const insertSnippet = (snippet: string) => {
    setMarkdown((prev) => prev + "\n" + snippet);
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(renderedHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Writing & Content Engineering
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Markdown & HTML Live Formatter
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
          <span>{stats.words.toLocaleString()} words</span>
          <span>•</span>
          <span>~{stats.readingMinutes} min read</span>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-muted p-1.5 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet("## Section Title\n")}
          className="h-7 px-2"
          title="Heading"
        >
          <Heading2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet("**bold text**")}
          className="h-7 px-2 font-bold"
          title="Bold"
        >
          <Bold size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet("*italic text*")}
          className="h-7 px-2 italic"
          title="Italic"
        >
          <Italic size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet("- List item 1\n- List item 2")}
          className="h-7 px-2"
          title="Bullet List"
        >
          <List size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet('> "Quote text"')}
          className="h-7 px-2"
          title="Blockquote"
        >
          <Quote size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet("```javascript\nconsole.log('Hello');\n```")}
          className="h-7 px-2"
          title="Code Block"
        >
          <Code size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertSnippet("| Header 1 | Header 2 |\n|---|---|\n| Value 1 | Value 2 |")}
          className="h-7 px-2"
          title="Table"
        >
          <TableIcon size={14} />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopyMd} className="h-7 px-2 gap-1 text-xs">
            {copiedMd ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            {copiedMd ? "Copied MD" : "Copy MD"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyHtml} className="h-7 px-2 gap-1 text-xs">
            {copiedHtml ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            {copiedHtml ? "Copied HTML" : "Copy HTML"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2 gap-1 text-xs">
            <Download size={13} />
            Export .md
          </Button>
        </div>
      </div>

      {/* Editor & Preview Split View */}
      <div className="grid gap-4 lg:grid-cols-2">
        <FormField label="Markdown Source" id="markdown-input">
          <Textarea
            id="markdown-input"
            rows={18}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="font-mono text-xs leading-relaxed"
          />
        </FormField>

        <div>
          <span className="text-xs font-semibold tracking-wide text-foreground mb-1.5 flex items-center gap-1.5">
            <Eye size={13} className="text-accent" />
            Live Rendered HTML Preview
          </span>
          <div
            className="min-h-[28rem] rounded-md border border-border bg-surface p-4 text-xs overflow-y-auto max-h-[32rem]"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}
