"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { searchTransportRoutes, getTransportOperators, getTransportHubs } from "@/lib/api";
import { TransportRoute, TransportOperator, TransportHub } from "@/types";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { TransportOperatorCard } from "@/components/travel/TransportOperatorCard";
import { Bus, MapPin, Search, ArrowRight, ShieldCheck, Clock, Building2 } from "lucide-react";

export default function TransportPage() {
  const [origin, setOrigin] = useState("phnom-penh");
  const [destination, setDestination] = useState("siem-reap");
  const [transportType, setTransportType] = useState<string>("");
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [operators, setOperators] = useState<TransportOperator[]>([]);
  const [hubs, setHubs] = useState<TransportHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"routes" | "operators" | "hubs">("routes");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [routesRes, opsRes, hubsRes] = await Promise.all([
          searchTransportRoutes(origin, destination, transportType || undefined),
          getTransportOperators(),
          getTransportHubs()
        ]);
        setRoutes(routesRes.routes || []);
        setOperators(opsRes || []);
        setHubs(hubsRes || []);
      } catch (err) {
        console.error("Failed to load transport data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [origin, destination, transportType]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/travel" className="hover:text-primary transition-colors">Travel</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Transportation & Routes</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background border rounded-2xl p-6 sm:p-10 mb-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
            <Bus className="w-3.5 h-3.5" /> Intercity Transport Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Cambodia Transport Routes, Buses & Schedules
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
            Compare verified highway coach operators, luxury 15-seater minivans, scenic passenger trains, and high-speed island ferries with verified schedules, live pricing, and direct official booking links.
          </p>

          {/* Search Controls */}
          <div className="bg-card border rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                From (Origin)
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="phnom-penh">Phnom Penh (Capital)</option>
                <option value="siem-reap">Siem Reap (Angkor)</option>
                <option value="kampot">Kampot (Riverside)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                To (Destination)
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="siem-reap">Siem Reap (Angkor)</option>
                <option value="phnom-penh">Phnom Penh (Capital)</option>
                <option value="kampot">Kampot (Riverside)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Transport Class
              </label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Transport Types</option>
                <option value="BUS">VIP Highway Bus</option>
                <option value="MINIVAN">Executive Minivan</option>
                <option value="TRAIN">Scenic Train</option>
                <option value="FERRY">Speed Ferry</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 gap-6">
        <button
          onClick={() => setActiveTab("routes")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "routes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bus className="w-4 h-4" /> Available Routes ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab("operators")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "operators"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Transport Operators ({operators.length})
        </button>
        <button
          onClick={() => setActiveTab("hubs")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "hubs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" /> Terminals & Stations ({hubs.length})
        </button>
      </div>

      {/* Tab 1: Available Routes */}
      {activeTab === "routes" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              Comparing Routes: <span className="text-primary capitalize">{origin.replace("-", " ")}</span> to <span className="text-primary capitalize">{destination.replace("-", " ")}</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {routes.length} verified operator option{routes.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading verified route schedules...</div>
          ) : routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {routes.map((route) => (
                <TransportRouteCard key={route.id} route={route} />
              ))}
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-8 text-center max-w-md mx-auto my-8">
              <Bus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">No direct routes found</h3>
              <p className="text-xs text-muted-foreground mb-4">
                We currently don't have scheduled routes for this combination. Try searching Phnom Penh to Siem Reap.
              </p>
              <button
                onClick={() => {
                  setOrigin("phnom-penh");
                  setDestination("siem-reap");
                }}
                className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg"
              >
                Reset to Phnom Penh → Siem Reap
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Operators Directory */}
      {activeTab === "operators" && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Verified Cambodian Transport Operators</h2>
            <p className="text-xs text-muted-foreground">
              All operators are vetted for passenger safety records, modern vehicle fleets, and verified pricing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {operators.map((op) => (
              <TransportOperatorCard key={op.id} operator={op} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Terminals & Hubs */}
      {activeTab === "hubs" && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Official Bus Terminals & Transport Hubs</h2>
            <p className="text-xs text-muted-foreground">
              Boarding locations and arrival stations equipped with waiting lounges and passenger facilities.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubs.map((hub) => {
              let facilities: string[] = [];
              try {
                facilities = JSON.parse(hub.facilities_json || "[]");
              } catch {
                facilities = [];
              }
              return (
                <div key={hub.id} className="bg-card border rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {hub.hub_type.replace("_", " ")}
                  </span>
                  <h3 className="font-bold text-base mt-2 mb-1">{hub.name}</h3>
                  {hub.local_name && (
                    <p className="text-xs text-muted-foreground font-khmer mb-2">{hub.local_name}</p>
                  )}
                  {hub.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{hub.address}</span>
                    </p>
                  )}
                  {facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {facilities.slice(0, 4).map((f, i) => (
                        <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Authoritative Transport Guidelines Banner */}
      <div className="mt-12 bg-muted/40 border rounded-xl p-6">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Editorial Independence & Official Booking Policy
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Daily Discovery does not sell marked-up tickets or charge hidden booking surcharges. All timetable information is sourced directly from licensed transport operators and verified on a 30-day inspection cycle. Booking buttons link directly to the operator's official website or ticketing counter.
        </p>
      </div>
    </div>
  );
}
