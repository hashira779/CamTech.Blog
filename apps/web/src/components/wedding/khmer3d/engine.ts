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
  renderer.toneMappingExposure = 0.92;
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
  scene.environmentIntensity = 0.7;

  // Warm key from upper left (rakes across the carving), cool soft fill
  const key = new THREE.DirectionalLight("#fff0d2", 3.4);
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
  scene.add(new THREE.HemisphereLight("#fff6e8", "#4a3c2c", 0.3));
  const rim = new THREE.DirectionalLight("#ffe2b0", 0.9);
  rim.position.set(2.5, 1.6, -2.8);
  scene.add(rim);

  // Contact shadow onto the page itself (the canvas is transparent)
  // Shadow-catcher only under the pedestal's footprint, so no shadow is ever
  // cut off by the edge of the frame
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), new THREE.ShadowMaterial({ opacity: 0.26 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
  const pieces = new Map<CeremonyKind, THREE.Group>();
  let current: THREE.Group | null = null;
  let bufW = 0;
  let bufH = 0;

  const piece = (kind: CeremonyKind) => {
    let p = pieces.get(kind);
    if (!p) {
      p = buildCeremonyPiece(kind, mats);
      pieces.set(kind, p);
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
      const elev = 0.44 - pose.tiltY * 0.1;
      const az = pose.tiltX * 0.22;
      const dist = 5.2;
      camera.position.set(Math.sin(az) * dist * Math.cos(elev), Math.sin(elev) * dist, Math.cos(az) * dist * Math.cos(elev));
      camera.lookAt(0, 0.74, 0);
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
