/** Display dimensions only; shrinking the photograph does not change botanical estimates. */
export function compactPlantHeight(distance: number, verticalFov: number, aspect: number, imageAspect: number, requested = 0.75) {
  if (![distance, verticalFov, aspect, imageAspect, requested].every(Number.isFinite) || distance <= 0 || aspect <= 0 || imageAspect <= 0) return 0;
  const visibleHeight = 2 * distance * Math.tan(verticalFov * Math.PI / 360);
  return Math.max(0, Math.min(requested, visibleHeight * 0.28, visibleHeight * aspect * 0.35 / imageAspect));
}

export type PlacementCooling = { deltaT: number; shadeM2: number } | null;
export function isPlacementOutsideHud(x: number, y: number, bounds: { left: number; right: number; top: number; bottom: number }[]) {
  return !bounds.some(box => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
}
/** Resize step for a placed photograph; clamped so it stays readable and inside the ground plane. */
export function nextPlantHeight(requested: number, factor: number) {
  if (!Number.isFinite(requested) || !Number.isFinite(factor) || factor <= 0) return requested;
  return Math.round(Math.max(0.15, Math.min(1.5, requested * factor)) * 1000) / 1000;
}

/** Conservative scenario ceiling; summed shade is theoretical, not a surveyed ground area. */
export function placementThermal(items: PlacementCooling[]) {
  const known = items.filter((item): item is NonNullable<PlacementCooling> => item !== null);
  return {
    count: items.length,
    unknown: items.length - known.length,
    deltaT: Math.round(Math.min(3, known.reduce((sum, item) => sum + Math.max(0, item.deltaT), 0)) * 1000) / 1000,
    shadeM2: Math.round(known.reduce((sum, item) => sum + Math.max(0, item.shadeM2), 0)),
  };
}
export const MAX_SCANNED_SPECIMENS = 9;
export function scannedSpecimenCount(requested: number) {
  return Number.isFinite(requested) ? Math.min(MAX_SCANNED_SPECIMENS, Math.max(0, Math.round(requested))) : 0;
}
/** Estimates depend on count, never on a contour or a rendered photograph. */
export function scannedSpecimenThermal(count: number, cooling: PlacementCooling) {
  return placementThermal(Array.from({ length: scannedSpecimenCount(count) }, () => cooling));
}

/** Decimals for a cooling value: tenths, or hundredths for small plants so each specimen still shows a change. */
export const coolingDigits = (deltaT: number) => (Math.abs(deltaT) > 0 && Math.abs(deltaT) < 0.095 ? 2 : 1);

/** Unsigned Italian cooling amount: "0,4", "0,03", or "< 0,01" for a non-zero effect too small to print. */
export function coolingAmount(deltaT: number, digits = coolingDigits(deltaT)) {
  const v = Math.abs(deltaT);
  if (v > 0 && v < 0.005) return "< 0,01";
  return v.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** "≈ −0,4 °C", "≈ −0,03 °C", "< 0,01 °C". */
export function coolingLabel(deltaT: number) {
  const amount = coolingAmount(deltaT);
  return amount.startsWith("<") ? `${amount} °C` : `≈ −${amount} °C`;
}

/** "Before → after" for the balance: base air temperature (when known) minus the estimated cooling. */
export function coolingReadout(baseTemp: number | null, deltaT: number) {
  const digits = coolingDigits(deltaT);
  const round = (v: number) => Math.round(v * 10 ** digits) / 10 ** digits;
  return { before: baseTemp === null ? null : round(baseTemp), after: baseTemp === null ? null : round(baseTemp - deltaT), delta: round(deltaT), digits };
}
