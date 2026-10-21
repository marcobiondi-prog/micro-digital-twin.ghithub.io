import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

/**
 * Photorealistic 3D view of the selected place (Google Maps JavaScript API, `maps3d`
 * library, billed through Map Tiles API). Loaded only when the user switches to 3D, with
 * the referrer-restricted browser key; the 2D embed stays the default.
 */
type Maps3D = { Map3DElement: new (options: Record<string, unknown>) => HTMLElement; Marker3DElement: new (options: Record<string, unknown>) => HTMLElement };
type GoogleMaps = { maps: { importLibrary: (name: string) => Promise<unknown> } };

let loader: Promise<Maps3D> | undefined;

function loadMaps3D(key: string): Promise<Maps3D> {
  loader ??= new Promise<Maps3D>((resolve, reject) => {
    const w = window as typeof window & { google?: GoogleMaps; __mdtMaps3dReady?: () => void };
    const done = () => w.google!.maps.importLibrary("maps3d").then((lib) => resolve(lib as Maps3D), reject);
    if (w.google?.maps?.importLibrary) { void done(); return; }
    w.__mdtMaps3dReady = () => void done();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=beta&language=it&region=IT&loading=async&callback=__mdtMaps3dReady`;
    script.async = true;
    script.onerror = () => reject(new Error("Maps JavaScript API non raggiungibile"));
    document.head.appendChild(script);
  }).catch((error) => { loader = undefined; throw error; });
  return loader;
}

export function LocationMap3D({ lat, lng, label, apiKey }: { lat: number; lng: number; label: string; apiKey: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    setState("loading");
    loadMaps3D(apiKey).then(({ Map3DElement, Marker3DElement }) => {
      if (cancelled || !el) return;
      // Oblique view from ~350 m, centred on the reference point, so buildings and trees read in depth.
      const map = new Map3DElement({ center: { lat, lng, altitude: 0 }, range: 350, tilt: 62, heading: 20, mode: "HYBRID" });
      map.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
      // GREEDY: one finger moves the camera; the AUTO default turns cooperative inside a
      // scrollable page and asks for two fingers. Set as a property so older builds ignore it.
      (map as HTMLElement & { gestureHandling?: string }).gestureHandling = "GREEDY";
      map.append(new Marker3DElement({ position: { lat, lng }, label }));
      el.replaceChildren(map);
      setState("ready");
    }).catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; el?.replaceChildren(); };
  }, [lat, lng, label, apiKey]);
  return <div className="relative h-36 w-full overflow-hidden bg-lab-surface sm:h-40">
    {/* touch-none + data-map-gestures: drag, pinch and rotate belong to the 3D map, not to the page. */}
    <div ref={host} data-map-gestures="" className="absolute inset-0 touch-none" aria-label={`Vista 3D di ${label}`} role="img" />
    {state === "loading" && <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" aria-label="Caricamento vista 3D" /></div>}
    {state === "error" && <p role="status" className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-muted-foreground">Vista 3D non disponibile: abilita Maps JavaScript API e Map Tiles API sulla chiave browser.</p>}
  </div>;
}
