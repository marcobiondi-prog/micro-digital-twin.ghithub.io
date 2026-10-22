import { describe, expect, it } from "vitest";
import { cameraChromeMode, isPhoneScreen } from "@/lib/camera-chrome";

describe("cameraChromeMode", () => {
  it("uses fullscreen where the host supports it, else dark system bars", () => {
    expect(cameraChromeMode({ fullscreenEnabled: true, documentElement: { requestFullscreen: () => Promise.resolve() } })).toBe("fullscreen");
    // iOS Safari / standalone: no element fullscreen.
    expect(cameraChromeMode({ fullscreenEnabled: false, documentElement: {} })).toBe("dark-bars");
    expect(cameraChromeMode({ fullscreenEnabled: true, documentElement: {} })).toBe("dark-bars");
  });
  it("holds portrait only on phones (short side under 600 px)", () => {
    expect(isPhoneScreen(412, 915)).toBe(true);
    expect(isPhoneScreen(915, 412)).toBe(true);
    expect(isPhoneScreen(800, 1280)).toBe(false);
  });
});
