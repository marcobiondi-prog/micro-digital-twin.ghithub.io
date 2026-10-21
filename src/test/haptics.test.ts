import { describe, expect, it } from "vitest";
import { hapticPattern, SCAN_HAPTIC_IN, SCAN_HAPTIC_OUT, temperatureHapticIntensity } from "../lib/haptics";

describe("Temperature slider vibration", () => {
  it("keeps the base tick at mild temperatures", () => {
    expect(hapticPattern(temperatureHapticIntensity(20))).toEqual([44, 6, 78]);
  });
  it("grows gradually toward 35°C", () => {
    const a = temperatureHapticIntensity(28), b = temperatureHapticIntensity(32);
    expect(a).toBeGreaterThan(0); expect(b).toBeGreaterThan(a); expect(b).toBeLessThan(1);
  });
  it("peaks with a third warning pulse at the critical point", () => {
    expect(hapticPattern(temperatureHapticIntensity(35), true)).toEqual([60, 8, 130, 12, 130]);
  });
});

describe("Urban slider vibration", () => {
  // Same formula as the urban sliders' progressHaptic: intensity = value / max.
  const intensity = (value: number, max: number) => Math.max(0, Math.min(1, value / max));
  it("grows gradually with the slider progress", () => {
    expect(hapticPattern(intensity(0, 100))).toEqual([44, 6, 78]);
    const a = hapticPattern(intensity(50, 100))[0] ?? 0, b = hapticPattern(intensity(90, 100))[0] ?? 0;
    expect(a).toBeGreaterThan(44); expect(b).toBeGreaterThan(a);
    expect(hapticPattern(intensity(100, 100), true)).toEqual([60, 8, 130, 12, 130]);
  });
});

describe("AI scan vibration", () => {
  it("grows when the scan starts and fades as it ends", () => {
    const pulses = (pattern: number[]) => pattern.filter((_, i) => i % 2 === 0);
    expect(pulses(SCAN_HAPTIC_IN)).toEqual([...pulses(SCAN_HAPTIC_IN)].sort((a, b) => a - b));
    expect(SCAN_HAPTIC_OUT).toEqual([...SCAN_HAPTIC_IN].reverse());
  });
});
