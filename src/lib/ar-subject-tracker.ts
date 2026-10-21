/**
 * Live subject tracking for the AI camera, in the spirit of phone "eye/object AF" trackers:
 * a tiny frame is scored for vegetation only (excess green plus bark browns), the strongest
 * connected region near the previous lock wins, and the box is smoothed between frames.
 * Pure functions: the camera samples pixels, this module decides where the reticle goes.
 */
export type SubjectBox = { x: number; y: number; w: number; h: number };
export type SubjectLock = SubjectBox & { score: number };

/**
 * Find the dominant subject in an RGBA frame; null when nothing stands out. `bark` also scores
 * muted browns (trunks); leaf and canopy targets turn it off so wooden furniture never locks.
 */
export function findSubject(data: Uint8ClampedArray, width: number, height: number, previous?: SubjectBox | null, { bark: withBark = true } = {}): SubjectLock | null {
  const n = width * height;
  if (!n || data.length < n * 4) return null;
  const score = new Float32Array(n);
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4] ?? 0, g = data[i * 4 + 1] ?? 0, b = data[i * 4 + 2] ?? 0;
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    // Vegetation only: green must clearly dominate red and blue (trees, shrubs, grass, plants).
    const exg = 2 * g - r - b;
    const green = g > r * 1.08 && g > b * 1.08 && exg > 20 ? exg / 255 : 0;
    // Bark and trunks: muted browns (red > green > blue, low saturation), never vivid reds.
    const bark = withBark && r > g && g > b && r - g < 45 && g - b > 6 && r - b > 18 && r < 200 && r > 50 ? Math.min(0.5, (r - b) / 160) : 0;
    score[i] = Math.max(green, bark);
  }
  let mean = 0;
  for (let i = 0; i < n; i++) mean += score[i] ?? 0;
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += ((score[i] ?? 0) - mean) ** 2;
  const threshold = Math.max(0.1, mean + Math.sqrt(variance / n) * 0.3);
  const seen = new Uint8Array(n);
  const queue = new Int32Array(n);
  let best: (SubjectLock & { weight: number }) | null = null;
  const px = previous ? previous.x + previous.w / 2 : 0.5;
  const py = previous ? previous.y + previous.h / 2 : 0.5;
  for (let start = 0; start < n; start++) {
    if (seen[start] || (score[start] ?? 0) < threshold) continue;
    let head = 0, tail = 0, mass = 0, minX = width, minY = height, maxX = 0, maxY = 0, cells = 0;
    queue[tail++] = start;
    seen[start] = 1;
    while (head < tail) {
      const i = queue[head++] ?? 0;
      const x = i % width, y = (i - x) / width;
      cells++;
      mass += score[i] ?? 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      const next = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1];
      for (const j of next) {
        if (j < 0 || seen[j] || (score[j] ?? 0) < threshold) continue;
        seen[j] = 1;
        queue[tail++] = j;
      }
    }
    if (cells < n * 0.012) continue;
    const box = { x: minX / width, y: minY / height, w: (maxX - minX + 1) / width, h: (maxY - minY + 1) / height };
    const dx = box.x + box.w / 2 - px, dy = box.y + box.h / 2 - py;
    // Stickiness: the region nearest the current lock is preferred, like continuous AF.
    const weight = mass * Math.exp(-(dx * dx + dy * dy) / (previous ? 0.08 : 0.25));
    if (!best || weight > best.weight) best = { ...box, score: Math.min(1, cells / (n * 0.08)), weight };
  }
  if (!best) return null;
  const { weight: _weight, ...lock } = best;
  // Keep the reticle a readable size around the subject.
  const w = Math.min(0.8, Math.max(0.18, lock.w)), h = Math.min(0.8, Math.max(0.18, lock.h));
  const cx = lock.x + lock.w / 2, cy = lock.y + lock.h / 2;
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h, score: lock.score };
}

/** Exponential smoothing so the reticle glides instead of jumping. */
export function smoothBox(current: SubjectBox, target: SubjectBox, factor = 0.35): SubjectBox {
  const k = clamp(factor, 0, 1);
  return {
    x: current.x + (target.x - current.x) * k,
    y: current.y + (target.y - current.y) * k,
    w: current.w + (target.w - current.w) * k,
    h: current.h + (target.h - current.h) * k,
  };
}

export const SEARCH_BOX: SubjectBox = { x: 0.3, y: 0.25, w: 0.4, h: 0.3 };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
