export type MapTransform = { x: number; y: number; k: number };

// Session-only: preserve the user's choice across map remounts and rotation.
let savedTransform: MapTransform = { x: 0, y: 0, k: 1 };
export const getArMapTransform = () => ({ ...savedTransform });
export function saveArMapTransform(value: MapTransform) {
  savedTransform = { x: value.x, y: value.y, k: Math.max(0.4, Math.min(1.5, value.k)) };
}

/** Fit the displayed map without overwriting its saved position or scale. */
export function fitArMapTransform(value: MapTransform, bounds: {
  left: number; top: number; width: number; height: number; viewportWidth: number; viewportHeight: number;
}): MapTransform {
  const fit = (offset: number, origin: number, size: number, available: number) => {
    const min = 12 - origin;
    const max = Math.max(min, available - 12 - origin - size * value.k);
    return Math.max(min, Math.min(max, offset));
  };
  return { k: value.k, x: fit(value.x, bounds.left, bounds.width, bounds.viewportWidth), y: fit(value.y, bounds.top, bounds.height, bounds.viewportHeight) };
}