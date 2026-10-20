import type { VineZoneState } from "./lab-store";

export const vineyardLimits = { temperature: 45, moisture: 60, wind: 30 } as const;
export type VineyardControl = keyof typeof vineyardLimits;
export const controlValue = (value: number, key: VineyardControl) =>
  Math.round(Math.max(0, Math.min(vineyardLimits[key], value)) * 10) / 10;

/** Interventions of the three Confronta cards: irrigation boost (%) and canopy cooling (°C). */
export const vineyardScenarioSteps = [
  { id: "zero", boost: 0, cool: 0 },
  { id: "mvp", boost: 8, cool: 1 },
  { id: "roadmap", boost: 15, cool: 2.5 },
] as const;
export type VineyardScenarioId = (typeof vineyardScenarioSteps)[number]["id"];

export function vineyardControlValue(zones: VineZoneState[], selected: number | null, key: VineyardControl) {
  const raw = selected === null
    ? zones.reduce((sum, zone) => sum + zone[key], 0) / Math.max(1, zones.length)
    : zones[selected]?.[key] ?? 0;
  return controlValue(raw, key);
}

export function applyVineyardScenario(zones: VineZoneState[], boost: number, cool: number, selected: number | null) {
  return zones.map((zone, index) => selected === null || index === selected ? {
    ...zone,
    temperature: controlValue(zone.temperature - cool, "temperature"),
    moisture: controlValue(zone.moisture + boost, "moisture"),
  } : zone);
}

/** The Confronta card whose temperature/moisture values are closest to the current sliders (same scope as the cards). */
export function closestVineyardScenario(current: VineZoneState[], base: VineZoneState[], selected: number | null): VineyardScenarioId {
  let best: VineyardScenarioId = "zero", bestDistance = Infinity;
  for (const step of vineyardScenarioSteps) {
    const target = applyVineyardScenario(base, step.boost, step.cool, selected);
    const distance = target.reduce((sum, zone, index) => {
      const now = current[index];
      return now ? sum + Math.abs(now.temperature - zone.temperature) + Math.abs(now.moisture - zone.moisture) : sum;
    }, 0);
    if (distance < bestDistance - 1e-9) { best = step.id; bestDistance = distance; }
  }
  return best;
}

export function updateVineyardControl(zones: VineZoneState[], selected: number | null, key: VineyardControl, value: number) {
  const target = controlValue(value, key);
  if (selected !== null) return zones.map((zone, index) => index === selected ? { ...zone, [key]: target } : zone);
  // A shared shift reaches the requested mean even when a zone hits a limit.
  let low = -Math.max(vineyardLimits[key], ...zones.map((zone) => zone[key]));
  let high: number = vineyardLimits[key];
  for (let i = 0; i < 50; i++) {
    const delta = (low + high) / 2;
    const mean = zones.reduce((sum, zone) => sum + Math.max(0, Math.min(vineyardLimits[key], zone[key] + delta)), 0) / Math.max(1, zones.length);
    if (mean < target) low = delta; else high = delta;
  }
  return zones.map((zone) => ({ ...zone, [key]: controlValue(zone[key] + (low + high) / 2, key) }));
}
