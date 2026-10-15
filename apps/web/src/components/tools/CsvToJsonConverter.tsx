"use client";

import React, { useState, useMemo } from "react";
import { FileSpreadsheet, ArrowRightLeft, Copy, Check, Download, Table } from "lucide-react";
import { FormField, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_CSV = `id,name,role,city,active
1,Dara Sok,Editor,Phnom Penh,true
2,Sreymom Chan,Journalist,Siem Reap,true
3,Visal Chea,Photographer,Battambang,false
4,Bopha Kim,Designer,Kampot,true`;

export function CsvToJsonConverter() {
  const [direction, setDirection] = useState<"csv2json" | "json2csv">("csv2json");
  const [input, setInput] = useState(DEFAULT_CSV);
  const [delimiter, setDelimiter] = useState(",");
  const [parseNumbers, setParseNumbers] = useState(true);
  const [copied, setCopied] = useState(false);

  // Parse CSV to 2D Array
  const parsedTable = useMemo(() => {
    if (direction !== "csv2json" || !input.trim()) return null;
    try {
      const lines = input.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return null;

      const rows = lines.map((line) => {
        // Handle basic quoted CSV fields
        const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, "g");
        const row: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          row.push((match[1] !== undefined ? match[1] : match[2] || "").trim());
        }
        return row;
      });

      const headers = rows[0] || [];
      const dataRows = rows.slice(1);
      return { headers, dataRows };
    } catch {
      return null;
    }
  }, [input, delimiter, direction]);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (direction === "csv2json") {
        if (!parsedTable || parsedTable.headers.length === 0) return "[]";
        const jsonObjects = parsedTable.dataRows.map((row) => {
          const obj: Record<string, any> = {};
          parsedTable.headers.forEach((header, idx) => {
            let val: any = row[idx] ?? "";
            if (parseNumbers) {
              if (val.toLowerCase() === "true") val = true;
              else if (val.toLowerCase() === "false") val = false;
              else if (!isNaN(Number(val)) && val.trim() !== "") val = Number(val);
            }
            obj[header || `col_${idx}`] = val;
          });
          return obj;
        });
        return JSON.stringify(jsonObjects, null, 2);
      } else {
        // JSON to CSV
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed) || parsed.length === 0) return "Error: JSON must be an array of objects";
        const keys = Array.from(new Set(parsed.flatMap((item) => Object.keys(item))));
        const headerLine = keys.join(delimiter);
        const lines = parsed.map((item) =>
          keys
            .map((k) => {
              const val = item[k] === null || item[k] === undefined ? "" : String(item[k]);
              return val.includes(delimiter) || val.includes('"') || val.includes("\n")
                ? `"${val.replace(/"/g, '""')}"`
                : val;
            })
            .join(delimiter)
        );
        return [headerLine, ...lines].join("\n");
      }
    } catch (err: any) {
      return `Error: ${err.message || "Failed to parse data"}`;
    }
  }, [input, direction, delimiter, parseNumbers, parsedTable]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = direction === "csv2json";
    const mime = isJson ? "application/json" : "text/csv";
    const ext = isJson ? "json" : "csv";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted-data.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSwap = () => {
    setDirection(direction === "csv2json" ? "json2csv" : "csv2json");
    setInput(output.startsWith("Error:") ? "" : output);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Data Engineering & Format
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            CSV ↔ JSON & Table Data Converter
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          Two-Way Live
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={direction === "csv2json" ? "primary" : "outline"}
            size="sm"
            onClick={() => setDirection("csv2json")}
          >
            CSV → JSON
          </Button>
          <Button
            variant={direction === "json2csv" ? "primary" : "outline"}
            size="sm"
            onClick={() => setDirection("json2csv")}
          >
            JSON → CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSwap} title="Swap input and output">
            <ArrowRightLeft size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Delimiter:</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-xs"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>

          {direction === "csv2json" && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground">
              <input
                type="checkbox"
                checked={parseNumbers}
                onChange={(e) => setParseNumbers(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Parse Numbers & Booleans
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormField
          label={direction === "csv2json" ? "CSV Tabular Input" : "JSON Array Input"}
          id="csv-json-input"
        >
          <Textarea
            id="csv-json-input"
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-xs leading-relaxed"
          />
        </FormField>

        <FormField
          label={direction === "csv2json" ? "Formatted JSON Output" : "CSV Tabular Output"}
          id="csv-json-output"
        >
          <Textarea
            id="csv-json-output"
            rows={10}
            readOnly
            value={output}
            className="font-mono text-xs leading-relaxed bg-surface-muted select-all"
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!output || output.startsWith("Error:")}
          className="gap-1.5"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied output!" : "Copy Output"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!output || output.startsWith("Error:")}
          className="gap-1.5"
        >
          <Download size={14} />
          Download .{direction === "csv2json" ? "json" : "csv"}
        </Button>
      </div>

      {/* Live Table View for CSV */}
      {parsedTable && parsedTable.headers.length > 0 && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Table size={16} className="text-accent" />
            Live Table Preview ({parsedTable.dataRows.length} rows, {parsedTable.headers.length} columns)
          </h3>

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-muted sticky top-0">
                <tr>
                  {parsedTable.headers.map((h, i) => (
                    <th key={i} className="py-2 px-3 font-semibold text-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedTable.dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-surface-muted transition-colors">
                    {parsedTable.headers.map((_, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-muted-foreground tabular-nums truncate max-w-xs">
                        {row[cIdx] || ""}
                      </td>
                    ))}
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
