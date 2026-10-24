/* One WebGL renderer for every ceremony piece on the page.

   Browsers cap live WebGL contexts (and phones pay for each one), so instead
   of a canvas-per-object the pieces share a single offscreen renderer: each
   frame is drawn into a viewport of it and copied onto that piece's own 2D
   canvas. Nothing renders continuously; a piece is redrawn only when its
   pose changes (scroll, hover, reveal). */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildCeremonyPiece, createMaterials, type CeremonyKind, type KhmerMaterials } from "./assets";

export interface PiecePose {
  /** Turn about the vertical axis (radians) */
  rotY: number;
  /** Camera lean from pointer, -1..1 */
  tiltX: number;
  tiltY: number;
  /** 0 = sunk into the page, 1 = fully presented */
  reveal: number;
}

export interface KhmerEngine {
  /** false once the GPU context is gone: callers switch to their fallback */
  draw(kind: CeremonyKind, target: HTMLCanvasElement, pose: PiecePose, accent?: string): boolean;
  dispose(): void;
}

let shared: Promise<KhmerEngine | null> | null = null;

export function getKhmerEngine(accent: string): Promise<KhmerEngine | null> {
  if (!shared) shared = createEngine(accent);
  return shared;
}

function lowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || (navigator.hardwareConcurrency || 8) <= 4;
}

async function createEngine(accent: string): Promise<KhmerEngine | null> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "low-power" });
  } catch {
    return null; // No WebGL: callers keep their illustrated fallback
  }
  const lowPower = lowPowerDevice();
  renderer.setPixelRatio(1); // targets are sized in device pixels by the caller
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  let lost = false;
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
  });

  // Image-based light so metal has something real to reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const mats: KhmerMaterials = createMaterials(accent);

  const scene = new THREE.Scene();
  scene.environment = envTex;
  scene.environmentIntensity = 0.62;

  // Three-point rig. Key: warm, high and slightly left, rakes across the
  // engraving and casts the contact shadow
  const key = new THREE.DirectionalLight("#ffeccc", 3.2);
  // High and only slightly to the left: shadows stay short and inside the frame
  key.position.set(-1.4, 5.6, 1.8);
  key.castShadow = true;
  key.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
  key.shadow.camera.left = -1.8;
  key.shadow.camera.right = 1.8;
  key.shadow.camera.top = 1.8;
  key.shadow.camera.bottom = -1.8;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 10;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  // Fill: cool and soft from the front right, opens the shadow side
  const fill = new THREE.DirectionalLight("#dfe8ff", 0.85);
  fill.position.set(3, 2.2, 3.4);
  scene.add(fill);
  // Rim: golden, from behind, draws the silhouette off the paper
  const rim = new THREE.DirectionalLight("#ffd27a", 1.6);
  rim.position.set(1.8, 2.6, -3.6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight("#fff6e8", "#4a3c2c", 0.22));

  // Contact shadow onto the page itself (the canvas is transparent)
  // Shadow-catcher only under the pedestal's footprint, so no shadow is ever
  // cut off by the edge of the frame
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), new THREE.ShadowMaterial({ opacity: 0.3 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
  const pieces = new Map<CeremonyKind, THREE.Group>();
  // Each piece's bounds, measured once, so the camera frames it whole
  const bounds = new Map<CeremonyKind, THREE.Sphere>();
  let current: THREE.Group | null = null;
  let bufW = 0;
  let bufH = 0;

  const piece = (kind: CeremonyKind) => {
    let p = pieces.get(kind);
    if (!p) {
      p = buildCeremonyPiece(kind, mats);
      pieces.set(kind, p);
      bounds.set(kind, new THREE.Box3().setFromObject(p).getBoundingSphere(new THREE.Sphere()));
    }
    return p;
  };

  return {
    draw(kind, target, pose, accent) {
      if (lost) return false;
      // Lacquer is the accent sunk deep, as real lacquerware is darker than its pigment
      if (accent) mats.lacquer.color.set(accent).multiplyScalar(0.36);
      const w = target.width;
      const h = target.height;
      if (!w || !h) return true;
      if (w > bufW || h > bufH) {
        bufW = Math.max(bufW, w);
        bufH = Math.max(bufH, h);
        renderer.setSize(bufW, bufH, false);
      }
      const p = piece(kind);
      if (current !== p) {
        if (current) scene.remove(current);
        scene.add(p);
        current = p;
      }
      // Rise out of the page as it is revealed, turn with scroll
      const ease = 1 - Math.pow(1 - pose.reveal, 3);
      p.position.y = -0.6 * (1 - ease);
      p.rotation.y = pose.rotY;
      const s = 0.82 + 0.18 * ease;
      p.scale.setScalar(s);

      camera.aspect = w / h;
      const elev = 0.42 - pose.tiltY * 0.1;
      const az = pose.tiltX * 0.22;
      // Fit the bounding sphere into the narrower field of view, with margin
      const sphere = bounds.get(kind)!;
      const vFov = THREE.MathUtils.degToRad(camera.fov) / 2;
      const hFov = Math.atan(Math.tan(vFov) * camera.aspect);
      // A sphere round a wide, low piece over-estimates its height: frame tighter
      const dist = (sphere.radius * 0.8) / Math.sin(Math.min(vFov, hFov));
      const cy = sphere.center.y;
      camera.position.set(Math.sin(az) * dist * Math.cos(elev), cy + Math.sin(elev) * dist, Math.cos(az) * dist * Math.cos(elev));
      camera.lookAt(0, cy, 0);
      camera.updateProjectionMatrix();

      renderer.setViewport(0, bufH - h, w, h);
      renderer.setScissor(0, bufH - h, w, h);
      renderer.setScissorTest(true);
      renderer.clear();
      renderer.render(scene, camera);

      const ctx = target.getContext("2d");
      if (!ctx) return false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(renderer.domElement, 0, 0, w, h, 0, 0, w, h);
      return true;
    },
    dispose() {
      pieces.forEach((p) => p.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      }));
      Object.values(mats).forEach((m) => m.dispose());
      envTex.dispose();
      renderer.dispose();
      shared = null;
    },
  };
}
