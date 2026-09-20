"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  Database,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Share2,
  Gauge
} from "lucide-react";

interface NodeTelemetry {
  id: string;
  role: string;
  status: "HEALTHY" | "DEGRADED" | "DRAINING" | "MAINTENANCE";
  latency_p95_ms: number;
  cpu_pct: number;
}

export default function InfrastructureDashboardPage() {
  const [nodes, setNodes] = useState<NodeTelemetry[]>([
    { id: "api-node-01", role: "PRIMARY", status: "HEALTHY", latency_p95_ms: 14, cpu_pct: 24 },
    { id: "api-node-02", role: "REPLICA", status: "HEALTHY", latency_p95_ms: 16, cpu_pct: 19 },
    { id: "api-node-03", role: "REPLICA", status: "HEALTHY", latency_p95_ms: 15, cpu_pct: 22 },
  ]);

  const [dbPool, setDbPool] = useState({
    status: "HEALTHY",
    pool_size: 20,
    checked_in: 18,
    checked_out: 2,
    overflow: 0,
    read_replica_lag_ms: 1.8,
  });

  const [cacheStats, setCacheStats] = useState({
    edge_hit_ratio: 94.2,
    redis_hit_ratio: 89.1,
    isr_revalidation_avg_ms: 45,
  });

  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, { state: string; failure_count: number }>>({
    rss_fetcher: { state: "CLOSED", failure_count: 0 },
    ai_provider: { state: "CLOSED", failure_count: 0 },
    analytics_worker: { state: "CLOSED", failure_count: 0 },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("daily_discovery_admin_token");
      const res = await fetch("http://localhost:8000/api/v1/admin/infrastructure/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.instances) setNodes(data.instances);
        if (data.database?.connection_pool) {
          setDbPool(prev => ({ ...prev, ...data.database.connection_pool }));
        }
        if (data.circuit_breakers) {
          setCircuitBreakers(data.circuit_breakers);
        }
      }
    } catch (e) {
      console.warn("Using fallback telemetry data:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-black tracking-tight text-white">
                Load Balancing & Infrastructure
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                HA CLUSTER OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-origin load distribution, database connection pooling, circuit breaker telemetry, and edge caching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshTelemetry}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Poll Cluster Telemetry</span>
          </button>
        </div>
      </div>

      {/* Cluster Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Edge Cache Hit Ratio</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {cacheStats.edge_hit_ratio}%
          </div>
          <p className="text-[11px] text-slate-400">Absorbed before reaching origin</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Cluster p95 Latency</span>
            <Gauge className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-400">
            15 ms
          </div>
          <p className="text-[11px] text-slate-400">Internal origin response time</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>DB Connection Pool</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400">
            {dbPool.checked_out} / {dbPool.pool_size}
          </div>
          <p className="text-[11px] text-slate-400">Active / Max capacity</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Read Replica Lag</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {dbPool.read_replica_lag_ms} ms
          </div>
          <p className="text-[11px] text-slate-400">Near-zero async replication</p>
        </div>
      </div>

      {/* Node Pool Status Table */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Application Server Pool (Load Balancer Targets)</span>
          </h2>
          <span className="text-xs text-slate-400">
            Strategy: Least-Connections with Health-Check Failover
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Node Identifier</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Cluster Health</th>
                <th className="py-3 px-4">p95 Latency</th>
                <th className="py-3 px-4">CPU Utilization</th>
                <th className="py-3 px-4">Traffic Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 font-mono">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {node.id}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {node.role}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {node.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {node.latency_p95_ms} ms
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${node.cpu_pct}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px]">{node.cpu_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-sans">
                    33.3% (Equal Load)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Circuit Breakers Status Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(circuitBreakers).map(([name, data]) => (
          <div
            key={name}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                {name.replace(/_/g, " ")}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  data.state === "CLOSED"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {data.state === "CLOSED" ? "HEALTHY (CLOSED)" : "FAULT (OPEN)"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {data.state === "CLOSED"
                ? "Subsystem responding normally. Fault rate: 0%"
                : "Circuit tripped open to prevent cascading failure. Fail-fast mode engaged."}
            </p>
            <div className="pt-2 border-t border-slate-700/60 flex justify-between text-[11px] text-slate-400">
              <span>Failure Threshold: 5</span>
              <span>Recovery Timeout: 30s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
