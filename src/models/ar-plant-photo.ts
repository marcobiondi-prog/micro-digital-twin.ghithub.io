export type PlantOutline = { x: number; y: number }[];

/** Only valid image-space contours can become photographed AR plants. */
export function plantPhotoBounds(points: PlantOutline) {
  if (points.length < 6 || points.length > 64 || points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) return null;
  const x = Math.min(...points.map((p) => p.x)), y = Math.min(...points.map((p) => p.y));
  const w = Math.max(...points.map((p) => p.x)) - x, h = Math.max(...points.map((p) => p.y)) - y;
  let area = 0;
  points.forEach((p, i) => { const q = points[(i + 1) % points.length]; if (q) area += p.x * q.y - q.x * p.y; });
  return w >= 0.02 && h >= 0.05 && Math.abs(area) / 2 > 0.001 ? { x, y, w, h } : null;
}