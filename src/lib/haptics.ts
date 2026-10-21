// Haptic tick for touch devices (phones and tablets). Silently no-ops where unsupported (iOS Safari, desktop).
// Firmer double detent: short pulse, tiny gap, longer pulse — reads as a stronger click than one flat buzz.
let last = 0;

/** Temperature (°C) where vine heat stress becomes critical; vibration peaks here. */
export const CRITICAL_TEMPERATURE = 35;
/** Temperature where the vibration starts to grow above the base tick. */
export const RAMP_START_TEMPERATURE = 22;

/** 0 → base tick, 1 → critical; quadratic so it grows gradually, then quickly near the threshold. */
export function temperatureHapticIntensity(temperature: number) {
  const t = (temperature - RAMP_START_TEMPERATURE) / (CRITICAL_TEMPERATURE - RAMP_START_TEMPERATURE);
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped;
}

/** Vibration pattern for an intensity 0..1; at/after the critical point it adds a third warning pulse. */
export function hapticPattern(intensity: number, critical = false): number[] {
  const i = Math.max(0, Math.min(1, intensity));
  const first = Math.round(44 + 16 * i), second = Math.round(78 + 52 * i);
  return critical ? [first, 8, second, 12, second] : [first, 6, second];
}

/** AI scan haptics: pulses that grow when the scan starts and fade when it ends, like the sound. */
export const SCAN_HAPTIC_IN = [18, 40, 32, 40, 52, 40, 80];
export const SCAN_HAPTIC_OUT = [80, 40, 52, 40, 32, 40, 18];

export function hapticTick(pattern: number | number[] = hapticPattern(0)) {
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
