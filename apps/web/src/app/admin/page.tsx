"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  BarChart3,
  FileText,
  Clock,
  RefreshCw,
  Rss,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wrench,
  BookOpen
} from "lucide-react";
import { EditorialReviewWorkspace } from "@/components/admin/EditorialReviewWorkspace";

interface DashboardStats {
  metrics: {
    total_articles: number;
    published_articles: number;
    pending_reviews: number;
    total_discoveries: number;
    total_quizzes: number;
    total_tools: number;
    total_sources: number;
    active_sources: number;
    total_pageviews: number;
    total_shares: number;
  };
  top_stories: Array<{ id: string; title: string; views: number; country: string }>;
  latest_ingestion_logs: Array<{ source_id: string; status: string; found: number; ingested: number; at: string }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<"review" | "stats">("review");
  const [fetchingSources, setFetchingSources] = useState(false);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerIngestion = async () => {
    setFetchingSources(true);
    setIngestionMessage("Contacting verified RSS source feeds...");
    try {
      const sourcesRes = await fetch("http://localhost:8000/api/v1/sources");
      if (sourcesRes.ok) {
        const sources = await sourcesRes.json();
        const activeSources = sources.filter((s: any) => s.feed_url && s.is_active);
        let totalIngested = 0;
        
        for (const s of activeSources) {
          const runRes = await fetch(`http://localhost:8000/api/v1/sources/${s.id}/fetch`, { method: "POST" });
          if (runRes.ok) {
            const runData = await runRes.json();
            totalIngested += runData.items_ingested;
          }
        }
        setIngestionMessage(`Ingestion finished: ${totalIngested} new items queued for review.`);
        fetchStats();
      }
    } catch (err: any) {
      setIngestionMessage(`Ingestion notice: ${err.message}`);
    } finally {
      setFetchingSources(false);
      setTimeout(() => setIngestionMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Daily Discovery CMS & Editorial Board
            </h1>
            <p className="text-xs text-neutral-400">
              Granular Quality Gate verification, RSS source ingestion, and human-in-the-loop review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerIngestion}
            disabled={fetchingSources}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-bold transition-all disabled:opacity-50 shadow"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fetchingSources ? "animate-spin" : ""}`} />
            {fetchingSources ? "Ingesting Feeds..." : "Run Source Ingestion"}
          </button>
        </div>
      </div>

      {ingestionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{ingestionMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Total Articles</span>
            <span className="text-2xl font-black text-neutral-900 dark:text-white">{stats.metrics.total_articles}</span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">Published</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.metrics.published_articles}</span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Pending Review</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.metrics.pending_reviews}</span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Total Pageviews</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.metrics.total_pageviews.toLocaleString()}</span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Active Sources</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.metrics.active_sources}</span>
          </div>
        </div>
      )}

      {/* Tabs & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "review"
                ? "bg-rose-600 text-white shadow"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            3-Column Review Workspace
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "stats"
                ? "bg-rose-600 text-white shadow"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Platform Analytics & Telemetry
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/security"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security Dashboard</span>
          </Link>
          <Link
            href="/admin/infrastructure"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>HA Infrastructure</span>
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "review" ? (
        <EditorialReviewWorkspace />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
              Top Read Stories
            </h3>
            <div className="space-y-3">
              {stats?.top_stories.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-xs">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[280px]">
                    {s.title}
                  </span>
                  <span className="font-mono text-neutral-500 font-bold">{s.views} views</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
              Recent Ingestion Logs
            </h3>
            <div className="space-y-3">
              {stats?.latest_ingestion_logs.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-xs">
                  <span className="font-mono text-[11px] text-neutral-500">{l.at.substring(0, 16)}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    {l.status} (+{l.ingested} items)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
