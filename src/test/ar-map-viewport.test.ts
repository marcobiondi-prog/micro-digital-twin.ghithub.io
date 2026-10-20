import { describe, expect, it } from "vitest";
import { fitArMapTransform, getArMapTransform, saveArMapTransform } from "@/lib/ar-map-viewport";

describe("AR map saved viewport", () => {
  it("keeps modified zoom and position across reads/remounts", () => {
    saveArMapTransform({ x: 83, y: -42, k: 0.65 });
    expect(getArMapTransform()).toEqual({ x: 83, y: -42, k: 0.65 });
    const copy = getArMapTransform(); copy.x = 900;
    expect(getArMapTransform().x).toBe(83);
  });
  it("fits a rotated viewport without losing the saved scale or position", () => {
    saveArMapTransform({ x: 200, y: 300, k: 0.7 });
    const fitted = fitArMapTransform(getArMapTransform(), { left: 540, top: 16, width: 200, height: 256, viewportWidth: 775, viewportHeight: 411 });
    expect(fitted).toEqual({ x: 83, y: 203.8, k: 0.7 });
    expect(getArMapTransform()).toEqual({ x: 200, y: 300, k: 0.7 });
  });
});