"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPlacePoint {
  slug: string;
  name: string;
  place_type: string;
  latitude: number;
  longitude: number;
}

interface ProvinceMapCanvasProps {
  places: MapPlacePoint[];
  centerLat?: number;
  centerLng?: number;
  focusSlug?: string | null;
  focusNonce?: number;
}

// OpenStreetMap's own raster tiles: open data, no API key, no billing account.
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: "pd-pin",
    html: '<span class="pd-pin__dot"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function popupHtml(place: MapPlacePoint): string {
  const href = `/travel/place/${encodeURIComponent(place.slug)}`;
  return (
    `<div class="pd-pop">` +
    `<span class="pd-pop__type">${escapeHtml(place.place_type.replace(/_/g, " "))}</span>` +
    `<a class="pd-pop__name" href="${href}">${escapeHtml(place.name)}</a>` +
    `<span class="pd-pop__coord">${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}</span>` +
    `<a class="pd-pop__cta" href="${href}">Open place page</a>` +
    `</div>`
  );
}

const MAP_CSS = `
.pd-map { background: #f4f4f5; }
.pd-pin { background: transparent; border: none; }
.pd-pin__dot {
  display: block; width: 16px; height: 16px; border-radius: 9999px;
  background: #059669; border: 2px solid #ffffff;
  box-shadow: 0 1px 6px rgba(0,0,0,.35);
}
.pd-pin__dot:hover { transform: scale(1.2); }
.leaflet-container { font: inherit; }
.leaflet-popup-content-wrapper { border-radius: 14px; }
.leaflet-popup-content { margin: 12px 14px; }
.pd-pop { display: flex; flex-direction: column; gap: 3px; min-width: 168px; }
.pd-pop__type { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #71717a; }
.pd-pop__name { font-size: 14px; font-weight: 700; color: #18181b; text-decoration: none; }
.pd-pop__name:hover { text-decoration: underline; }
.pd-pop__coord { font-size: 11px; color: #52525b; font-variant-numeric: tabular-nums; }
.pd-pop__cta { margin-top: 4px; font-size: 12px; font-weight: 600; color: #047857; text-decoration: none; }
.pd-pop__cta:hover { text-decoration: underline; }
.dark .pd-pop__name { color: #fafafa; }
.dark .leaflet-popup-content-wrapper, .dark .leaflet-popup-tip { background: #18181b; color: #fafafa; }
`;

export default function ProvinceMapCanvas({
  places,
  centerLat,
  centerLng,
  focusSlug,
  focusNonce,
}: ProvinceMapCanvasProps) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // 1. Create the map once. Leaflet touches `window` on import, so this component is
  //    always loaded through next/dynamic with ssr:false.
  useEffect(() => {
    if (!holderRef.current || mapRef.current) return;
    const instance = L.map(holderRef.current, {
      center: [11.55, 104.9],
      zoom: 8,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(instance);
    mapRef.current = instance;

    const onResize = () => instance.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // 2. Markers follow the data, never a hardcoded list.
  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    places.forEach((place) => {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: pinIcon(),
        title: place.name,
        alt: place.name,
        keyboard: false,
      }).addTo(instance);
      marker.bindPopup(popupHtml(place), { maxWidth: 280 });
      markersRef.current[place.slug] = marker;
    });

    if (places.length > 1) {
      instance.fitBounds(
        L.latLngBounds(places.map((p) => [p.latitude, p.longitude] as [number, number])).pad(0.25),
      );
    } else if (places.length === 1) {
      instance.setView([places[0].latitude, places[0].longitude], 12);
    } else if (typeof centerLat === "number" && typeof centerLng === "number") {
      instance.setView([centerLat, centerLng], 10);
    }

    // The container is often still laying out on first paint; Leaflet needs a nudge.
    const settle = window.setTimeout(() => instance.invalidateSize(), 80);
    return () => window.clearTimeout(settle);
  }, [places, centerLat, centerLng]);

  // 3. The companion list drives the camera.
  useEffect(() => {
    const instance = mapRef.current;
    if (!instance || !focusSlug) return;
    const marker = markersRef.current[focusSlug];
    if (!marker) return;

    instance.flyTo(marker.getLatLng(), Math.max(instance.getZoom(), 13), { duration: 0.7 });
    const open = window.setTimeout(() => marker.openPopup(), 750);
    return () => window.clearTimeout(open);
  }, [focusSlug, focusNonce]);

  return (
    <div className="relative h-full w-full">
      <style>{MAP_CSS}</style>
      <div ref={holderRef} className="pd-map h-full w-full" />
    </div>
  );
}
