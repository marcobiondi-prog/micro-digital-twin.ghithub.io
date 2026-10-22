import { describe, expect, it } from "vitest";
import { cameraChromeMode } from "@/lib/camera-chrome";

describe("cameraChromeMode", () => {
  it("uses fullscreen where the host supports it, else dark system bars", () => {
    expect(cameraChromeMode({ fullscreenEnabled: true, documentElement: { requestFullscreen: () => Promise.resolve() } })).toBe("fullscreen");
    // iOS Safari / standalone: no element fullscreen.
    expect(cameraChromeMode({ fullscreenEnabled: false, documentElement: {} })).toBe("dark-bars");
    expect(cameraChromeMode({ fullscreenEnabled: true, documentElement: {} })).toBe("dark-bars");
  });
});
