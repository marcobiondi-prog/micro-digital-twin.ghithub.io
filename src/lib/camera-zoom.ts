// AI camera zoom: hardware track zoom where the camera exposes it, otherwise a centred digital
// crop applied identically to preview, tracker sample, recognition frame and saved photos.

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 5;
/** Lens stops: the side chips jump to the neighbouring ones; pinch moves freely between them. */
export const ZOOM_LENSES = [1, 2, 3, 5] as const;
/** Fine presets for stepping. */
export const ZOOM_STEPS = [1, 1.5, 2, 3, 4, 5] as const;

export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 10) / 10));

/** Next preset in a direction; from an in-between pinch value it snaps to the nearest preset beyond it. */
export function zoomStep(current: number, direction: 1 | -1): number {
  if (direction > 0) return ZOOM_STEPS.find((s) => s > current + 0.05) ?? ZOOM_MAX;
  return [...ZOOM_STEPS].reverse().find((s) => s < current - 0.05) ?? ZOOM_MIN;
}

/** Pinch: zoom follows the ratio between the current and the starting finger distance. */
export function pinchZoom(startZoom: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return clampZoom(startZoom);
  return clampZoom(startZoom * (distance / startDistance));
}

export const zoomLabel = (z: number) => `${z.toLocaleString("it-IT", { maximumFractionDigits: 1 })}×`;

type ZoomRange = { min: number; max: number };
type ZoomCapabilities = MediaTrackCapabilities & { zoom?: { min?: number; max?: number } };

/** Hardware zoom range when the camera exposes one (Chrome on Android); null elsewhere. */
export function trackZoomRange(track: MediaStreamTrack | undefined): ZoomRange | null {
  try {
    const zoom = (track?.getCapabilities() as ZoomCapabilities | undefined)?.zoom;
    if (!zoom || typeof zoom.min !== "number" || typeof zoom.max !== "number" || zoom.max <= zoom.min) return null;
    return { min: zoom.min, max: zoom.max };
  } catch { return null; }
}

/**
 * Splits a requested zoom into the hardware part (sensor, sharper) and the digital rest.
 * Hardware 1× is the camera's own minimum; anything beyond its maximum is cropped digitally.
 */
export function splitZoom(zoom: number, range: ZoomRange | null): { hardware: number | null; digital: number } {
  const z = clampZoom(zoom);
  if (!range) return { hardware: null, digital: z };
  const hardware = Math.min(range.max, Math.max(range.min, range.min * z));
  return { hardware, digital: Math.max(1, z / (hardware / range.min)) };
}

/** Applies hardware zoom, one request at a time; a pinch only sends its latest value. */
export function createTrackZoomer(track: MediaStreamTrack | undefined) {
  let busy = false;
  let pending: number | null = null;
  const run = async (value: number) => {
    busy = true;
    try { await track?.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] }); }
    catch { /* Unsupported or busy camera: the digital crop still applies. */ }
    busy = false;
    if (pending !== null) { const next = pending; pending = null; void run(next); }
  };
  return (value: number) => { if (busy) pending = value; else void run(value); };
}

/** Haptic patterns (ms), like a lens dial: light tick each 0.5×, firm detent on a lens stop, double bump at the limits. */
export const ZOOM_HAPTICS = { tick: [22], stop: [55, 8, 40], limit: [80, 40, 80] } as const;

/**
 * Feedback for a zoom change from `prev` to `next`: the limit bump when reaching 1× or 5×, a detent when
 * landing on or crossing a lens stop, a light tick when crossing a half step, nothing otherwise.
 */
export function zoomHaptic(prev: number, next: number): readonly number[] | null {
  if (Math.abs(next - prev) < 0.05) return null;
  if ((next <= ZOOM_MIN && prev > ZOOM_MIN) || (next >= ZOOM_MAX && prev < ZOOM_MAX)) return ZOOM_HAPTICS.limit;
  const lo = Math.min(prev, next), hi = Math.max(prev, next);
  // A stop counts when the move reaches it from either side, not when it merely starts there.
  if (ZOOM_LENSES.some((s) => s !== prev && s > lo - 0.05 && s < hi + 0.05)) return ZOOM_HAPTICS.stop;
  if (Math.floor(prev * 2) !== Math.floor(next * 2)) return ZOOM_HAPTICS.tick;
  return null;
}
