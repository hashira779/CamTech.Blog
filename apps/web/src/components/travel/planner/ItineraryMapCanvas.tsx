"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { dayColor } from "./day-colors";

export interface RouteStop {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  order: number;
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** The planner's route map: numbered stops per day joined by straight, dashed lines. */
export default function ItineraryMapCanvas({ stops }: { stops: RouteStop[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!elRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.setView([12.6, 104.9], 7);
    map.on("click focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const byDay = new Map<number, RouteStop[]>();
    for (const s of stops) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s]);
    for (const [day, list] of byDay) {
      const color = dayColor(day);
      const sorted = [...list].sort((a, b) => a.order - b.order);
      if (sorted.length > 1) {
        L.polyline(
          sorted.map((s) => [s.lat, s.lng] as [number, number]),
          { color, weight: 3, opacity: 0.8, dashArray: "6 8" }
        ).addTo(layer);
      }
      for (const s of sorted) {
        const marker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            className: "it-pin",
            html: `<span style="background:${color}">${day + 1}.${s.order + 1}</span>`,
            iconSize: [34, 22],
            iconAnchor: [17, 11],
          }),
          title: s.name,
          keyboard: false,
        });
        marker.bindTooltip(s.name, { direction: "top", offset: [0, -10], className: "cm-tip" });
        marker.addTo(layer);
      }
    }
    if (stops.length > 0) {
      map.fitBounds(L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number])), { padding: [36, 36], maxZoom: 13 });
    }
  }, [stops]);

  return <div ref={elRef} className="h-full w-full" />;
}
