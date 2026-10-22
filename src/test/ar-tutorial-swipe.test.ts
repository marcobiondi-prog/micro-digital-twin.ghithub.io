import { describe, expect, it } from "vitest";
import { tutorialSwipeStep } from "../lib/ar-tutorial-swipe";

describe("AI tutorial swipes", () => {
  it("advances left and returns right", () => {
    expect(tutorialSwipeStep(0, 4, -100, 0, 0)).toBe(1);
    expect(tutorialSwipeStep(2, 4, 100, 0, 0)).toBe(1);
  });
  it("stays within the four steps", () => {
    // Wraps around: past the last slide back to the first, before the first to the last.
    expect(tutorialSwipeStep(0, 4, 100, 0, 0)).toBe(3);
    expect(tutorialSwipeStep(3, 4, -100, 0, 0)).toBe(0);
    expect(tutorialSwipeStep(0, 1, -100, 0, 0)).toBe(0);
  });
  it("ignores taps and vertical scrolling", () => {
    expect(tutorialSwipeStep(1, 4, -15, 0, 0)).toBe(1);
    expect(tutorialSwipeStep(1, 4, -60, 100, 0)).toBe(1);
  });
  it("follows both landscape directions and upside-down portrait", () => {
    expect(tutorialSwipeStep(1, 4, 0, -100, 90)).toBe(2);
    expect(tutorialSwipeStep(1, 4, 0, 100, -90)).toBe(2);
    expect(tutorialSwipeStep(1, 4, 100, 0, 180)).toBe(2);
  });
});