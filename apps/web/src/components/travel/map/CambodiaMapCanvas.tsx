"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  key: string;
  kind: "province" | "place";
  name: string;
  lat: number;
  lng: number;
  dim?: boolean;
}

interface Props {
  points: MapPoint[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Bumped to fit the whole country again. */
  resetNonce: number;
  onTilesFailed: () => void;
  labels: { zoomIn: string; zoomOut: string };
}

// OpenStreetMap's own raster tiles — the same source the province pages already use.
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Cambodia's extent with a margin, used for the national view and to keep panning nearby.
const COUNTRY_BOUNDS = L.latLngBounds([9.6, 102.2], [14.8, 107.8]);

function icon(p: MapPoint, selected: boolean): L.DivIcon {
  const size = p.kind === "province" ? 18 : 12;
  return L.divIcon({
    className: `cm-marker cm-${p.kind}${selected ? " is-selected" : ""}${p.dim ? " is-dim" : ""}`,
    html: '<span class="cm-dot"></span>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * The Leaflet canvas. Kept separate so `next/dynamic` can load it only in the browser (Leaflet
 * touches `window` on import) and only when the map section is near the viewport.
 *
 * Page scrolling is never captured: the wheel zooms only after the map has been clicked or
 * focused, and on touch screens one finger scrolls the page while two fingers zoom.
 */
export default function CambodiaMapCanvas({ points, selectedKey, onSelect, resetNonce, onTilesFailed, labels }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const failedRef = useRef(onTilesFailed);

  useEffect(() => {
    onSelectRef.current = onSelect;
    failedRef.current = onTilesFailed;
  }, [onSelect, onTilesFailed]);

  // Create the map once.
  useEffect(() => {
    if (!elRef.current) return;
    const touch = L.Browser.mobile || L.Browser.touch;
    const map = L.map(elRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
      tapTolerance: 15,
      maxBounds: COUNTRY_BOUNDS.pad(0.6),
      minZoom: 6,
      maxZoom: 16,
      attributionControl: true,
    });
    map.fitBounds(COUNTRY_BOUNDS, { padding: [10, 10] });
    L.control.zoom({ position: "topright", zoomInTitle: labels.zoomIn, zoomOutTitle: labels.zoomOut }).addTo(map);

    let loaded = 0;
    let errors = 0;
    const tiles = L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 });
    tiles.on("tileload", () => loaded++);
    tiles.on("tileerror", () => {
      errors++;
      if (errors >= 6 && loaded === 0) failedRef.current();
    });
    tiles.addTo(map);

    const enableWheel = () => map.scrollWheelZoom.enable();
    const disableWheel = () => map.scrollWheelZoom.disable();
    map.on("click focus", enableWheel);
    map.on("blur", disableWheel);
    elRef.current.addEventListener("mouseleave", disableWheel);
    if (touch) map.touchZoom.enable();

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const el = elRef.current;
    const markers = markersRef.current;
    return () => {
      el.removeEventListener("mouseleave", disableWheel);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
    };
    // labels only affect the control titles at creation time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)draw markers when the point set or selection changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    // Provinces on top of attractions; the selected marker above everything.
    const ordered = [...points].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "place" ? -1 : 1));
    for (const p of ordered) {
      const selected = p.key === selectedKey;
      const marker = L.marker([p.lat, p.lng], {
        icon: icon(p, selected),
        keyboard: true,
        title: p.name,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : p.kind === "province" ? 100 : 0,
      });
      // Leaflet turns Enter on a focused keyboard marker into this same click.
      marker.on("click", () => onSelectRef.current(p.key));
      marker.bindTooltip(p.name, { direction: "top", offset: [0, -8], permanent: selected, className: "cm-tip" });
      marker.addTo(layer);
      const el = marker.getElement();
      if (el) {
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", p.name);
        el.setAttribute("aria-pressed", selected ? "true" : "false");
      }
      markersRef.current.set(p.key, marker);
    }
  }, [points, selectedKey]);

  // Fly to the selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedKey) return;
    const p = points.find((x) => x.key === selectedKey);
    if (!p) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const zoom = Math.max(map.getZoom(), p.kind === "province" ? 9 : 12);
    if (reduce) map.setView([p.lat, p.lng], zoom);
    else map.flyTo([p.lat, p.lng], zoom, { duration: 0.8 });
    // Only on a new selection, not when markers re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  // Back to the national view.
  useEffect(() => {
    if (resetNonce === 0) return;
    mapRef.current?.fitBounds(COUNTRY_BOUNDS, { padding: [10, 10] });
  }, [resetNonce]);

  return <div ref={elRef} className="h-full w-full" />;
}
