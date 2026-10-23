"use client";

import { PageHeader } from "@/components/layout/page-header";
import React, { useState, useEffect } from "react";
import { Bus, MapPin, ShieldCheck } from "lucide-react";
import { searchTransportRoutes, getTransportOperators, getTransportHubs, getDestinations } from "@/lib/api";
import { TransportRoute, TransportOperator, TransportHub, Destination } from "@/types";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { TransportOperatorCard } from "@/components/travel/TransportOperatorCard";
import { Container } from "@/components/ui/container";
import { FormField } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { humanize } from "@/lib/format";
import travelConfig from "@/data/travel_config.json";

export default function TransportPage() {
  const [origin, setOrigin] = useState("phnom-penh");
  const [destination, setDestination] = useState("siem-reap");
  const [transportType, setTransportType] = useState<string>("");
  const [destinationsList, setDestinationsList] = useState<Destination[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [operators, setOperators] = useState<TransportOperator[]>([]);
  const [hubs, setHubs] = useState<TransportHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"routes" | "operators" | "hubs">("routes");

  useEffect(() => {
    getDestinations().then((dests) => {
      if (dests && dests.length > 0) {
        setDestinationsList(dests);
      }
    });
  }, []);

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

  const labelFor = (slug: string) => destinationsList.find((d) => d.slug === slug)?.name || humanize(slug);

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        breadcrumbs={[{ label: "Travel", href: "/travel" }, { label: "Transport" }]}
        category="transport"
        eyebrow="Transport"
        title="Getting between the provinces"
        description="Coach, minivan, train and ferry services held in the CamTech.Blog registry, with the departure times, durations and fares each record carries."
      />

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <Container className="pb-10 pt-8">
        <div className="max-w-4xl rounded-lg border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="From" id="transport-origin">
              <Select id="transport-origin" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                {destinationsList.length > 0 ? (
                  destinationsList.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} {d.name_km ? `(${d.name_km})` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="phnom-penh">Phnom Penh</option>
                    <option value="siem-reap">Siem Reap</option>
                    <option value="kampot">Kampot</option>
                  </>
                )}
              </Select>
            </FormField>

            <FormField label="To" id="transport-destination">
              <Select
                id="transport-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {destinationsList.length > 0 ? (
                  destinationsList.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} {d.name_km ? `(${d.name_km})` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="siem-reap">Siem Reap</option>
                    <option value="phnom-penh">Phnom Penh</option>
                    <option value="kampot">Kampot</option>
                  </>
                )}
              </Select>
            </FormField>

            <FormField label="Vehicle class" id="transport-type">
              <Select
                id="transport-type"
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
              >
                {travelConfig.transport_classes.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </Container>

      {/* ── Directory ────────────────────────────────────────────────────── */}
      <Container as="section" className="border-t border-border pb-14">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "routes" | "operators" | "hubs")}
          className="mt-8"
        >
          <TabsList>
            <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
            <TabsTrigger value="operators">Operators ({operators.length})</TabsTrigger>
            <TabsTrigger value="hubs">Terminals ({hubs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                {labelFor(origin)} <span className="text-muted-foreground">to</span> {labelFor(destination)}
              </h2>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Loading routes"
                  : `${routes.length} service${routes.length === 1 ? "" : "s"} on record`}
              </p>
            </div>

            {loading ? (
              <p className="py-12 text-sm text-muted-foreground">Loading routes…</p>
            ) : routes.length > 0 ? (
              <div className="mt-6">
                {routes.map((route) => (
                  <TransportRouteCard key={route.id} route={route} />
                ))}
              </div>
            ) : (
              <div className="mt-6 max-w-xl border-t border-border py-10">
                <Bus size={20} className="text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-3 font-display text-lg leading-snug text-foreground">
                  No {transportType ? transportType.toLowerCase() : "scheduled"} service recorded for this pair
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We publish only routes the registry holds. Try the Phnom Penh to Siem Reap corridor, or widen
                  the vehicle class.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOrigin("phnom-penh");
                    setDestination("siem-reap");
                  }}
                >
                  Search Phnom Penh to Siem Reap
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="operators" className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                Operator directory
              </h2>
              <p className="text-xs text-muted-foreground">{operators.length} operators on record</p>
            </div>

            {loading ? (
              <p className="py-12 text-sm text-muted-foreground">Loading operators…</p>
            ) : operators.length > 0 ? (
              <div className="mt-6">
                {operators.map((op) => (
                  <TransportOperatorCard key={op.id} operator={op} />
                ))}
              </div>
            ) : (
              <p className="border-t border-border py-10 text-sm text-muted-foreground">
                No operators are published yet.
              </p>
            )}
          </TabsContent>

          <TabsContent value="hubs" className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                Terminals &amp; stations
              </h2>
              <p className="text-xs text-muted-foreground">{hubs.length} locations on record</p>
            </div>

            {loading ? (
              <p className="py-12 text-sm text-muted-foreground">Loading terminals…</p>
            ) : hubs.length > 0 ? (
              <ul className="mt-6 divide-y divide-border border-t border-border">
                {hubs.map((hub) => {
                  let facilities: string[] = [];
                  try {
                    facilities = JSON.parse(hub.facilities_json || "[]");
                  } catch {
                    facilities = [];
                  }
                  return (
                    <li key={hub.id} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-4">
                      <div className="sm:col-span-5">
                        <span className="section-label">{hub.hub_type?.replace(/_/g, " ")}</span>
                        <h3 className="mt-1.5 font-display text-lg leading-snug tracking-tight text-foreground">
                          {hub.name}
                        </h3>
                        {hub.local_name && <p className="text-sm text-muted-foreground">{hub.local_name}</p>}
                      </div>

                      <div className="sm:col-span-7">
                        {hub.address ? (
                          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                            {hub.address}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Address not on record</p>
                        )}
                        {hub.phone && (
                          <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">
                            <span className="section-label mr-2">Phone</span>
                            {hub.phone}
                          </p>
                        )}
                        {facilities.length > 0 && (
                          <p className="mt-2 text-sm text-muted-foreground">{facilities.join(" · ")}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="border-t border-border py-10 text-sm text-muted-foreground">
                No terminals are published yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </Container>

      {/* ── Booking policy ───────────────────────────────────────────────── */}
      <Container className="pb-14">
        <aside className="rounded-lg border border-border bg-surface-muted p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck size={16} className="text-accent" aria-hidden="true" />
            Booking policy
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            CamTech.Blog does not sell tickets and adds no booking fee. Departure times, durations and fares are
            the values stored in each route record, and every route carries the date it was last checked; a
            missing fare is shown as missing rather than estimated. Booking links go to the operator&rsquo;s own
            website.
          </p>
        </aside>
      </Container>
    </div>
  );
}
