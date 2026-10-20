import { describe, expect, it, vi } from "vitest";
import { openSystemCamera, prepareSystemCamera, releaseSystemCamera, supportsSystemCapture } from "@/lib/system-camera";

describe("system camera capture", () => {
  it("does not request browser fullscreen", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const original = document.documentElement.requestFullscreen;
    document.documentElement.requestFullscreen = request;
    try {
      await prepareSystemCamera();
      releaseSystemCamera();
      expect(request).not.toHaveBeenCalled();
    } finally {
      document.documentElement.requestFullscreen = original;
    }
  });
  it("opens live capture instead of file selection on Surface tablets", () => {
    expect(supportsSystemCapture("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32", 10)).toBe(false);
  });
  it("preserves native capture on Android phones and tablets", () => {
    expect(supportsSystemCapture("Mozilla/5.0 (Linux; Android 14)", "Linux armv8l", 5)).toBe(true);
  });
  it("preserves native capture on iPad desktop user agents", () => {
    expect(supportsSystemCapture("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel", 5)).toBe(true);
  });
  it.each([["photo", "image/*"], ["video", "video/*"]] as const)(
    "requests native %s capture directly from the user gesture",
    (mode, accept) => {
      const input = document.createElement("input");
      input.type = "file";
      const click = vi.spyOn(input, "click").mockImplementation(() => {
        expect(input.accept).toBe(accept);
        expect(input.getAttribute("capture")).toBe("environment");
        expect(input.multiple).toBe(false);
      });
      const picker = vi.fn();
      input.showPicker = picker;
      openSystemCamera(input, mode);
      expect(click).toHaveBeenCalledOnce();
      expect(picker).not.toHaveBeenCalled();
    },
  );
});