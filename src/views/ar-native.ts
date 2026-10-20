// Ancoraggio reale al suolo via WebXR (Android ARCore) o visore nativo di sistema.
// iOS: Quick Look (LiDAR su iPhone Pro). Android senza WebXR: Scene Viewer.
import * as THREE from "three";
import { arColorToken } from "@/views/ar-scene";
import { compactPlantHeight } from "@/models/ar-placement";

export type NativeArSupport = "webxr" | "scene-viewer" | "quick-look" | "none";

/** Rileva il miglior canale AR nativo disponibile sul dispositivo. */
export async function detectNativeAr(): Promise<NativeArSupport> {
  const nav = navigator as Navigator & { xr?: { isSessionSupported?: (m: string) => Promise<boolean> } };
  if (nav.xr?.isSessionSupported) {
    try {
      if (await nav.xr.isSessionSupported("immersive-ar")) return "webxr";
    } catch {
      /* continua */
    }
  }
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "scene-viewer";
  if (/iphone|ipad|ipod/i.test(ua)) return "quick-look";
  return "none";
}

/** Apre il visore nativo di sistema col modello GLB (Scene Viewer / Quick Look). */
export function openSystemViewer(glbUrl: string, title: string) {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    const params = new URLSearchParams({
      file: glbUrl,
      mode: "ar_only",
      title,
      link: window.location.href,
    });
    window.location.href = `intent://arvr.google.com/scene-viewer/1.0?${params}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`;
    return;
  }
  // iOS Quick Look: richiede un <a rel="ar"> con usdz o glb.
  const a = document.createElement("a");
  a.rel = "ar";
  a.href = glbUrl;
  a.append(document.createElement("img"));
  a.click();
}

export type WebXrSession = {
  active: boolean;
  stop: () => Promise<void>;
  removeLast: () => void;
  clear: () => void;
};

/**
 * Sessione WebXR immersive-ar con hit-test: gli alberi si ancorano al piano reale
 * rilevato da ARCore e restano fermi mentre l'utente si muove.
 * Restituisce null se il dispositivo non supporta WebXR AR.
 */
export async function startWebXR(opts: {
  image: HTMLCanvasElement;
  overlay: HTMLElement;
  onPlaced?: (count: number) => void;
  onEnded?: () => void;
}): Promise<WebXrSession | null> {
  const nav = navigator as Navigator & {
    xr?: {
      isSessionSupported?: (m: string) => Promise<boolean>;
      requestSession?: (m: string, o?: object) => Promise<XRSession>;
    };
  };
  if (!nav.xr?.requestSession) return null;
  let session: XRSession;
  try {
    session = await nav.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test", "dom-overlay"],
      optionalFeatures: ["local-floor", "bounded-floor", "plane-detection"],
      domOverlay: { root: opts.overlay },
    });
  } catch {
    return null;
  }

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.xr.enabled = true;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  Object.assign(renderer.domElement.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    touchAction: "none",
  });
  document.body.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);
  const ink = arColorToken("--ar-outline");

  // Reticolo di mira che segue il piano reale.
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.12, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: ink, transparent: true, opacity: 0.9 }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  const grid = new THREE.GridHelper(8, 16, ink, ink);
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.3;
  gridMaterial.depthWrite = false;
  grid.visible = false;
  scene.add(grid);

  // A flat photograph of the scanned plant, never a geometric tree model.
  const makeTree = () => {
    const texture = new THREE.CanvasTexture(opts.image);
    texture.colorSpace = THREE.SRGBColorSpace;
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(opts.image.width / opts.image.height, 1),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }),
    );
    photo.position.y = 0.5;
    const group = new THREE.Group();
    group.add(photo);
    return group;
  };
  const plants: THREE.Group[] = [];

  let placed = 0;
  let hitSource: XRHitTestSource | null = null;
  let refSpace: XRReferenceSpace | null = null;

  const onSelect = () => {
    if (!reticle.visible) return;
    const tree = makeTree();
    tree.position.setFromMatrixPosition(reticle.matrix);
    scene.add(tree);
    plants.push(tree);
    placed += 1;
    opts.onPlaced?.(placed);
  };
  session.addEventListener("select", onSelect);

  const onFrame = (_t: number, frame?: XRFrame) => {
    if (frame && hitSource && refSpace) {
      const hits = frame.getHitTestResults(hitSource);
      const hit = hits[0];
      if (hit) {
        const pose = hit.getPose(refSpace);
        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
          grid.visible = true;
          grid.position.setFromMatrixPosition(reticle.matrix);
          grid.position.y += 0.005;
        }
      } else {
        reticle.visible = false;
      }
    }
    const viewer = renderer.xr.getCamera().getWorldPosition(new THREE.Vector3());
    plants.forEach(plant => {
      plant.scale.setScalar(compactPlantHeight(viewer.distanceTo(plant.position), 60, window.innerWidth / window.innerHeight, opts.image.width / opts.image.height));
      plant.rotation.y = Math.atan2(viewer.x - plant.position.x, viewer.z - plant.position.z);
    });
    renderer.render(scene, camera);
  };

  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => { if (m instanceof THREE.MeshBasicMaterial) m.map?.dispose(); m.dispose(); });
      }
    });
    hitSource?.cancel();
    session.removeEventListener("select", onSelect);
    renderer.domElement.remove();
    renderer.dispose();
    opts.onEnded?.();
  };
  session.addEventListener("end", cleanup, { once: true });
  try {
  void session.updateTargetFrameRate?.(60);
    refSpace = await session.requestReferenceSpace("local");
    const viewerSpace = await session.requestReferenceSpace("viewer");
    hitSource = (await session.requestHitTestSource?.({ space: viewerSpace })) ?? null;
    await renderer.xr.setSession(session);
    renderer.setAnimationLoop(onFrame);
  } catch {
    await session.end().catch(() => {});
    cleanup();
    return null;
  }
  return {
    active: true,
    removeLast: () => {
      const plant = plants.pop();
      if (!plant) return;
      scene.remove(plant);
      plant.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const material = object.material as THREE.MeshBasicMaterial; material.map?.dispose(); material.dispose(); } });
      placed = plants.length;
      opts.onPlaced?.(placed);
    },
    clear: () => {
      plants.splice(0).forEach(plant => { scene.remove(plant); plant.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const material = object.material as THREE.MeshBasicMaterial; material.map?.dispose(); material.dispose(); } }); });
      placed = 0;
      opts.onPlaced?.(0);
    },
    stop: async () => {
      await session.end().catch(() => {});
      cleanup();
    },
  };
}
