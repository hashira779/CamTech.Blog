/**
 * Hand-built SVG geometry for the hero illustration — Angkor Wat's five lotus-bud towers, the
 * stepped galleries, sugar palms. It is drawn, not photographed, and labelled as an
 * illustration: the only verified Angkor photograph in the project is 330px wide, which would
 * fall apart as a full-screen cover.
 *
 * Everything is generated from a few numbers, so the silhouette stays crisp at any size and
 * costs a few kilobytes of markup instead of a megabyte of JPEG.
 */

type XY = [number, number];

const pts = (list: XY[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** A stepped lotus-bud tower: a straight shaft, then tiers narrowing to a finial. */
export function towerPoints(cx: number, baseY: number, topY: number, hw: number): string {
  const H = baseY - topY;
  const shaftTop = baseY - H * 0.2;
  const coneH = H * 0.74;
  const tiers = 8;
  const left: XY[] = [
    [cx - hw * 1.12, baseY],
    [cx - hw * 1.12, baseY - H * 0.04],
    [cx - hw, baseY - H * 0.05],
    [cx - hw, shaftTop],
  ];
  let prev = hw;
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = shaftTop - coneH * t;
    const step = coneH / tiers;
    // A slight bulge in the lower third gives the bud its swell.
    const w = hw * Math.pow(1 - t, 0.68) * (1 + 0.14 * Math.sin(Math.PI * Math.min(t * 1.6, 1)));
    left.push([cx - prev * 1.06, y + step * 0.82]);
    left.push([cx - prev * 1.06, y + step * 0.62]);
    left.push([cx - Math.max(w, 1.2), y]);
    prev = Math.max(w, 1.2);
  }
  left.push([cx - 1.4, topY + H * 0.03]);
  left.push([cx, topY]);
  const right = left
    .slice(0, -1)
    .reverse()
    .map(([x, y]) => [cx + (cx - x), y] as XY);
  return pts([...left, ...right]);
}

/** The terraced temple body: three stepped galleries and the long outer enclosure. */
export function templeBodyPoints(cx: number, groundY: number, s: number): string {
  const w = (n: number) => n * s;
  const L: XY[] = [
    [cx - w(560), groundY],
    [cx - w(560), groundY - w(18)],
    [cx - w(520), groundY - w(18)],
    [cx - w(520), groundY - w(30)],
    // outer gopura
    [cx - w(470), groundY - w(30)],
    [cx - w(470), groundY - w(44)],
    [cx - w(455), groundY - w(52)],
    [cx - w(440), groundY - w(44)],
    [cx - w(440), groundY - w(30)],
    [cx - w(330), groundY - w(30)],
    // third gallery
    [cx - w(330), groundY - w(62)],
    [cx - w(250), groundY - w(62)],
    [cx - w(250), groundY - w(78)],
    // second gallery
    [cx - w(225), groundY - w(78)],
    [cx - w(225), groundY - w(112)],
    [cx - w(170), groundY - w(112)],
    [cx - w(170), groundY - w(126)],
    // upper terrace
    [cx - w(150), groundY - w(126)],
    [cx - w(150), groundY - w(160)],
    [cx - w(40), groundY - w(160)],
    [cx - w(40), groundY - w(170)],
    [cx, groundY - w(170)],
  ];
  const R = L.slice(0, -1)
    .reverse()
    .map(([x, y]) => [cx + (cx - x), y] as XY);
  return pts([...L, ...R]);
}

/** Five towers: quincunx seen from the west, so the corner pairs read as four. */
export function templeTowers(cx: number, groundY: number, s: number) {
  const top = groundY - 160 * s;
  return [
    { x: cx - 128 * s, base: top + 4 * s, top: top - 120 * s, hw: 17 * s },
    { x: cx + 128 * s, base: top + 4 * s, top: top - 120 * s, hw: 17 * s },
    { x: cx - 66 * s, base: top + 2 * s, top: top - 150 * s, hw: 19 * s },
    { x: cx + 66 * s, base: top + 2 * s, top: top - 150 * s, hw: 19 * s },
    { x: cx, base: top - 8 * s, top: top - 215 * s, hw: 24 * s },
  ];
}

/** A sugar palm (thnot), Cambodia's national tree: a tall bare trunk and a round crown. */
export function sugarPalm(x: number, groundY: number, height: number, lean = 0, seed = 1) {
  const topX = x + lean;
  const topY = groundY - height;
  const trunk = `M${x - 4},${groundY} C${x - 3},${groundY - height * 0.5} ${topX - 3},${topY + height * 0.25} ${topX - 1.6},${topY} L${topX + 1.6},${topY} C${topX + 3},${topY + height * 0.25} ${x + 3},${groundY - height * 0.5} ${x + 4},${groundY} Z`;
  const fronds: string[] = [];
  const count = 22;
  const r = height * 0.16;
  for (let i = 0; i < count; i++) {
    const jitter = Math.sin(i * 12.9898 + seed * 78.233) * 0.12;
    const a = -Math.PI + (i / (count - 1)) * Math.PI * 1.15 - 0.08 + jitter;
    const len = r * (0.75 + 0.35 * Math.abs(Math.sin(i * 1.7 + seed)));
    const droop = Math.max(0, Math.sin(a + Math.PI)) * 0 + (Math.cos(a) * 0.15 + 0.25) * len;
    const tx = topX + Math.cos(a) * len;
    const ty = topY + Math.sin(a) * len * 0.82 + droop * 0.5;
    const nx = -Math.sin(a) * len * 0.12;
    const ny = Math.cos(a) * len * 0.12;
    const mx = topX + Math.cos(a) * len * 0.55;
    const my = topY + Math.sin(a) * len * 0.5;
    fronds.push(
      `M${topX},${topY} Q${(mx + nx).toFixed(1)},${(my + ny).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)} Q${(mx - nx).toFixed(1)},${(my - ny).toFixed(1)} ${topX},${topY} Z`
    );
  }
  return { trunk, fronds: fronds.join(" ") };
}

/** A low, uneven tree line for the far distance. */
export function treeLine(y: number, width: number, amp: number, seed: number, step = 26): string {
  let d = `M0,${y + amp * 2}`;
  for (let x = 0; x <= width; x += step) {
    const h = amp * (0.55 + 0.45 * Math.sin(x * 0.013 + seed) * Math.sin(x * 0.041 + seed * 2.3));
    d += ` Q${x + step / 2},${(y - h * 1.25).toFixed(1)} ${x + step},${(y - h * 0.6).toFixed(1)}`;
  }
  return `${d} L${width},${y + amp * 6} L0,${y + amp * 6} Z`;
}
