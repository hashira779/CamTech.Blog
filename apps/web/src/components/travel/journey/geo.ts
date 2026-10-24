import type { Destination } from "@/types";

/**
 * Geometry for the stylised maps (the discovery scene and the province directory).
 *
 * Nothing here knows where Cambodia's border is, and it does not pretend to. Marker positions
 * come only from the latitude/longitude each province record carries; the "land" is the convex
 * hull of those markers, padded and smoothed — a decorative shape derived from the data, which
 * is why the scenes print a note saying the map is stylised. A province with no recorded
 * coordinates is simply not plotted.
 */

export const MAP_W = 1000;
export const MAP_H = 820;
const PAD = 90;

export interface MapPoint {
  slug: string;
  x: number;
  y: number;
}

export function hasCoordinates(d: Pick<Destination, "latitude" | "longitude">): boolean {
  const lat = Number(d.latitude);
  const lng = Number(d.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (d.latitude == null || d.longitude == null) return false;
  return !(lat === 0 && lng === 0);
}

/** Equirectangular projection of every geocoded destination into the MAP_W × MAP_H box. */
export function projectDestinations(destinations: Destination[]): Map<string, MapPoint> {
  const geo = destinations.filter(hasCoordinates).map((d) => ({
    slug: d.slug,
    lat: Number(d.latitude),
    lng: Number(d.longitude),
  }));
  const out = new Map<string, MapPoint>();
  if (geo.length === 0) return out;

  const lats = geo.map((g) => g.lat);
  const lngs = geo.map((g) => g.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const kx = Math.cos(midLat);

  const spanX = Math.max((maxLng - minLng) * kx, 0.01);
  const spanY = Math.max(maxLat - minLat, 0.01);
  const scale = Math.min((MAP_W - PAD * 2) / spanX, (MAP_H - PAD * 2) / spanY);
  const offX = (MAP_W - spanX * scale) / 2;
  const offY = (MAP_H - spanY * scale) / 2;

  for (const g of geo) {
    out.set(g.slug, {
      slug: g.slug,
      x: offX + (g.lng - minLng) * kx * scale,
      y: offY + (maxLat - g.lat) * scale,
    });
  }
  return out;
}

type XY = [number, number];

function cross(o: XY, a: XY, b: XY) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Andrew's monotone chain. */
function convexHull(points: XY[]): XY[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const lower: XY[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: XY[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Closed Catmull-Rom spline through `pts`, as cubic Béziers. */
function smoothClosedPath(pts: XY[]): string {
  if (pts.length < 3) return "";
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

/**
 * The decorative land mass and its contour rings: the hull of the plotted markers pushed out
 * by `pad`, then the same ring shrunk toward the centroid for each contour.
 */
export function landShapes(points: MapPoint[], pad = 62, rings = 4): { land: string; contours: string[] } {
  if (points.length < 3) return { land: "", contours: [] };
  const hull = convexHull(points.map((p) => [p.x, p.y] as XY));
  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;

  const ring = (grow: number, shrink: number) =>
    smoothClosedPath(
      hull.map(([x, y]) => {
        const dx = x - cx;
        const dy = y - cy;
        const len = Math.hypot(dx, dy) || 1;
        return [cx + dx * shrink + (dx / len) * grow * shrink, cy + dy * shrink + (dy / len) * grow * shrink] as XY;
      })
    );

  const contours: string[] = [];
  for (let i = 1; i <= rings; i++) contours.push(ring(pad, 1 - i * (0.72 / (rings + 1))));
  return { land: ring(pad, 1), contours };
}

/** A gentle arc between two map points — routes read as journeys, not a ruler line. */
export function arcPath(a: MapPoint, b: MapPoint, bend = 0.18): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}
