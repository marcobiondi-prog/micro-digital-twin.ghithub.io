import { describe, expect, it } from "vitest";
import { isArCloseSwipe, isCameraCloseGesture } from "@/lib/ar-close-swipe";

describe("shared camera close gestures", () => {
  it("closes leftward from the preview interior", () => {
    expect(isCameraCloseGesture(-100, 5, 350, 741)).toBe(true);
  });
  it("closes upward above the gesture bar, not from the upper preview", () => {
    expect(isCameraCloseGesture(5, -100, 700, 741)).toBe(true);
    expect(isCameraCloseGesture(5, -100, 200, 741)).toBe(false);
  });
  it("closes on an upward swipe", () => {
    expect(isArCloseSwipe(10, -100)).toBe(true);
  });
  it("ignores taps and small movements", () => {
    expect(isArCloseSwipe(0, 0)).toBe(false);
    expect(isArCloseSwipe(0, -20)).toBe(false);
  });
  it("closes on a leftward swipe", () => {
    expect(isArCloseSwipe(-100, 10)).toBe(true);
    expect(isArCloseSwipe(-64, 0)).toBe(true);
  });
  it("ignores downward, rightward and diagonal swipes", () => {
    expect(isArCloseSwipe(0, 100)).toBe(false);
    expect(isArCloseSwipe(100, -70)).toBe(false);
    expect(isArCloseSwipe(-70, -70)).toBe(false);
    expect(isArCloseSwipe(-20, 0)).toBe(false);
  });
});