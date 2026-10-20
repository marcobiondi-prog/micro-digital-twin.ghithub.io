// Haptic tick for touch devices (phones and tablets). Silently no-ops where unsupported (iOS Safari, desktop).
// Firmer double detent: short pulse, tiny gap, longer pulse — reads as a stronger click than one flat buzz.
let last = 0;

export function hapticTick(pattern: number | number[] = [16, 6, 26]) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (!window.matchMedia?.("(pointer: coarse)").matches) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const now = performance.now();
  if (now - last < 70) return;
  last = now;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
