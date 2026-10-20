import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { HomeVideos, TUTORIAL_AUTOPLAY_KEY } from "@/views/HomeVideos";

describe("home videos on open", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    delete (Element.prototype as unknown as Record<string, unknown>)["requestFullscreen"];
  });

  function viewport(width: number, height: number, touchPoints: number) {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("innerWidth", width);
    vi.stubGlobal("innerHeight", height);
    vi.stubGlobal("navigator", { ...navigator, maxTouchPoints: touchPoints });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    return vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  }

  it.each([["portrait", 390, 844], ["landscape", 844, 390]])("never autoplays on a smartphone in %s", (_orientation, width, height) => {
    vi.useFakeTimers();
    const play = viewport(width, height, 5);
    render(createElement(HomeVideos));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(document.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it.each([["tablet", 820, 1180, 5], ["tablet landscape", 1180, 820, 5], ["desktop", 1440, 900, 0]])(
    "autoplays the tutorial with sound inside the page, not fullscreen, on first access on %s",
    async (_device, width, height, touchPoints) => {
      const play = viewport(width, height, touchPoints);
      const request = vi.fn(() => Promise.resolve());
      Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: request });
      render(createElement(HomeVideos));
      await waitFor(() => { expect(document.querySelector('.home-promo-slide .home-video-player[data-kind="tutorial"] video')).not.toBeNull(); });
      expect(play).toHaveBeenCalled();
      expect(document.querySelector("video")?.muted).toBe(false);
      expect(localStorage.getItem(TUTORIAL_AUTOPLAY_KEY)).toBe("1");
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.documentElement.hasAttribute("data-home-video")).toBe(false);
      expect(request).not.toHaveBeenCalled();
    },
  );

  it("does not autoplay again after the first access", () => {
    vi.useFakeTimers();
    localStorage.setItem(TUTORIAL_AUTOPLAY_KEY, "1");
    const play = viewport(1440, 900, 0);
    render(createElement(HomeVideos));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(document.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("falls back to muted autoplay when sound is blocked, and turns sound on at the first tap", async () => {
    const play = viewport(1440, 900, 0);
    play.mockRejectedValueOnce(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    render(createElement(HomeVideos));
    await waitFor(() => { expect(document.querySelector("video")?.muted).toBe(true); });
    expect(play).toHaveBeenCalledTimes(2);
    expect(document.querySelector(".home-video-unmute")).not.toBeNull();
    act(() => { window.dispatchEvent(new Event("pointerdown")); });
    await waitFor(() => { expect(document.querySelector("video")?.muted).toBe(false); });
    expect(document.querySelector(".home-video-unmute")).toBeNull();
  });

  it("does not autoplay when opening a shared scenario", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/?scenario=abc");
    const play = viewport(1440, 900, 0);
    render(createElement(HomeVideos));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(document.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });
});
