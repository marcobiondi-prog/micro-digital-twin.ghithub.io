import { describe, expect, it } from "vitest";
import { compactPlantHeight, nextPlantHeight, placementThermal, isPlacementOutsideHud, scannedSpecimenThermal, scannedSpecimenCount, coolingReadout } from "@/models/ar-placement";

describe("Photographic AR placement", () => {
  it("changes temperature reduction and shade with scanned specimen count, including zero", () => {
    const plant = {deltaT:0.4,shadeM2:13};
    expect(scannedSpecimenThermal(1, plant)).toEqual({count:1,unknown:0,deltaT:0.4,shadeM2:13});
    expect(scannedSpecimenThermal(3, plant)).toEqual({count:3,unknown:0,deltaT:1.2,shadeM2:39});
    expect(scannedSpecimenThermal(0, plant)).toEqual({count:0,unknown:0,deltaT:0,shadeM2:0});
  });
  it("bounds balance targets and caps estimates without generic fallback cooling", () => {
    expect(scannedSpecimenCount(20)).toBe(9);
    expect(scannedSpecimenCount(-2)).toBe(0);
    expect(scannedSpecimenThermal(9, {deltaT:2,shadeM2:20}).deltaT).toBe(3);
    expect(scannedSpecimenThermal(2, null)).toEqual({count:2,unknown:2,deltaT:0,shadeM2:0});
  });
  it("rejects placement across the entire HUD rectangle including gaps and edges", () => {
    const hud = [{ left: 16, right: 395, top: 580, bottom: 750 }];
    expect(isPlacementOutsideHud(205, 620, hud)).toBe(false);
    expect(isPlacementOutsideHud(16, 580, hud)).toBe(false);
    expect(isPlacementOutsideHud(205, 500, hud)).toBe(true);
  });
  it("fits tall and wide photographs in portrait and landscape", () => {
    for (const aspect of [411 / 775, 775 / 411]) for (const photo of [0.3, 3]) {
      const height = compactPlantHeight(2, 60, aspect, photo, 1.5);
      const visible = 4 * Math.tan(Math.PI / 6);
      expect(height).toBeGreaterThan(0);
      expect(height).toBeLessThanOrEqual(visible * 0.28);
      expect(height * photo).toBeLessThanOrEqual(visible * aspect * 0.35 + 1e-10);
    }
  });
  it("updates cooling and theoretical shade on addition, undo and clear", () => {
    const plant = { deltaT: 0.4, shadeM2: 13 };
    expect(placementThermal([plant, plant])).toEqual({ count: 2, unknown: 0, deltaT: 0.8, shadeM2: 26 });
    expect(placementThermal([plant])).toEqual({ count: 1, unknown: 0, deltaT: 0.4, shadeM2: 13 });
    expect(placementThermal([])).toEqual({ count: 0, unknown: 0, deltaT: 0, shadeM2: 0 });
  });
  it("keeps the existing 3 degree indicative ceiling and unknown plants unestimated", () => {
    expect(placementThermal([{ deltaT: 2, shadeM2: 20 }, { deltaT: 2, shadeM2: 20 }, null])).toEqual({ count: 3, unknown: 1, deltaT: 3, shadeM2: 40 });
    expect(placementThermal([null]).deltaT).toBe(0);
  });
  it("resizes a placed photograph within readable bounds and ignores invalid factors", () => {
    expect(nextPlantHeight(0.5, 1.2)).toBeCloseTo(0.6);
    expect(nextPlantHeight(0.5, 0.5)).toBeCloseTo(0.25);
    expect(nextPlantHeight(0.1, 0.5)).toBe(0.15);
    expect(nextPlantHeight(1.4, 2)).toBe(1.5);
    expect(nextPlantHeight(0.5, 0)).toBe(0.5);
    expect(nextPlantHeight(0.5, Number.NaN)).toBe(0.5);
  });
});
describe("coolingReadout", () => {
  it("shows before → after when the air temperature is known, the cooling alone otherwise", () => {
    expect(coolingReadout(31.44, 1.62)).toEqual({ before: 31.4, after: 29.8, delta: 1.6 });
    expect(coolingReadout(null, 0.84)).toEqual({ before: null, after: null, delta: 0.8 });
  });
});
