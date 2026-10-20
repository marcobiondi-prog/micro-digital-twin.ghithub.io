import { describe, expect, it } from "vitest";
import { supportsTouchCenterCapture } from "@/lib/tablet-camera";

describe("touch camera center capture", () => {
  it("enables tablets in both orientations and Surface", () => {
    expect(supportsTouchCenterCapture(true, 1111, 741)).toBe(true);
    expect(supportsTouchCenterCapture(true, 741, 1111)).toBe(true);
    expect(supportsTouchCenterCapture(true, 1440, 960)).toBe(true);
  });
  it("enables smartphone capture in both orientations", () => {
    expect(supportsTouchCenterCapture(true, 393, 852)).toBe(true);
    expect(supportsTouchCenterCapture(true, 852, 393)).toBe(true);
  });
  it("excludes non-touch desktop", () => {
    expect(supportsTouchCenterCapture(false, 1440, 960)).toBe(false);
  });
});
