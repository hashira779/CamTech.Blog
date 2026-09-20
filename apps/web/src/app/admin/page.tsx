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
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={handleTriggerIngestion}
        isLoading={fetchingSources}
        className="gap-1.5"
      >
        <RefreshCw size={13} className={fetchingSources ? "animate-spin" : ""} />
        {fetchingSources ? "Ingesting..." : "Run Source Ingestion"}
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/security" className="gap-1.5">
          <ShieldAlert size={13} />
          Security
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/infrastructure" className="gap-1.5">
          <RefreshCw size={13} />
          Infrastructure
        </Link>
      </Button>
    </div>
  );

  return (
    <AdminShell
      title="Daily Discovery Editorial & CMS"
      description="Quality Gate verification, RSS source ingestion, and human-in-the-loop review."
      actions={actions}
    >
      <div className="space-y-6">
        {ingestionMessage && (
          <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{ingestionMessage}</span>
          </div>
        )}

        {/* KPI Metrics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Articles</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.metrics.total_articles}</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">Published</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.metrics.published_articles}</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">Pending Review</span>
              <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.metrics.pending_reviews}</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">Pageviews</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.metrics.total_pageviews.toLocaleString()}</span>
            </Card>

            <Card className="p-4 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">Active Sources</span>
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.metrics.active_sources}</span>
            </Card>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("review")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "review"
                ? "bg-teal-700 text-white dark:bg-teal-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Review Workspace
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "stats"
                ? "bg-teal-700 text-white dark:bg-teal-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Platform Telemetry
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "review" ? (
          <EditorialReviewWorkspace />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                Top Read Stories
              </h3>
              <div className="space-y-2">
                {stats?.top_stories.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                      {s.title}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{s.views} views</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                Recent Ingestion Logs
              </h3>
              <div className="space-y-2">
                {stats?.latest_ingestion_logs.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <span className="font-mono text-[11px] text-slate-500">{l.at.substring(0, 16)}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                      {l.status} (+{l.ingested} items)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
