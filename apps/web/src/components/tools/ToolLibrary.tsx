"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Tool } from "@/types";
import { ToolCard } from "@/components/shared/tool-card";

const groups = [
  { key: "ALL", label: "All tools" },
  { key: "CALCULATOR", label: "Calculators" },
  { key: "DEVELOPER", label: "Developer" },
  { key: "IMAGE", label: "Image & QR" },
  { key: "TEXT", label: "Writing & text" },
];

export function ToolLibrary({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return tools.filter((tool) => (group === "ALL" || tool.category === group)
      && words.every((word) => `${tool.name} ${tool.description} ${tool.name_km || ""} ${tool.slug}`.toLowerCase().includes(word)));
  }, [tools, query, group]);
  return (
    <div className="field-tool-library">
      <div className="field-tool-search"><Search size={18} aria-hidden="true" /><input type="text" role="searchbox" aria-label="Search tools" placeholder="What would you like to get done?" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear tool search"><X size={16} /></button>}</div>
      <div className="field-tool-filterbar" aria-label="Tool categories">{groups.map(({key,label}) => <button key={key} type="button" aria-pressed={group === key} onClick={() => setGroup(key)}>{label}</button>)}<span className="field-tool-results" role="status" aria-live="polite">{matches.length} {matches.length === 1 ? "tool" : "tools"}{query ? ` for “${query}”` : " to make things easier"}</span></div>
      {matches.length > 0 ? <div className="field-tool-library-grid">{matches.map((tool) => <ToolCard key={tool.id} slug={tool.slug} name={tool.name} description={tool.description} category={tool.category} />)}</div> : <div className="field-tool-empty"><h2>No tools found for that.</h2><p>Try another search or look through a different category.</p><button type="button" className="field-button" onClick={() => {setQuery("");setGroup("ALL");}}>Show all tools</button></div>}
    </div>
  );
}
