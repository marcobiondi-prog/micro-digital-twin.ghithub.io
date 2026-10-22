/**
 * Copernicus Data Space Ecosystem (Sentinel Hub Statistical API): pure request builders and
 * response parsing. The controller only adds the OAuth token and the HTTP calls.
 */

export type SatelliteValue = { value: number; date: string; pixels: number };
export type CopernicusReading = { ndvi: SatelliteValue | null; surfaceTemp: SatelliteValue | null; errors: string[] };

/** Square box of `half` metres around a point, as [minLng, minLat, maxLng, maxLat] (WGS84). */
export function bboxAround(lat: number, lng: number, half: number): [number, number, number, number] {
  const dLat = half / 111_320;
  const dLng = half / (111_320 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const round = (v: number) => Math.round(v * 1e6) / 1e6;
  return [round(lng - dLng), round(lat - dLat), round(lng + dLng), round(lat + dLat)];
}

/** Sentinel-2 L2A NDVI with clouds, cloud shadows and snow (SCL 3, 8, 9, 10, 11) masked out. */
export const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return { input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }], output: [{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1 }] };
}
function evaluatePixel(s) {
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  const masked = [3, 8, 9, 10, 11].indexOf(s.SCL) >= 0;
  return { ndvi: [ndvi], dataMask: [s.dataMask === 1 && !masked && isFinite(ndvi) ? 1 : 0] };
}`;

/** Sentinel-3 SLSTR thermal band S8 (10.85 µm) brightness temperature, in °C. */
export const SURFACE_TEMP_EVALSCRIPT = `//VERSION=3
function setup() {
  return { input: [{ bands: ["S8", "dataMask"] }], output: [{ id: "temp", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1 }] };
}
function evaluatePixel(s) {
  const c = s.S8 - 273.15;
  return { temp: [c], dataMask: [s.dataMask === 1 && c > -60 && c < 80 ? 1 : 0] };
}`;

const WGS84 = "http://www.opengis.net/def/crs/EPSG/0/4326";
const iso = (d: Date) => d.toISOString().slice(0, 19) + "Z";

/** Statistical API body: latest 60 days of Sentinel-2 at ~10 m over ±250 m, 5-day steps. */
export function ndviRequest(lat: number, lng: number, now = new Date()) {
  const from = new Date(now.getTime() - 60 * 86_400_000);
  return {
    input: { bounds: { bbox: bboxAround(lat, lng, 250), properties: { crs: WGS84 } }, data: [{ type: "sentinel-2-l2a", dataFilter: { maxCloudCoverage: 80 } }] },
    aggregation: { timeRange: { from: iso(from), to: iso(now) }, aggregationInterval: { of: "P5D" }, width: 50, height: 50, evalscript: NDVI_EVALSCRIPT },
    calculations: { default: {} },
  };
}

/** Statistical API body: latest 14 days of daytime (descending) Sentinel-3 SLSTR passes at ~1 km over ±1.5 km. */
export function surfaceTempRequest(lat: number, lng: number, now = new Date()) {
  const from = new Date(now.getTime() - 14 * 86_400_000);
  return {
    input: { bounds: { bbox: bboxAround(lat, lng, 1500), properties: { crs: WGS84 } }, data: [{ type: "sentinel-3-slstr", dataFilter: { orbitDirection: "DESCENDING", maxCloudCoverage: 30 } }] },
    aggregation: { timeRange: { from: iso(from), to: iso(now) }, aggregationInterval: { of: "P1D" }, width: 3, height: 3, evalscript: SURFACE_TEMP_EVALSCRIPT },
    calculations: { default: {} },
  };
}

type Stats = { mean?: number | string; sampleCount?: number; noDataCount?: number };
type StatsResponse = { data?: Array<{ interval?: { from?: string }; outputs?: Record<string, { bands?: Record<string, { stats?: Stats }> }> }> };

/** Most recent interval with at least one valid pixel; `NaN`/"NaN" means a fully clouded or empty interval. */
export function latestValue(body: unknown, output: string): SatelliteValue | null {
  const rows = (body as StatsResponse | null)?.data ?? [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const stats = row?.outputs?.[output]?.bands?.["B0"]?.stats;
    const mean = typeof stats?.mean === "number" ? stats.mean : Number.NaN;
    const pixels = (stats?.sampleCount ?? 0) - (stats?.noDataCount ?? 0);
    if (Number.isFinite(mean) && pixels > 0 && row?.interval?.from) return { value: Math.round(mean * 100) / 100, date: row.interval.from.slice(0, 10), pixels };
  }
  return null;
}

/** Plain-language reading of a mean NDVI value. */
export function ndviLabel(ndvi: number): string {
  if (ndvi < 0.1) return "Suolo nudo, asfalto o acqua";
  if (ndvi < 0.25) return "Vegetazione scarsa";
  if (ndvi < 0.45) return "Vegetazione moderata";
  if (ndvi < 0.65) return "Vegetazione buona";
  return "Vegetazione densa e vigorosa";
}
