/* Procedural Khmer ceremony pieces (three.js meshes).

   Everything is real geometry built in code: lathed (turned) metalwork,
   extruded and bevelled outlines, tube geometry and instanced detail. There
   is no Blender/GLB pipeline in this project, so forms are authored from
   profiles; fine surface detail (kbach engraving, braided cord, fruit skin)
   comes from bump maps drawn once on canvases.

   The vocabulary follows the objects a Khmer wedding uses: the footed phan
   (ជើងពាន) offering stand, fruit for the procession, the gold lotus, shears
   for the hair-cutting, the brass popil (ពពិល), slathor (ស្លាធម៌) cones of
   betel leaf and areca nut, red cotton thread for the wrist-tying, and
   areca blossom (ផ្កាស្លា) with popped rice. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type CeremonyKind = "procession" | "blessing" | "haircut" | "popil" | "sampeah" | "chongdai" | "petals";

/* ─── Surface maps (drawn once) ─────────────────────────────────────────── */

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void, repeat: [number, number]) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

/* Fine brushed metal grain */
function metalGrain() {
  const rnd = seeded(7);
  return canvasTexture(256, (g, n) => {
    g.fillStyle = "#808080";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 2600; i++) {
      const v = 112 + Math.floor(rnd() * 34);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(rnd() * n, rnd() * n, 1 + rnd() * 16, 1);
    }
  }, [3, 3]);
}

/* Kbach engraving: rows of flame-leaf scrolls cut into the metal */
function kbachEngraving() {
  return canvasTexture(512, (g, n) => {
    g.fillStyle = "#9a9a9a";
    g.fillRect(0, 0, n, n);
    g.strokeStyle = "#3a3a3a";
    g.lineCap = "round";
    const cell = n / 4;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * cell + (row % 2) * cell * 0.5;
        const y = row * cell;
        g.lineWidth = n / 110;
        g.beginPath();
        g.moveTo(x + cell * 0.5, y + cell * 0.92);
        g.bezierCurveTo(x + cell * 0.12, y + cell * 0.7, x + cell * 0.2, y + cell * 0.32, x + cell * 0.5, y + cell * 0.08);
        g.bezierCurveTo(x + cell * 0.8, y + cell * 0.32, x + cell * 0.88, y + cell * 0.7, x + cell * 0.5, y + cell * 0.92);
        g.stroke();
        g.lineWidth = n / 170;
        g.beginPath();
        g.moveTo(x + cell * 0.5, y + cell * 0.72);
        g.bezierCurveTo(x + cell * 0.36, y + cell * 0.56, x + cell * 0.42, y + cell * 0.4, x + cell * 0.5, y + cell * 0.3);
        g.bezierCurveTo(x + cell * 0.58, y + cell * 0.4, x + cell * 0.64, y + cell * 0.56, x + cell * 0.5, y + cell * 0.72);
        g.stroke();
        for (const side of [-1, 1]) {
          g.beginPath();
          g.arc(x + cell * (0.5 + side * 0.36), y + cell * 0.78, cell * 0.09, 0, Math.PI * 1.6);
          g.stroke();
        }
      }
    }
  }, [2.5, 2.5]);
}

/* Twisted cord: diagonal ply lines, so the thread reads as spun cotton */
function cordTwist() {
  return canvasTexture(128, (g, n) => {
    g.fillStyle = "#8a8a8a";
    g.fillRect(0, 0, n, n);
    g.strokeStyle = "#2e2e2e";
    g.lineWidth = n / 9;
    for (let i = -2; i < 6; i++) {
      g.beginPath();
      g.moveTo(i * (n / 3), 0);
      g.lineTo(i * (n / 3) + n, n);
      g.stroke();
    }
  }, [140, 1]);
}

/* Citrus skin: dense tiny pores */
function poreMap() {
  const rnd = seeded(41);
  return canvasTexture(256, (g, n) => {
    g.fillStyle = "#909090";
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 5000; i++) {
      const v = 60 + Math.floor(rnd() * 50);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.beginPath();
      g.arc(rnd() * n, rnd() * n, 0.6 + rnd() * 1.1, 0, Math.PI * 2);
      g.fill();
    }
  }, [2, 2]);
}

/* ─── Materials ─────────────────────────────────────────────────────────── */

export interface KhmerMaterials {
  gold: THREE.MeshPhysicalMaterial;
  goldBright: THREE.MeshPhysicalMaterial;
  brass: THREE.MeshPhysicalMaterial;
  steel: THREE.MeshPhysicalMaterial;
  marble: THREE.MeshPhysicalMaterial;
  velvet: THREE.MeshPhysicalMaterial;
  lacquer: THREE.MeshPhysicalMaterial;
  redThread: THREE.MeshPhysicalMaterial;
  wax: THREE.MeshPhysicalMaterial;
  flame: THREE.MeshBasicMaterial;
  orange: THREE.MeshPhysicalMaterial;
  apple: THREE.MeshPhysicalMaterial;
  mango: THREE.MeshPhysicalMaterial;
  grape: THREE.MeshPhysicalMaterial;
  stem: THREE.MeshPhysicalMaterial;
  leaf: THREE.MeshPhysicalMaterial;
  betel: THREE.MeshPhysicalMaterial;
  areca: THREE.MeshPhysicalMaterial;
  floret: THREE.MeshPhysicalMaterial;
  rice: THREE.MeshPhysicalMaterial;
}

export function createMaterials(accent: THREE.ColorRepresentation): KhmerMaterials {
  const grain = metalGrain();
  const pores = poreMap();
  const metal = (color: string, roughness: number, metalness: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
    new THREE.MeshPhysicalMaterial({ color, metalness, roughness, roughnessMap: grain, bumpMap: grain, bumpScale: 0.5, ...extra });
  return {
    // Warm Khmer gold, not yellow: metalness ~.9, roughness ~.26
    gold: metal("#d4af37", 0.27, 0.92, { clearcoat: 0.25, clearcoatRoughness: 0.3 }),
    goldBright: metal("#e5c158", 0.22, 0.95),
    // Brass carries the engraved kbach as real surface relief
    brass: new THREE.MeshPhysicalMaterial({ color: "#c59b27", metalness: 0.9, roughness: 0.32, bumpMap: kbachEngraving(), bumpScale: 2.2, roughnessMap: grain }),
    steel: new THREE.MeshPhysicalMaterial({ color: "#c9cdd2", metalness: 0.95, roughness: 0.15, bumpMap: grain, bumpScale: 0.25 }),
    marble: new THREE.MeshPhysicalMaterial({ color: "#efe6d6", metalness: 0, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.35, bumpMap: grain, bumpScale: 0.3 }),
    // Velvet: deep pile colour with a bright sheen at grazing angles
    velvet: new THREE.MeshPhysicalMaterial({ color: "#5c0912", metalness: 0, roughness: 0.92, sheen: 1, sheenColor: new THREE.Color("#e2384a"), sheenRoughness: 0.35 }),
    lacquer: new THREE.MeshPhysicalMaterial({ color: accent, metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }),
    // Cotton cord: twisted plies in the bump, soft sheen along the fibres
    redThread: new THREE.MeshPhysicalMaterial({ color: "#a3101c", metalness: 0, roughness: 0.68, bumpMap: cordTwist(), bumpScale: 3, sheen: 0.9, sheenColor: new THREE.Color("#ff7a7a"), sheenRoughness: 0.5 }),
    wax: new THREE.MeshPhysicalMaterial({ color: "#f7eedb", metalness: 0, roughness: 0.5, transmission: 0.12, thickness: 0.5, attenuationColor: new THREE.Color("#ffd9a0"), attenuationDistance: 0.6 }),
    flame: new THREE.MeshBasicMaterial({ color: "#ffbf5e", transparent: true, opacity: 0.96 }),
    orange: new THREE.MeshPhysicalMaterial({ color: "#d8601a", metalness: 0, roughness: 0.48, clearcoat: 0.55, clearcoatRoughness: 0.45, bumpMap: pores, bumpScale: 2.4, sheen: 0.3, sheenColor: new THREE.Color("#ffb070") }),
    apple: new THREE.MeshPhysicalMaterial({ color: "#9e1420", metalness: 0, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.2 }),
    mango: new THREE.MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, metalness: 0, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    grape: new THREE.MeshPhysicalMaterial({ color: "#3b1638", metalness: 0, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.6, sheenColor: new THREE.Color("#a68fb8") }),
    stem: new THREE.MeshPhysicalMaterial({ color: "#5a3b1c", metalness: 0, roughness: 0.8 }),
    leaf: new THREE.MeshPhysicalMaterial({ color: "#2f5a26", metalness: 0, roughness: 0.42, clearcoat: 0.4, side: THREE.DoubleSide }),
    betel: new THREE.MeshPhysicalMaterial({ color: "#3d6b2a", metalness: 0, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.25, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color("#b6d98f") }),
    areca: new THREE.MeshPhysicalMaterial({ color: "#c0661f", metalness: 0, roughness: 0.55, clearcoat: 0.3, bumpMap: pores, bumpScale: 1.2 }),
    floret: new THREE.MeshPhysicalMaterial({ color: "#efe0ae", metalness: 0, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#fff8e0") }),
    rice: new THREE.MeshPhysicalMaterial({ color: "#fbf7ee", metalness: 0, roughness: 0.75, sheen: 0.5, sheenColor: new THREE.Color("#ffffff") }),
  };
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const lathe = (pts: [number, number][], segments = 72) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments);

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadows = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function ring(radius: number, tube: number, y: number) {
  const t = new THREE.TorusGeometry(radius, tube, 12, 96);
  t.rotateX(Math.PI / 2);
  t.translate(0, y, 0);
  return t;
}

/* ─── Petals (lotus, and the notched rims of the phan) ──────────────────── */

function petalGeometry(len: number, width: number, cup: number, curl: number, blunt = 0): THREE.BufferGeometry {
  const s = new THREE.Shape();
  // blunt 0 = pointed lotus petal, 1 = rounded rim petal
  const shoulder = 0.6 + blunt * 0.3;
  const tipW = width * blunt * 0.55;
  s.moveTo(0, 0);
  s.bezierCurveTo(width * 0.9, len * 0.2, width, len * shoulder, tipW, len);
  s.bezierCurveTo(-width, len * shoulder, -width * 0.9, len * 0.2, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 20 });
  // Bend the outline into a real petal: cupped across, the tip turning out
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = Math.max(0, y / len);
    const nx = x / Math.max(width, 1e-4);
    p.setZ(i, z - cup * nx * nx + curl * t * t);
  }
  geo.computeVertexNormals();
  return geo;
}

/* A ring of petals round a rim, merged into one draw call */
function petalRing(count: number, radius: number, len: number, width: number, tilt: number, blunt: number): THREE.BufferGeometry {
  const base = petalGeometry(len, width, 0.03, 0.03, blunt);
  const parts: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const g = base.clone();
    m.makeRotationX(tilt);
    g.applyMatrix4(m);
    m.makeRotationY(a);
    g.applyMatrix4(m);
    m.makeTranslation(Math.sin(a) * radius, 0, Math.cos(a) * radius);
    g.applyMatrix4(m);
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

export function buildLotus(mats: KhmerMaterials, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const tiers = [
    { n: 12, len: 0.6, w: 0.25, tilt: 1.1, cup: 0.11, curl: 0.1, y: 0.0, mat: mats.gold },
    { n: 10, len: 0.54, w: 0.23, tilt: 0.74, cup: 0.12, curl: 0.08, y: 0.03, mat: mats.goldBright },
    { n: 8, len: 0.44, w: 0.2, tilt: 0.4, cup: 0.12, curl: 0.05, y: 0.06, mat: mats.gold },
  ];
  tiers.forEach((tier, ti) => {
    const geo = petalGeometry(tier.len, tier.w, tier.cup, tier.curl);
    for (let i = 0; i < tier.n; i++) {
      const petal = mesh(geo, tier.mat);
      petal.rotation.order = "YXZ";
      petal.rotation.set(tier.tilt, (i / tier.n) * Math.PI * 2 + (ti % 2) * (Math.PI / tier.n), 0);
      petal.position.y = tier.y;
      g.add(petal);
    }
  });
  g.add(mesh(lathe([[0, 0.02], [0.16, 0.05], [0.18, 0.14], [0.16, 0.18], [0, 0.18]], 40), mats.goldBright));
  const seedGeo = new THREE.SphereGeometry(0.022, 10, 8);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const seed = mesh(seedGeo, mats.gold);
    seed.position.set(Math.cos(a) * 0.09, 0.18, Math.sin(a) * 0.09);
    g.add(seed);
  }
  g.scale.setScalar(scale);
  return g;
}

/* ─── The phan (ជើងពាន): footed offering stand ───────────────────────────
   Stepped foot, a beaded waist and a dish whose rim is notched with rounded
   petals. Returns the stand, its dish surface height and rim height. */
function buildPhan(mats: KhmerMaterials, opts: { radius: number; height: number; deep?: boolean; material?: THREE.Material }) {
  const { radius: R, height: H } = opts;
  const mat = opts.material ?? mats.gold;
  const g = new THREE.Group();
  const P = (x: number, y: number): [number, number] => [x * R, y * H];
  const dishFloor = opts.deep ? 0.74 : 0.86;
  const profile: [number, number][] = [
    P(0, 0), P(0.78, 0), P(0.8, 0.02), P(0.8, 0.05), P(0.74, 0.07), P(0.72, 0.1), P(0.62, 0.12), P(0.6, 0.16),
    P(0.46, 0.22), P(0.3, 0.32), P(0.24, 0.42), P(0.22, 0.5), P(0.26, 0.56), P(0.36, 0.62),
    P(0.6, 0.72), P(0.86, 0.84), P(1.0, 0.94), P(1.03, 0.97), P(0.98, 0.99), P(0.82, opts.deep ? 0.88 : 0.93),
    P(0.5, dishFloor), P(0, dishFloor),
  ];
  g.add(mesh(lathe(profile, 96), mat));
  g.add(mesh(ring(0.7 * R, 0.018 * R, 0.1 * H), mats.goldBright));
  g.add(mesh(ring(0.235 * R, 0.03 * R, 0.47 * H), mats.goldBright));
  g.add(mesh(ring(0.25 * R, 0.022 * R, 0.53 * H), mats.goldBright));
  const rim = petalRing(Math.max(12, Math.round(28 * R)), 0.99 * R, 0.13 * R, 0.07 * R, 0.32, 0.9);
  rim.translate(0, 0.95 * H, 0);
  g.add(mesh(rim, mats.goldBright));
  return { group: g, top: dishFloor * H, rimY: 0.97 * H };
}

/* Polished marble slab with a stepped, bevelled edge: grounds every stand */
function buildSlab(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [1.08, 0], [1.12, 0.015], [1.12, 0.05], [1.08, 0.065], [1.0, 0.07], [0.98, 0.1], [0.94, 0.115], [0, 0.115]], 96), mats.marble));
  g.add(mesh(ring(1.0, 0.012, 0.07), mats.gold));
  return g;
}

/* ─── 1. Gift procession: fruit heaped on a tall phan ───────────────────── */

function appleGeometry(r: number) {
  return lathe([[0, -0.82 * r], [0.35 * r, -0.95 * r], [0.8 * r, -0.7 * r], [r, -0.1 * r], [0.92 * r, 0.45 * r], [0.6 * r, 0.82 * r], [0.25 * r, 0.82 * r], [0, 0.66 * r]], 40);
}

function mangoGeometry() {
  const geo = new THREE.SphereGeometry(0.2, 40, 28);
  geo.scale(1.3, 0.92, 0.88);
  // Kidney curve and a green-to-gold blush
  const p = geo.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  const green = new THREE.Color("#7a8f2a"), gold = new THREE.Color("#f2a72a"), blush = new THREE.Color("#d9541e");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setY(i, y + 0.06 * Math.pow(x / 0.26, 2) - 0.02);
    const t = (x / 0.26 + 1) / 2;
    const c = green.clone().lerp(gold, Math.min(1, t * 1.3));
    if (y > 0.08 && t > 0.55) c.lerp(blush, 0.35);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function grapeBunch(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(5);
  const n = 34;
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.042, 16, 12), mats.grape, n);
  inst.castShadow = true;
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const r = 0.12 * (1 - t) + 0.02;
    const a = i * 2.4;
    m.makeTranslation(Math.cos(a) * r, -t * 0.32 + (rnd() - 0.5) * 0.02, Math.sin(a) * r);
    inst.setMatrixAt(i, m);
  }
  g.add(inst);
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0.02, 0.08, 0), new THREE.Vector3(-0.02, 0.13, 0.01)]), 12, 0.01, 6), mats.stem));
  return g;
}

function buildProcession(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.92, height: 0.62 });
  g.add(phan.group);
  const y0 = phan.top;
  const orangeGeo = new THREE.SphereGeometry(0.17, 40, 30);
  orangeGeo.scale(1, 0.94, 1);
  const appleGeo = appleGeometry(0.16);
  // Lower ring: oranges and apples alternating, symmetric
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const isApple = i % 2 === 1;
    const f = mesh(isApple ? appleGeo : orangeGeo, isApple ? mats.apple : mats.orange);
    f.position.set(Math.cos(a) * 0.48, y0 + 0.16, Math.sin(a) * 0.48);
    f.rotation.set(0, a, isApple ? 0.15 : 0);
    g.add(f);
    if (isApple) {
      const st = mesh(new THREE.CylinderGeometry(0.007, 0.01, 0.07, 6), mats.stem);
      st.position.set(Math.cos(a) * 0.48, y0 + 0.31, Math.sin(a) * 0.48);
      st.rotation.z = 0.25;
      g.add(st);
    }
  }
  // Middle tier: three oranges
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const f = mesh(orangeGeo, mats.orange);
    f.position.set(Math.cos(a) * 0.2, y0 + 0.4, Math.sin(a) * 0.2);
    g.add(f);
  }
  // Crown: a ripe mango lying across the top
  const mango = mesh(mangoGeometry(), mats.mango);
  mango.position.set(0, y0 + 0.66, 0);
  mango.rotation.set(0, 0.6, -0.1);
  g.add(mango);
  // Grapes draping over the front of the rim
  const grapes = grapeBunch(mats);
  grapes.position.set(0.52, phan.rimY + 0.18, 0.62);
  grapes.rotation.set(0.5, 0, -0.35);
  g.add(grapes);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.12, 0.18, 0, 0.42);
  leafShape.quadraticCurveTo(-0.12, 0.18, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 12);
  [[-0.18, 0.5, 0.6], [0.2, -2.4, 0.6]].forEach(([x, ry, rx]) => {
    const l = mesh(leafGeo, mats.leaf);
    l.position.set(x, y0 + 0.56, 0);
    l.rotation.set(rx, ry, 0);
    g.add(l);
  });
  return g;
}

/* ─── 2. Monks' blessing: the gold lotus on a phan ──────────────────────── */

function buildBlessing(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.62, height: 0.46 });
  g.add(phan.group);
  const lotus = buildLotus(mats, 1.25);
  lotus.position.y = phan.top;
  g.add(lotus);
  return g;
}

/* ─── 3. Hair-cutting: shears on a velvet cushion ───────────────────────── */

function filigreeHandle(mats: KhmerMaterials, side: 1 | -1): THREE.Group {
  const h = new THREE.Group();
  h.add(mesh(new THREE.TorusGeometry(0.12, 0.022, 16, 48), mats.goldBright));
  // Curled scroll on the outside of each bow
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = t * Math.PI * 3.2;
    const r = 0.07 * (1 - t * 0.75);
    pts.push(new THREE.Vector3(side * (0.15 + Math.cos(a) * r), -0.04 + Math.sin(a) * r, 0));
  }
  h.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.009, 6), mats.gold));
  return h;
}

function buildHaircut(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.82, height: 0.3 });
  g.add(phan.group);
  const cushion = mesh(lathe([[0, 0], [0.62, 0.0], [0.7, 0.04], [0.72, 0.09], [0.68, 0.15], [0.55, 0.19], [0, 0.2]], 72), mats.velvet);
  cushion.position.y = phan.top;
  g.add(cushion);
  g.add(mesh(ring(0.7, 0.012, phan.top + 0.06), mats.gold));
  const blade = new THREE.Shape();
  blade.moveTo(0, 0);
  blade.lineTo(0.06, 0.02);
  blade.bezierCurveTo(0.07, 0.4, 0.04, 0.72, 0, 0.98);
  blade.bezierCurveTo(-0.012, 0.62, -0.024, 0.3, -0.034, 0.02);
  blade.lineTo(0, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(blade, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 20 });
  const half = (side: 1 | -1) => {
    const hg = new THREE.Group();
    const b = mesh(bladeGeo, mats.steel);
    b.position.z = side * 0.012;
    hg.add(b);
    const shank = mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.26, 12), mats.steel);
    shank.position.set(0, -0.13, side * 0.012);
    hg.add(shank);
    const bow = filigreeHandle(mats, side);
    bow.position.set(side * 0.03, -0.38, side * 0.012);
    hg.add(bow);
    hg.rotation.z = side * 0.18;
    return hg;
  };
  const shears = new THREE.Group();
  shears.add(half(1), half(-1));
  shears.add(mesh(new THREE.SphereGeometry(0.034, 16, 12), mats.goldBright));
  shears.rotation.set(-Math.PI / 2, 0, 0.7);
  shears.position.set(0.02, phan.top + 0.235, 0.04);
  g.add(shears);
  return g;
}

/* ─── 4. Bangvil popil: the engraved brass leaf with its candle ─────────── */

function buildPopil(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.66, height: 0.34 });
  g.add(phan.group);
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0);
  leaf.bezierCurveTo(-0.5, 0.1, -0.62, 0.6, -0.34, 0.9);
  leaf.bezierCurveTo(-0.18, 1.06, -0.06, 1.18, 0, 1.42);
  leaf.bezierCurveTo(0.06, 1.18, 0.18, 1.06, 0.34, 0.9);
  leaf.bezierCurveTo(0.62, 0.6, 0.5, 0.1, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leaf, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.022, bevelSegments: 4, curveSegments: 32 });
  const p = leafGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + 0.1 * Math.pow(p.getX(i) / 0.6, 2));
  leafGeo.computeVertexNormals();
  leafGeo.scale(0.66, 0.66, 0.66);
  const popil = new THREE.Group();
  popil.add(mesh(leafGeo, mats.brass));
  popil.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.03, 0.04), new THREE.Vector3(0, 0.46, 0.06), new THREE.Vector3(0, 0.88, 0.06)]), 24, 0.012, 8), mats.goldBright));
  for (const s of [-1, 1]) {
    for (const t of [0.25, 0.45]) {
      popil.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, t, 0.055), new THREE.Vector3(s * 0.12, t + 0.08, 0.055), new THREE.Vector3(s * 0.22, t + 0.2, 0.05),
      ]), 12, 0.006, 6), mats.goldBright));
    }
  }
  const handle = mesh(new THREE.CylinderGeometry(0.028, 0.036, 0.26, 16), mats.brass);
  handle.position.set(0, -0.12, 0.02);
  popil.add(handle);
  popil.add(mesh(new THREE.SphereGeometry(0.04, 16, 12), mats.goldBright));
  popil.rotation.set(-1.0, 0, 0);
  popil.position.set(0, phan.top + 0.1, 0.2);
  g.add(popil);
  const candle = mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.56, 24), mats.wax);
  candle.position.set(0, phan.top + 0.36, 0.2);
  g.add(candle);
  const wick = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 6), mats.stem, false);
  wick.position.set(0, phan.top + 0.66, 0.2);
  g.add(wick);
  const flame = new THREE.Mesh(lathe([[0, 0], [0.04, 0.04], [0.045, 0.09], [0.026, 0.15], [0, 0.21]], 24), mats.flame);
  flame.position.set(0, phan.top + 0.665, 0.2);
  g.add(flame);
  const glow = new THREE.PointLight("#ffb35c", 2.2, 2.4, 2);
  glow.position.set(0, phan.top + 0.78, 0.25);
  g.add(glow);
  return g;
}

/* ─── 5. Sampeah pthem: a pair of slathor (ស្លាធម៌) ──────────────────────
   Cones of tiered betel leaves crowned with areca nut, each on a small
   engraved brass phan. */
function betelLeafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.08, 0.01, -0.1, 0.08, -0.06, 0.13);
  s.bezierCurveTo(-0.03, 0.17, -0.01, 0.2, 0, 0.24);
  s.bezierCurveTo(0.01, 0.2, 0.03, 0.17, 0.06, 0.13);
  s.bezierCurveTo(0.1, 0.08, 0.08, 0.01, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 12 });
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - 0.04 * Math.pow(p.getX(i) / 0.1, 2));
  geo.computeVertexNormals();
  return geo;
}

function buildSlathor(mats: KhmerMaterials, leafGeo: THREE.BufferGeometry, height: number): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.34, height: 0.3, material: mats.brass });
  g.add(phan.group);
  const tiers = 7;
  const r0 = 0.26;
  const parts: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  for (let t = 0; t < tiers; t++) {
    const f = t / tiers;
    const r = r0 * (1 - f * 0.86);
    const y = phan.top + f * height;
    const n = Math.max(5, Math.round((2 * Math.PI * r) / 0.085));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.4;
      const leaf = leafGeo.clone();
      // Tips up and outward, overlapping the tier below like scales
      m.makeRotationX(0.55);
      leaf.applyMatrix4(m);
      m.makeRotationY(a);
      leaf.applyMatrix4(m);
      m.makeTranslation(Math.sin(a) * r, y, Math.cos(a) * r);
      leaf.applyMatrix4(m);
      parts.push(leaf);
    }
  }
  g.add(mesh(mergeGeometries(parts)!, mats.betel));
  const top = phan.top + height + 0.02;
  const nut = mesh(new THREE.SphereGeometry(0.07, 24, 18), mats.areca);
  nut.scale.set(1, 1.15, 1);
  nut.position.y = top + 0.05;
  g.add(nut);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const half = mesh(new THREE.SphereGeometry(0.045, 16, 12, 0, Math.PI), mats.areca);
    half.position.set(Math.cos(a) * 0.09, top - 0.02, Math.sin(a) * 0.09);
    half.rotation.y = -a;
    g.add(half);
  }
  return g;
}

function buildSampeah(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const leafGeo = betelLeafGeometry();
  const left = buildSlathor(mats, leafGeo, 0.78);
  left.position.x = -0.38;
  const right = buildSlathor(mats, leafGeo, 0.7);
  right.position.set(0.38, 0, -0.04);
  g.add(left, right);
  return g;
}

/* ─── 6. Chong dai: coils of twisted red cotton on a gold tray ──────────── */

function buildChongdai(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.86, height: 0.28 });
  g.add(phan.group);
  const rnd = seeded(11);
  for (let k = 0; k < 3; k++) {
    const pts: THREE.Vector3[] = [];
    const turns = 3.4;
    const r0 = 0.2 + k * 0.11;
    for (let i = 0; i <= 110; i++) {
      const t = i / 110;
      const a = t * Math.PI * 2 * turns + k * 1.7;
      const r = r0 + Math.sin(t * 9 + k) * 0.025;
      pts.push(new THREE.Vector3(Math.cos(a) * r, phan.top + 0.03 + 0.022 * k + t * 0.04 + rnd() * 0.01, Math.sin(a) * r));
    }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.028, 10), mats.redThread));
  }
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.42, phan.top + 0.09, 0.1), new THREE.Vector3(0.56, phan.top + 0.08, 0.26), new THREE.Vector3(0.62, phan.top + 0.05, 0.4),
  ]), 40, 0.026, 10), mats.redThread));
  const knot = mesh(new THREE.TorusKnotGeometry(0.035, 0.016, 48, 8, 2, 3), mats.redThread);
  knot.position.set(0.63, phan.top + 0.06, 0.42);
  g.add(knot);
  return g;
}

/* ─── 7. Bach phka sla: areca blossom and popped rice in a deep phan ────── */

function buildPetals(mats: KhmerMaterials): THREE.Group {
  const g = new THREE.Group();
  const phan = buildPhan(mats, { radius: 0.8, height: 0.58, deep: true });
  g.add(phan.group);
  const rnd = seeded(29);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const riceN = 520;
  const rice = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.022, 0), mats.rice, riceN);
  rice.castShadow = true;
  for (let i = 0; i < riceN; i++) {
    const r = Math.sqrt(rnd()) * 0.66;
    const a = rnd() * Math.PI * 2;
    const y = phan.top + 0.02 + (1 - (r / 0.66) ** 2) * 0.16 + rnd() * 0.02;
    e.set(rnd() * 3, rnd() * 3, rnd() * 3);
    q.setFromEuler(e);
    const s = 0.7 + rnd() * 0.7;
    m.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(s * 1.2, s * 0.8, s));
    rice.setMatrixAt(i, m);
  }
  g.add(rice);
  const floretGeo = new THREE.SphereGeometry(0.016, 7, 5);
  floretGeo.scale(1, 0.8, 1);
  const strands = 7;
  const perStrand = 34;
  const flor = new THREE.InstancedMesh(floretGeo, mats.floret, strands * perStrand);
  flor.castShadow = true;
  let fi = 0;
  q.identity();
  for (let k = 0; k < strands; k++) {
    const a = (k / strands) * Math.PI * 2 + 0.3;
    const reach = 0.55 + (k % 3) * 0.12;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.06, phan.top + 0.16, Math.sin(a) * 0.06),
      new THREE.Vector3(Math.cos(a) * reach * 0.5, phan.top + 0.52 + (k % 2) * 0.08, Math.sin(a) * reach * 0.5),
      new THREE.Vector3(Math.cos(a) * reach, phan.top + 0.3, Math.sin(a) * reach),
    ]);
    g.add(mesh(new THREE.TubeGeometry(curve, 30, 0.007, 5), mats.gold));
    for (let j = 0; j < perStrand; j++) {
      const pnt = curve.getPoint(0.18 + (j / perStrand) * 0.8);
      pnt.add(new THREE.Vector3((rnd() - 0.5) * 0.05, (rnd() - 0.3) * 0.04, (rnd() - 0.5) * 0.05));
      m.compose(pnt, q, new THREE.Vector3(1, 1, 1));
      flor.setMatrixAt(fi++, m);
    }
  }
  g.add(flor);
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

/** The ceremony object on its phan, standing on a marble slab */
export function buildCeremonyPiece(kind: CeremonyKind, mats: KhmerMaterials): THREE.Group {
  const root = new THREE.Group();
  root.add(buildSlab(mats));
  const obj = BUILDERS[kind](mats);
  obj.position.y = 0.115;
  root.add(obj);
  return root;
}
