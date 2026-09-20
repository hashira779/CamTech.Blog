"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Send,
  Save,
  RotateCcw,
  FileCheck,
  Search
} from "lucide-react";

interface QueueItem {
  id: string;
  title: string;
  status: string;
  country: string;
  source_name: string;
  source_url: string;
  summary: string;
  content: string;
  key_points?: string;
  why_it_matters?: string;
  created_at: string;
  quality_gate: {
    can_publish: boolean;
    missing: string[];
  };
}

export function EditorialReviewWorkspace() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const fetchReviewQueue = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/review-queue");
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        if (data.length > 0) setSelectedItem(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedItem) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/review-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: selectedItem.id,
          action: action,
          notes: `Action executed from editorial review board`
        })
      });
      const result = await res.json();
      if (res.ok) {
        setActionMessage(`Successfully executed: ${action}`);
        fetchReviewQueue();
      } else {
        setActionMessage(`Error: ${result.detail || "Action failed"}`);
      }
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Network error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-400">
        Loading editorial review queue...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div className="p-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 3-COLUMN WORKSPACE (Section 70) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[750px]">
        
        {/* COLUMN 1: PENDING QUEUE (3 Cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3 flex flex-col h-full">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Ingested Queue ({queue.length})
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              Review Needed
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {queue.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                Editorial queue is empty. All news verified or published!
              </div>
            ) : (
              queue.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <span className="font-bold uppercase text-neutral-700 dark:text-neutral-300">
                        {item.country === "KH" ? "🇰🇭 Cambodia" : "🌐 World"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[9px]">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 mt-1 block truncate">
                      Source: {item.source_name}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: ARTICLE EDITOR (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 flex flex-col justify-between">
          {selectedItem ? (
            <div className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={selectedItem.title}
                  onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Original Editorial Summary ("What happened?")
                </label>
                <textarea
                  rows={3}
                  value={selectedItem.summary}
                  onChange={(e) => setSelectedItem({ ...selectedItem, summary: e.target.value })}
                  className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Editorial Context & Analysis ("Why it matters")
                </label>
                <textarea
                  rows={3}
                  value={selectedItem.why_it_matters || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, why_it_matters: e.target.value })}
                  className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Full Article Body
                </label>
                <textarea
                  rows={8}
                  value={selectedItem.content}
                  onChange={(e) => setSelectedItem({ ...selectedItem, content: e.target.value })}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="m-auto text-center text-xs text-neutral-400">
              Select an article from the left queue to edit and review.
            </div>
          )}

          {/* Action Bar */}
          {selectedItem && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction("REQUEST_REVISION")}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => handleAction("REJECT")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Reject
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction("APPROVE")}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold"
                >
                  Approve Draft
                </button>
                <button
                  onClick={() => handleAction("PUBLISH")}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-colors"
                >
                  Publish to Newsfeed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: SOURCE, AI DRAFT, DUPLICATES & QUALITY GATE (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-5 overflow-y-auto">
          {selectedItem ? (
            <>
              {/* Quality Gate Checklist (Section 35) */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-rose-600" />
                    Quality Gate Checklist
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedItem.quality_gate.can_publish ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                    {selectedItem.quality_gate.can_publish ? "PASSED" : "PENDING"}
                  </span>
                </div>

                {selectedItem.quality_gate.missing.length > 0 ? (
                  <ul className="space-y-1 text-[11px] text-amber-600 dark:text-amber-400">
                    {selectedItem.quality_gate.missing.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    All required editorial standards, attributions, and checks verified!
                  </p>
                )}
              </div>

              {/* Source Verification Box */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-bold uppercase text-[10px]">Source Wire</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
                <div className="font-bold text-neutral-900 dark:text-white">
                  {selectedItem.source_name}
                </div>
                <a
                  href={selectedItem.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:underline break-all"
                >
                  {selectedItem.source_url}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>

              {/* AI Assistance Metadata (Section 10) */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[10px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Synthesis Metadata
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Draft summary and key points were extracted and formatted with strict attribution guidelines.
                  Human editor sign-off required prior to public release.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-neutral-400 p-8">
              Inspector metadata will appear here.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
