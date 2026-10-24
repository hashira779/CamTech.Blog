/* Procedural Khmer ornament & ceremony objects (three.js meshes).

   Everything here is real geometry built in code: lathed (turned) vessels,
   extruded and bevelled outlines, tube geometry and instanced florets.
   There is no Blender/GLB pipeline in this project, so forms are authored
   from profiles and outlines; materials are physically based and lit by an
   image-based environment in engine.ts.

   Motifs follow documented Khmer decorative vocabulary in simplified form:
   the kbach phni tes (flame-leaf) used in ring borders, the multi-tier lotus,
   and the objects each rite in the ceremony text names (fruit trays, the
   leaf-shaped popil candle holder, red cotton thread, areca-palm florets). */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type CeremonyKind = "procession" | "blessing" | "haircut" | "popil" | "sampeah" | "chongdai" | "petals";

/* ─── Materials ─────────────────────────────────────────────────────────── */

export interface KhmerMaterials {
  gold: THREE.MeshPhysicalMaterial;
  champagne: THREE.MeshPhysicalMaterial;
  silver: THREE.MeshPhysicalMaterial;
  steel: THREE.MeshPhysicalMaterial;
  lacquer: THREE.MeshPhysicalMaterial;
  plinth: THREE.MeshPhysicalMaterial;
  redThread: THREE.MeshPhysicalMaterial;
  wax: THREE.MeshPhysicalMaterial;
  flame: THREE.MeshBasicMaterial;
  fruit: THREE.MeshPhysicalMaterial;
  fruitAlt: THREE.MeshPhysicalMaterial;
  leaf: THREE.MeshPhysicalMaterial;
  floret: THREE.MeshPhysicalMaterial;
  lotusPetal: THREE.MeshPhysicalMaterial;
}

/* A faint brushed-metal / paper-fibre height map, generated once, so metal
   and lacquer surfaces aren't mirror-smooth plastic */
function makeGrainTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const v = 110 + Math.floor(rnd() * 40);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 18, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function createMaterials(accent: THREE.ColorRepresentation): KhmerMaterials {
  const grain = makeGrainTexture();
  const metal = (color: THREE.ColorRepresentation, roughness: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
    new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, roughnessMap: grain, bumpMap: grain, bumpScale: 0.6, ...extra });
  return {
    // Old gold, not yellow plastic: warm, slightly brushed, soft highlights
    gold: metal("#e2b45c", 0.27, { clearcoat: 0.2, clearcoatRoughness: 0.35 }),
    champagne: metal("#e7cf9f", 0.38),
    silver: metal("#d8d6d0", 0.26),
    steel: metal("#b9bcc0", 0.2),
    lacquer: new THREE.MeshPhysicalMaterial({ color: accent, metalness: 0, roughness: 0.35, clearcoat: 0.9, clearcoatRoughness: 0.18, bumpMap: grain, bumpScale: 0.15 }),
    // Plinth: carved ivory stone/plaster tone so the gold reads against it
    plinth: new THREE.MeshPhysicalMaterial({ color: "#efe4cf", metalness: 0, roughness: 0.78, bumpMap: grain, bumpScale: 0.8 }),
    // Cotton thread: matte with a soft sheen along the fibres
    redThread: new THREE.MeshPhysicalMaterial({ color: "#8f0f19", metalness: 0, roughness: 0.62, sheen: 1, sheenColor: new THREE.Color("#ff6b6b"), sheenRoughness: 0.45 }),
    wax: new THREE.MeshPhysicalMaterial({ color: "#f6ecd6", metalness: 0, roughness: 0.55, transmission: 0.08, thickness: 0.4 }),
    flame: new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0.95 }),
    fruit: new THREE.MeshPhysicalMaterial({ color: "#c95f12", metalness: 0, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.4, bumpMap: grain, bumpScale: 2 }),
    fruitAlt: new THREE.MeshPhysicalMaterial({ color: "#7d8f24", metalness: 0, roughness: 0.45, clearcoat: 0.35, bumpMap: grain, bumpScale: 1.8 }),
    leaf: new THREE.MeshPhysicalMaterial({ color: "#2f5a26", metalness: 0, roughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color("#9cc28a"), side: THREE.DoubleSide }),
    floret: new THREE.MeshPhysicalMaterial({ color: "#eedfae", metalness: 0, roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color("#fff8e6") }),
    lotusPetal: metal("#e2c27e", 0.34, { side: THREE.DoubleSide }),
  };
}

/* ─── Shared helpers ────────────────────────────────────────────────────── */

const lathe = (pts: [number, number][], segments = 64) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments);

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadows = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/* Deterministic pseudo-random (no Math.random: every render is identical) */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/* ─── Kbach phni tes: the flame-leaf ────────────────────────────────────── */

/* Outline of one flame-leaf: a full lower lobe that narrows and curls into a
   flame tip leaning to one side, the basic unit of Khmer kbach borders */
function flameLeafShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.22, 0.05, -0.3, 0.32, -0.16, 0.55);
  s.bezierCurveTo(-0.06, 0.72, 0.05, 0.86, 0.02, 1.05);
  s.bezierCurveTo(0.12, 0.94, 0.2, 0.78, 0.16, 0.6);
  s.bezierCurveTo(0.26, 0.5, 0.3, 0.3, 0.22, 0.14);
  s.bezierCurveTo(0.16, 0.04, 0.08, 0, 0, 0);
  // Inner eye of the leaf, cut through so light falls into the carving
  const eye = new THREE.Path();
  eye.moveTo(0.0, 0.18);
  eye.bezierCurveTo(-0.08, 0.26, -0.07, 0.4, 0.0, 0.48);
  eye.bezierCurveTo(0.07, 0.4, 0.08, 0.26, 0.0, 0.18);
  s.holes.push(eye);
  return s;
}

let flameLeafGeo: THREE.BufferGeometry | null = null;
export function flameLeafGeometry(): THREE.BufferGeometry {
  if (!flameLeafGeo) {
    flameLeafGeo = new THREE.ExtrudeGeometry(flameLeafShape(), {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.022,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 18,
    });
    flameLeafGeo.translate(0, 0, -0.025);
  }
  return flameLeafGeo;
}

/* A ring of flame-leaves standing round a rim, every leaf leaning outward:
   merged into one geometry so a whole border is a single draw call */
export function kbachRingGeometry(count: number, radius: number, leafScale: number, lean: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const g = flameLeafGeometry().clone();
    g.scale(leafScale, leafScale, leafScale);
    m.makeRotationX(-lean);
    g.applyMatrix4(m);
    m.makeRotationY(-a + Math.PI / 2);
    g.applyMatrix4(m);
    m.makeTranslation(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    g.applyMatrix4(m);
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

/* ─── Plinth: a lotus pedestal ─────────────────────────────────────────── */

/* Khmer sculpture stands on lotus pedestals: a turned drum with a tier of
   upturned petals above and inverted petals below. Each tier is one merged
   geometry (one draw call) of real curved, bevelled petals. */
function petalRingGeometry(count: number, radius: number, len: number, width: number, tilt: number, flip: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  const base = petalGeometry(len, width, 0.03, 0.03, 0.9);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const g = base.clone();
    // Lean outward from upright (or hang down for the inverted tier)
    m.makeRotationX(flip ? Math.PI - tilt : tilt);
    g.applyMatrix4(m);
    m.makeRotationY(a);
    g.applyMatrix4(m);
    m.makeTranslation(Math.sin(a) * radius, 0, Math.cos(a) * radius);
    g.applyMatrix4(m);
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

export function buildPlinth(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  // Turned drum with a moulded foot and lip
  const drum = lathe([
    [0, 0], [0.86, 0], [0.88, 0.02], [0.84, 0.045], [0.74, 0.06], [0.72, 0.17], [0.76, 0.19], [0.78, 0.22], [0.74, 0.24], [0, 0.24],
  ], 96);
  g.add(mesh(drum, mats.plinth));
  // A tier of rounded upturned petals, overlapping like a lotus throne
  const upper = petalRingGeometry(32, 0.75, 0.2, 0.1, 0.22, false);
  upper.translate(0, 0.07, 0);
  g.add(mesh(upper, mats.champagne));
  // Gold beading on the foot moulding
  const bead = new THREE.TorusGeometry(0.85, 0.016, 12, 128);
  bead.rotateX(Math.PI / 2);
  bead.translate(0, 0.03, 0);
  g.add(mesh(bead, mats.gold));
  return g;
}

/* ─── Lotus: tiers of curved petals ─────────────────────────────────────── */

function petalGeometry(len: number, width: number, cup: number, curl: number, blunt = 0): THREE.BufferGeometry {
  const s = new THREE.Shape();
  // blunt 0 = pointed lotus petal, 1 = rounded pedestal petal
  const shoulder = 0.6 + blunt * 0.3;
  const tipW = width * blunt * 0.55;
  s.moveTo(0, 0);
  s.bezierCurveTo(width * 0.9, len * 0.2, width, len * shoulder, tipW, len);
  s.bezierCurveTo(-width, len * shoulder, -width * 0.9, len * 0.2, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 20,
    steps: 1,
  });
  // Bend the flat outline into a real petal: cupped across, curling at the tip
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = Math.max(0, y / len);
    const nx = x / Math.max(width, 1e-4);
    // Edges rise toward the flower's centre (cupped), the tip turns outward
    p.setZ(i, z - cup * nx * nx + curl * t * t);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildLotus(mats: KhmerMaterials, opts: { open: number; scale?: number; material?: THREE.Material } = { open: 1 }): THREE.Group {
  const g = new THREE.Group();
  const mat = opts.material ?? mats.lotusPetal;
  const tiers = [
    { n: 12, len: 0.6, w: 0.25, tilt: 0.95 * opts.open + 0.16, cup: 0.11, curl: 0.1, y: 0.0 },
    { n: 10, len: 0.54, w: 0.23, tilt: 0.62 * opts.open + 0.12, cup: 0.12, curl: 0.08, y: 0.03 },
    { n: 8, len: 0.44, w: 0.2, tilt: 0.32 * opts.open + 0.08, cup: 0.12, curl: 0.05, y: 0.06 },
  ];
  tiers.forEach((tier, ti) => {
    const geo = petalGeometry(tier.len, tier.w, tier.cup, tier.curl);
    for (let i = 0; i < tier.n; i++) {
      const a = (i / tier.n) * Math.PI * 2 + (ti % 2) * (Math.PI / tier.n);
      const petal = mesh(geo, mat);
      // Turn to face outward round the ring, then lean out from upright
      petal.rotation.order = "YXZ";
      petal.rotation.set(tier.tilt, a, 0);
      petal.position.y = tier.y;
      g.add(petal);
    }
  });
  if (opts.open > 0.4) {
    // Seed pod with its sunken seeds
    const pod = lathe([[0, 0.02], [0.16, 0.05], [0.18, 0.14], [0.16, 0.18], [0, 0.18]], 40);
    g.add(mesh(pod, mats.gold));
    const seedGeo = new THREE.SphereGeometry(0.022, 10, 8);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const seed = mesh(seedGeo, mats.champagne);
      seed.position.set(Math.cos(a) * 0.09, 0.18, Math.sin(a) * 0.09);
      g.add(seed);
    }
  }
  g.scale.setScalar(opts.scale ?? 1);
  return g;
}

/* ─── Turned vessels ────────────────────────────────────────────────────── */

/* Footed offering tray (lacquer bowl on a gold foot) */
function buildFootedTray(mats: KhmerMaterials, bodyMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const foot = lathe([[0, 0], [0.42, 0], [0.44, 0.03], [0.3, 0.08], [0.16, 0.2], [0.14, 0.34], [0.2, 0.38], [0, 0.38]]);
  g.add(mesh(foot, mats.gold));
  const dish = lathe([[0, 0.38], [0.62, 0.42], [0.86, 0.5], [0.9, 0.56], [0.86, 0.57], [0.6, 0.5], [0, 0.48]]);
  g.add(mesh(dish, bodyMat));
  const lip = new THREE.TorusGeometry(0.885, 0.022, 10, 96);
  lip.rotateX(Math.PI / 2);
  lip.translate(0, 0.565, 0);
  g.add(mesh(lip, mats.gold));
  return g;
}

function buildFootedBowl(mats: KhmerMaterials, bodyMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const foot = lathe([[0, 0], [0.34, 0], [0.36, 0.03], [0.2, 0.1], [0.16, 0.18], [0.22, 0.22], [0, 0.22]]);
  g.add(mesh(foot, mats.gold));
  const bowl = lathe([[0, 0.22], [0.3, 0.24], [0.56, 0.36], [0.7, 0.56], [0.72, 0.62], [0.66, 0.6], [0.52, 0.42], [0.28, 0.32], [0, 0.3]]);
  g.add(mesh(bowl, bodyMat));
  // Band of small flame-leaves embossed round the belly of the bowl
  const band = kbachRingGeometry(16, 0.62, 0.11, -0.25);
  band.translate(0, 0.44, 0);
  g.add(mesh(band, mats.gold));
  const lip = new THREE.TorusGeometry(0.71, 0.02, 10, 96);
  lip.rotateX(Math.PI / 2);
  lip.translate(0, 0.62, 0);
  g.add(mesh(lip, mats.gold));
  return g;
}

/* ─── Ceremony objects ──────────────────────────────────────────────────── */

/* Gift procession: a footed tray heaped with fruit */
function buildProcession(mats: KhmerMaterials): THREE.Group {
  const g = buildFootedTray(mats, mats.lacquer);
  const fruitGeo = new THREE.SphereGeometry(0.2, 32, 24);
  const placements: [number, number, number, boolean][] = [
    [0.3, 0.68, 0.0, false], [-0.15, 0.68, 0.26, true], [-0.15, 0.68, -0.26, false],
    [0.0, 0.7, 0.0, false], [0.52, 0.64, 0.3, true], [-0.48, 0.64, -0.05, false],
    [0.08, 0.98, 0.08, true], [-0.12, 0.96, -0.08, false],
  ];
  placements.forEach(([x, y, z, alt]) => {
    const f = mesh(fruitGeo, alt ? mats.fruitAlt : mats.fruit);
    f.position.set(x, y, z);
    f.scale.set(1, 0.92, 1);
    g.add(f);
  });
  // A couple of leaves tucked between the fruit
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.14, 0.2, 0, 0.5);
  leafShape.quadraticCurveTo(-0.14, 0.2, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 12);
  [[0.1, 1.08, 0.1, 0.4, 0.9], [-0.05, 1.06, -0.05, -0.6, -1.0]].forEach(([x, y, z, ry, rz]) => {
    const l = mesh(leafGeo, mats.leaf);
    l.scale.setScalar(0.7);
    l.position.set(x, y, z);
    l.rotation.set(-0.5, ry, rz);
    g.add(l);
  });
  return g;
}

/* Monks' blessing: a full lotus in gold on a small stand */
function buildBlessing(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const stand = lathe([[0, 0], [0.32, 0], [0.34, 0.03], [0.18, 0.1], [0.1, 0.22], [0.16, 0.26], [0, 0.26]]);
  g.add(mesh(stand, mats.gold));
  const lotus = buildLotus(mats, { open: 1, scale: 1.25 });
  lotus.position.y = 0.26;
  g.add(lotus);
  return g;
}

/* Hair-cutting: a pair of scissors laid across a small cushion of silk */
function buildHaircut(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const cushion = new THREE.CylinderGeometry(0.7, 0.74, 0.12, 64);
  cushion.translate(0, 0.06, 0);
  g.add(mesh(cushion, mats.lacquer));
  const blade = new THREE.Shape();
  blade.moveTo(0, 0);
  blade.lineTo(0.05, 0.02);
  blade.bezierCurveTo(0.06, 0.4, 0.035, 0.7, 0, 0.92);
  blade.bezierCurveTo(-0.01, 0.6, -0.02, 0.3, -0.03, 0.02);
  blade.lineTo(0, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(blade, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 16 });
  const ringGeo = new THREE.TorusGeometry(0.13, 0.03, 16, 48);
  const pivot = new THREE.SphereGeometry(0.035, 16, 12);
  const half = (side: 1 | -1) => {
    const h = new THREE.Group();
    const b = mesh(bladeGeo, mats.steel);
    b.position.set(0, 0, side * 0.012);
    h.add(b);
    const shank = new THREE.CylinderGeometry(0.022, 0.026, 0.3, 12);
    shank.rotateZ(Math.PI);
    const s = mesh(shank, mats.gold);
    s.position.set(0, -0.15, side * 0.012);
    h.add(s);
    const r = mesh(ringGeo, mats.gold);
    r.position.set(side * 0.04, -0.4, side * 0.012);
    h.add(r);
    h.rotation.z = side * 0.2;
    return h;
  };
  const scissors = new THREE.Group();
  scissors.add(half(1), half(-1));
  const pv = mesh(pivot, mats.gold);
  scissors.add(pv);
  scissors.rotation.set(-Math.PI / 2, 0, 0.6);
  scissors.position.set(0, 0.17, 0.05);
  g.add(scissors);
  return g;
}

/* Bangvil popil: the leaf-shaped silver holder with its candle and flame */
function buildPopil(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const leaf = new THREE.Shape();
  // Heart-shaped leaf with a long drip tip
  leaf.moveTo(0, 0);
  leaf.bezierCurveTo(-0.5, 0.1, -0.62, 0.6, -0.34, 0.9);
  leaf.bezierCurveTo(-0.18, 1.06, -0.06, 1.18, 0, 1.42);
  leaf.bezierCurveTo(0.06, 1.18, 0.18, 1.06, 0.34, 0.9);
  leaf.bezierCurveTo(0.62, 0.6, 0.5, 0.1, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leaf, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.02, bevelSegments: 3, curveSegments: 28 });
  // Gentle dish so the leaf catches light along its length
  const p = leafGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + 0.12 * Math.pow(p.getX(i) / 0.6, 2));
  leafGeo.computeVertexNormals();
  leafGeo.scale(0.72, 0.72, 0.72);
  const leafMesh = mesh(leafGeo, mats.silver);
  leafMesh.rotation.set(-0.85, 0, 0);
  leafMesh.position.set(0, 0.1, 0.36);
  g.add(leafMesh);
  // Raised midrib and veins in gold, as on repoussé popil
  const rib = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0.7, 0.03), new THREE.Vector3(0, 1.32, 0.04)]), 24, 0.014, 8);
  rib.scale(0.72, 0.72, 0.72);
  const ribMesh = mesh(rib, mats.gold);
  ribMesh.rotation.set(-0.85, 0, 0);
  ribMesh.position.set(0, 0.13, 0.38);
  g.add(ribMesh);
  // Handle and the candle at the stem end
  const handle = new THREE.CylinderGeometry(0.035, 0.045, 0.5, 16);
  handle.rotateX(Math.PI / 2 - 0.3);
  const h = mesh(handle, mats.silver);
  h.position.set(0, 0.16, 0.46);
  g.add(h);
  const candle = new THREE.CylinderGeometry(0.06, 0.065, 0.62, 24);
  const c = mesh(candle, mats.wax);
  c.position.set(0, 0.5, 0.42);
  g.add(c);
  const wick = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6);
  const w = mesh(wick, mats.steel, false);
  w.position.set(0, 0.83, 0.42);
  g.add(w);
  const flameGeo = lathe([[0, 0], [0.045, 0.04], [0.05, 0.09], [0.03, 0.15], [0, 0.22]], 24);
  const flame = new THREE.Mesh(flameGeo, mats.flame);
  flame.position.set(0, 0.84, 0.42);
  flame.name = "flame";
  g.add(flame);
  const glow = new THREE.PointLight("#ffb35c", 1.4, 2.2, 2);
  glow.position.set(0, 0.95, 0.42);
  g.add(glow);
  return g;
}

/* Sampeah pthem: lotus buds, the offering held between joined palms */
function buildSampeah(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const tray = lathe([[0, 0], [0.5, 0], [0.52, 0.03], [0.44, 0.08], [0.46, 0.12], [0, 0.12]]);
  g.add(mesh(tray, mats.gold));
  const budBody = lathe([[0, 0], [0.13, 0.06], [0.2, 0.2], [0.19, 0.36], [0.12, 0.52], [0.04, 0.64], [0, 0.68]], 48);
  const hugGeo = petalGeometry(0.62, 0.17, 0.09, -0.02);
  [[-0.2, 0.08, 1.05], [0.22, -0.06, 0.92]].forEach(([x, rz, s]) => {
    const bud = new THREE.Group();
    bud.add(mesh(budBody, mats.champagne));
    for (let i = 0; i < 4; i++) {
      const petal = mesh(hugGeo, mats.lotusPetal);
      petal.rotation.order = "YXZ";
      petal.rotation.set(0.12, (i / 4) * Math.PI * 2 + 0.3, 0);
      petal.position.y = 0.02;
      bud.add(petal);
    }
    bud.scale.setScalar(s);
    bud.position.set(x, 0.12, 0);
    bud.rotation.z = rz;
    g.add(bud);
    const stem = new THREE.CylinderGeometry(0.018, 0.02, 0.12, 10);
    const st = mesh(stem, mats.leaf);
    st.position.set(x, 0.1, 0);
    g.add(st);
  });
  return g;
}

/* Chong dai: coils of red cotton thread on a silver dish */
function buildChongdai(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const dish = lathe([[0, 0], [0.62, 0.0], [0.7, 0.06], [0.74, 0.1], [0.68, 0.1], [0.56, 0.05], [0, 0.04]]);
  g.add(mesh(dish, mats.silver));
  const rnd = seeded(11);
  for (let k = 0; k < 3; k++) {
    const pts: THREE.Vector3[] = [];
    const turns = 3.2;
    const r0 = 0.24 + k * 0.1;
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const a = t * Math.PI * 2 * turns + k * 1.7;
      const r = r0 + Math.sin(t * 9 + k) * 0.03;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.1 + 0.02 * k + t * 0.04 + rnd() * 0.012, Math.sin(a) * r));
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.026, 10);
    g.add(mesh(tube, mats.redThread));
  }
  // Loose ends trailing over the rim
  const tail = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.4, 0.16, 0.1), new THREE.Vector3(0.58, 0.14, 0.24), new THREE.Vector3(0.7, 0.08, 0.34), new THREE.Vector3(0.76, 0.02, 0.4),
  ]), 40, 0.024, 10);
  g.add(mesh(tail, mats.redThread));
  return g;
}

/* Bach phka sla: a footed bowl heaped with areca-palm florets on their strands */
function buildPetals(mats: KhmerMaterials): THREE.Group {
  const g = buildFootedBowl(mats, mats.lacquer);
  const rnd = seeded(29);
  const floretGeo = new THREE.SphereGeometry(0.018, 7, 5);
  floretGeo.scale(1, 0.75, 1);
  const count = 620;
  const inst = new THREE.InstancedMesh(floretGeo, mats.floret, count);
  inst.castShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < count; i++) {
    // Mounded heap filling the bowl
    const r = Math.sqrt(rnd()) * 0.6;
    const a = rnd() * Math.PI * 2;
    const y = 0.6 + (1 - (r / 0.6) ** 2) * 0.24 + rnd() * 0.03;
    e.set(rnd() * 3, rnd() * 3, rnd() * 3);
    q.setFromEuler(e);
    const s = 0.8 + rnd() * 0.5;
    m.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(s, s, s));
    inst.setMatrixAt(i, m);
  }
  g.add(inst);
  // A few strands of the inflorescence arching out of the heap
  for (let k = 0; k < 4; k++) {
    const a = k * 1.6 + 0.4;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.1, 0.8, Math.sin(a) * 0.1),
      new THREE.Vector3(Math.cos(a) * 0.45, 1.02, Math.sin(a) * 0.45),
      new THREE.Vector3(Math.cos(a) * 0.82, 0.78, Math.sin(a) * 0.82),
    ]);
    g.add(mesh(new THREE.TubeGeometry(curve, 30, 0.007, 5), mats.champagne));
    const flor = new THREE.InstancedMesh(floretGeo, mats.floret, 26);
    for (let j = 0; j < 26; j++) {
      const pnt = curve.getPoint(0.2 + (j / 26) * 0.78);
      m.compose(pnt.add(new THREE.Vector3((rnd() - 0.5) * 0.04, 0.02, (rnd() - 0.5) * 0.04)), q, new THREE.Vector3(1, 1, 1));
      flor.setMatrixAt(j, m);
    }
    flor.castShadow = true;
    g.add(flor);
  }
  return g;
}

const BUILDERS: Record<CeremonyKind, (m: KhmerMaterials) => THREE.Group> = {
  procession: buildProcession,
  blessing: buildBlessing,
  haircut: buildHaircut,
  popil: buildPopil,
  sampeah: buildSampeah,
  chongdai: buildChongdai,
  petals: buildPetals,
};

/** The ceremony object standing on its carved plinth */
export function buildCeremonyPiece(kind: CeremonyKind, mats: KhmerMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildPlinth(mats));
  const obj = BUILDERS[kind](mats);
  obj.position.y = 0.24;
  obj.scale.setScalar(1.15);
  root.add(obj);
  return root;
}
