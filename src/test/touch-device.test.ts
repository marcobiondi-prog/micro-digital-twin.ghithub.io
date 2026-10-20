import { afterEach, describe, expect, it, vi } from "vitest";
import { isTouchDevice, markTouchDevice } from "@/lib/touch-device";

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-touch");
});

describe("isTouchDevice", () => {
  it("detects a touchscreen through maxTouchPoints, as on Surface Pro hybrids", () => {
    vi.stubGlobal("navigator", { maxTouchPoints: 10 });
    expect(isTouchDevice()).toBe(true);
  });

  it("reports no touch for a classic desktop without touch support", () => {
    vi.stubGlobal("navigator", { maxTouchPoints: 0 });
    // jsdom exposes ontouchstart on window; a plain object stands in for a
    // desktop browser without touch event handlers.
    vi.stubGlobal("window", {} as unknown as Window & typeof globalThis);
    expect(isTouchDevice()).toBe(false);
  });

  it("marks the document with data-touch so CSS can show the AI pill", () => {
    vi.stubGlobal("navigator", { maxTouchPoints: 5 });
    markTouchDevice();
    expect(document.documentElement.hasAttribute("data-touch")).toBe(true);
  });
});
