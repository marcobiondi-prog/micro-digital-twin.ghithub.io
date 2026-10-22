import { getCopernicusReading } from "@/controllers/copernicus.functions";
import type { CopernicusReading } from "@/models/copernicus";

export type CopernicusResult = CopernicusReading & { configured: boolean };

// One request per place per page: the Lab panel and the AI camera share the same reading.
const readings = new Map<string, Promise<CopernicusResult>>();

export function loadCopernicus(lat: number, lng: number): Promise<CopernicusResult> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  let pending = readings.get(key);
  if (!pending) {
    pending = getCopernicusReading({ data: { lat, lng } });
    // Failures and partial answers are not kept, so the next request tries again.
    void pending.then((r) => { if (!r.configured || r.errors.length) readings.delete(key); }, () => readings.delete(key));
    readings.set(key, pending);
  }
  return pending;
}
