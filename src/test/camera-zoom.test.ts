import { describe, expect, it, vi } from "vitest";
import { clampZoom, createTrackZoomer, pinchZoom, splitZoom, trackZoomRange, zoomLabel, zoomStep } from "@/lib/camera-zoom";

describe("camera zoom", () => {
  it("clamps between 1× and 5×", () => {
    expect(clampZoom(0.4)).toBe(1);
    expect(clampZoom(7)).toBe(5);
    expect(clampZoom(2.34)).toBe(2.3);
  });
  it("walks the − / + presets, snapping pinch values", () => {
    expect(zoomStep(1, 1)).toBe(1.5);
    expect(zoomStep(2.3, 1)).toBe(3);
    expect(zoomStep(2.3, -1)).toBe(2);
    expect(zoomStep(5, 1)).toBe(5);
    expect(zoomStep(1, -1)).toBe(1);
  });
  it("follows the finger spread when pinching", () => {
    expect(pinchZoom(1, 100, 200)).toBe(2);
    expect(pinchZoom(3, 200, 100)).toBe(1.5);
    expect(pinchZoom(2, 0, 50)).toBe(2);
  });
  it("labels in Italian", () => { expect(zoomLabel(1.5)).toBe("1,5×"); expect(zoomLabel(2)).toBe("2×"); });
  it("uses the sensor zoom first and crops only the rest", () => {
    expect(splitZoom(2, null)).toEqual({ hardware: null, digital: 2 });
    expect(splitZoom(2, { min: 1, max: 8 })).toEqual({ hardware: 2, digital: 1 });
    expect(splitZoom(5, { min: 1, max: 2 })).toEqual({ hardware: 2, digital: 2.5 });
  });
  it("reads the hardware range only when the camera exposes one", () => {
    const track = (caps: unknown) => ({ getCapabilities: () => caps }) as unknown as MediaStreamTrack;
    expect(trackZoomRange(track({ zoom: { min: 1, max: 10 } }))).toEqual({ min: 1, max: 10 });
    expect(trackZoomRange(track({}))).toBeNull();
    expect(trackZoomRange(undefined)).toBeNull();
  });
  it("sends only the latest hardware value while a request is in flight", async () => {
    let release: () => void = () => {};
    const applyConstraints = vi.fn(() => new Promise<void>((r) => { release = r; }));
    const zoomTo = createTrackZoomer({ applyConstraints } as unknown as MediaStreamTrack);
    zoomTo(2); zoomTo(3); zoomTo(4);
    expect(applyConstraints).toHaveBeenCalledTimes(1);
    release(); await Promise.resolve(); await Promise.resolve();
    expect(applyConstraints).toHaveBeenCalledTimes(2);
    expect(applyConstraints).toHaveBeenLastCalledWith({ advanced: [{ zoom: 4 }] });
  });
});
