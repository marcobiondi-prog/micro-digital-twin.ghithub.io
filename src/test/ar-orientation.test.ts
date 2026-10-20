import { afterEach, describe, expect, it, vi } from "vitest";
import { cameraViewport, groundTilt, isGroundPoint, prepareArOrientation, setArOrientationActive, setHomeVideoLandscape, shortestRotationDelta, syncAppOrientation } from "@/lib/ar-orientation";
import { readFileSync } from "node:fs";

describe("App portrait policy", () => {
  afterEach(() => vi.unstubAllGlobals());
  function setup(width = 411, height = 775) {
    const attributes = new Set<string>();
    const lock = vi.fn().mockResolvedValue(undefined);
    const unlock = vi.fn();
    vi.stubGlobal("screen", { width, height, orientation: { lock, unlock } });
    vi.stubGlobal("navigator", { maxTouchPoints: 5 });
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("document", { exitFullscreen, documentElement: {
      requestFullscreen,
      hasAttribute: (name: string) => attributes.has(name),
      toggleAttribute: (name: string, value: boolean) => { if (value) attributes.add(name); else attributes.delete(name); },
    } });
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    return { lock, unlock, requestFullscreen, exitFullscreen };
  }
  it("locks phones in portrait", async () => {
    const { lock } = setup();
    await syncAppOrientation();
    expect(lock).toHaveBeenLastCalledWith("portrait-primary");
  });
  it("locks tablets in portrait as well", async () => {
    const { lock } = setup(1194, 834);
    await syncAppOrientation();
    expect(lock).toHaveBeenLastCalledWith("portrait-primary");
  });
  it("turns a phone home video landscape and restores portrait when it closes", async () => {
    const { lock, unlock } = setup();
    setHomeVideoLandscape(true);
    await syncAppOrientation();
    expect(lock).toHaveBeenLastCalledWith("landscape");
    setHomeVideoLandscape(false);
    await syncAppOrientation();
    expect(lock).toHaveBeenLastCalledWith("portrait-primary");
    expect(unlock).not.toHaveBeenCalled();
  });
  it("allows any orientation in AI camera and restores portrait on close", async () => {
    const { lock, unlock } = setup();
    setArOrientationActive(true);
    await syncAppOrientation();
    expect(unlock).not.toHaveBeenCalled();
    expect(lock).toHaveBeenLastCalledWith("any");
    setArOrientationActive(false);
    await syncAppOrientation();
    expect(lock).toHaveBeenLastCalledWith("portrait-primary");
  });
  it("opens without browser fullscreen and preserves free rotation", async () => {
    const { lock, requestFullscreen, exitFullscreen } = setup();
    const opening = prepareArOrientation();
    expect(requestFullscreen).not.toHaveBeenCalled();
    await opening;
    expect(lock).toHaveBeenCalled();
    expect(lock).toHaveBeenLastCalledWith("any");
    Object.defineProperty(document, "fullscreenElement", { value: document.documentElement, configurable: true });
    setArOrientationActive(false);
    expect(exitFullscreen).not.toHaveBeenCalled();
    expect(lock).toHaveBeenLastCalledWith("portrait-primary");
  });
  it("releases runtime portrait locking when any orientation is denied", async () => {
    const { lock, unlock, requestFullscreen } = setup();
    lock.mockRejectedValueOnce(new DOMException("Fullscreen required", "SecurityError"));
    await prepareArOrientation();
    await vi.waitFor(() => expect(unlock).toHaveBeenCalledOnce());
    expect(requestFullscreen).not.toHaveBeenCalled();
    setArOrientationActive(false);
    expect(lock).toHaveBeenLastCalledWith("portrait-primary");
  });
});

describe("AR ground orientation", () => {
  it("does not rotate landscape when the camera is pitched or laid flat", () => {
    for (const beta of [0, 25, 45, 60]) {
      expect(cameraViewport(411, 775, 0, beta, 80, -90).rotation).toBe(-90);
      expect(cameraViewport(411, 775, 0, beta, -80, 90).rotation).toBe(90);
    }
    expect(cameraViewport(411, 775, 0, 5, 5, -90).rotation).toBe(-90);
    expect(cameraViewport(411, 775, 0, -5, -5, 90).rotation).toBe(90);
  });
  it("allows deliberate portrait and opposite landscape turns", () => {
    expect(cameraViewport(411, 775, 0, 80, 5, -90).rotation).toBe(0);
    expect(cameraViewport(411, 775, 0, 5, -80, -90).rotation).toBe(90);
    expect(cameraViewport(411, 775, 0, -80, 5, 90).rotation).toBe(180);
  });
  it("keeps landscape stable inside the sensor dead band", () => {
    expect(cameraViewport(411, 775, 0, 10, 52, -90).rotation).toBe(-90);
    expect(cameraViewport(411, 775, 0, 10, -52, 90).rotation).toBe(90);
    expect(cameraViewport(411, 775, 0, 80, 10, -90).rotation).toBe(0);
  });
  it("takes a quarter turn across upside-down portrait instead of spinning", () => {
    expect(shortestRotationDelta(180, -90)).toBe(90);
    expect(shortestRotationDelta(-90, 180)).toBe(-90);
    expect(shortestRotationDelta(90, 0)).toBe(-90);
  });
  it("keeps native landscape unrotated", () => {
    expect(cameraViewport(775, 411, 90, 0, 80)).toEqual({ width: 775, height: 411, rotation: 0, landscape: true });
  });
  it("adapts a portrait-locked camera to both landscape directions", () => {
    expect(cameraViewport(411, 775, 90, null, null)).toEqual({ width: 775, height: 411, rotation: 90, landscape: true });
    expect(cameraViewport(411, 775, 270, null, null)).toEqual({ width: 775, height: 411, rotation: -90, landscape: true });
  });
  it("uses physical tilt when the host angle stays portrait", () => {
    expect(cameraViewport(834, 1194, 0, 10, 80).rotation).toBe(-90);
    expect(cameraViewport(834, 1194, 0, 10, -80).rotation).toBe(90);
    expect(cameraViewport(834, 1194, 0, 80, 10).rotation).toBe(0);
  });
  it("defaults the installed app to portrait before runtime locking", () => {
    expect(cameraViewport(411, 775, 0, -80, 0)).toEqual({ width: 411, height: 775, rotation: 180, landscape: false });
    expect(cameraViewport(411, 775, 180, -80, 0)).toEqual({ width: 411, height: 775, rotation: 0, landscape: false });
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(manifest.orientation).toBe("portrait-primary");
  });
  it("keeps identical ground tilt in portrait and both landscape directions", () => {
    const portrait = groundTilt(90, 0, 0);
    expect(groundTilt(0, 90, 90)).toEqual(portrait);
    expect(groundTilt(0, -90, 270)).toEqual(portrait);
    expect(portrait).toEqual({ beta: 75, gamma: 0 });
  });
  it("prevents full spins and keeps the ground horizon level", () => {
    for (const angle of [0, 90, 180, 270]) {
      for (const beta of [-180, -90, 0, 90, 180]) {
        const tilt = groundTilt(beta, 80, angle);
        expect(tilt.beta).toBeGreaterThanOrEqual(50);
        expect(tilt.beta).toBeLessThanOrEqual(75);
        expect(tilt.gamma).toBe(0);
      }
    }
  });
  it("allows anchors only in the lower ground region", () => {
    expect(isGroundPoint(0.2)).toBe(false);
    expect(isGroundPoint(0.47)).toBe(false);
    expect(isGroundPoint(0.48)).toBe(true);
    expect(isGroundPoint(0.8)).toBe(true);
  });
});