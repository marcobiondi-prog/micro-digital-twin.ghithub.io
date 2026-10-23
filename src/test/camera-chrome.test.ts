import { afterEach, describe, expect, it } from "vitest";
import { cameraChromeMode, enterCameraChrome, exitCameraChrome, fullscreenExitIsBack, isPhoneScreen, ROTATION_EXIT_WINDOW_MS } from "@/lib/camera-chrome";

const themes = () => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content);

describe("camera chrome", () => {
  afterEach(() => { exitCameraChrome(); document.head.innerHTML = ""; });
  it("uses fullscreen where the host supports it, else dark system bars", () => {
    expect(cameraChromeMode({ fullscreenEnabled: true, documentElement: { requestFullscreen: () => Promise.resolve() } })).toBe("fullscreen");
    expect(cameraChromeMode({ fullscreenEnabled: false, documentElement: {} })).toBe("dark-bars");
  });
  it("holds portrait only on phones (short side under 600 px)", () => {
    expect(isPhoneScreen(412, 915)).toBe(true);
    expect(isPhoneScreen(800, 1280)).toBe(false);
  });
  it("reads a fullscreen exit as Back unless a rotation just happened", () => {
    expect(fullscreenExitIsBack(10_000, Number.NEGATIVE_INFINITY)).toBe(true);
    expect(fullscreenExitIsBack(10_000, 10_000 - ROTATION_EXIT_WINDOW_MS / 2)).toBe(false);
    expect(fullscreenExitIsBack(10_000, 10_000 - ROTATION_EXIT_WINDOW_MS - 1)).toBe(true);
  });
  it("puts a dark theme-color first while the camera is open and removes it on close", async () => {
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
    await enterCameraChrome();
    expect(themes()).toEqual(["#000000", "#ffffff"]);
    exitCameraChrome();
    expect(themes()).toEqual(["#ffffff"]);
  });
});
