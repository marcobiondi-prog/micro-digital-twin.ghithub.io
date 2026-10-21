import { describe, expect, it } from "vitest";
import { frameCamera } from "@/models/map-3d-camera";

describe("frameCamera", () => {
  it("centres the oblique view on the reference point", () => {
    expect(frameCamera(41.5, 14.2, 144)).toEqual({ center: { lat: 41.5, lng: 14.2, altitude: 0 }, range: 380, tilt: 62, heading: 20 });
  });
  it("sits closer once the panel has grown", () => {
    expect(frameCamera(41.5, 14.2, 288).range).toBeLessThan(frameCamera(41.5, 14.2, 144).range);
  });
});
