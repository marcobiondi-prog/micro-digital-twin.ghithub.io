import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeVideos } from "@/views/HomeVideos";

type FullscreenStub = { current: () => Element | null; exit: () => void; requested: () => number };

function stubFullscreen(): FullscreenStub {
  let active: Element | null = null;
  let requested = 0;
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => active });
  Object.defineProperty(document, "exitFullscreen", { configurable: true, value: () => {
    active = null;
    document.dispatchEvent(new Event("fullscreenchange"));
    return Promise.resolve();
  } });
  Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: function (this: Element) {
    requested += 1;
    active = this;
    document.dispatchEvent(new Event("fullscreenchange"));
    return Promise.resolve();
  } });
  return {
    current: () => active,
    exit: () => { active = null; document.dispatchEvent(new Event("fullscreenchange")); },
    requested: () => requested,
  };
}

describe("home video fullscreen start", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.removeAttribute("data-home-video");
    document.documentElement.removeAttribute("data-home-video-landscape");
    delete (document as unknown as Record<string, unknown>)["fullscreenElement"];
    delete (document as unknown as Record<string, unknown>)["exitFullscreen"];
    delete (Element.prototype as unknown as Record<string, unknown>)["requestFullscreen"];
    delete (HTMLMediaElement.prototype as unknown as Record<string, unknown>)["webkitEnterFullscreen"];
  });

  function stubPlayer() {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  }

  function desktop() {
    vi.stubGlobal("innerWidth", 1440);
    vi.stubGlobal("innerHeight", 900);
    vi.stubGlobal("navigator", { ...navigator, maxTouchPoints: 0 });
  }

  function phone() {
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 844);
    vi.stubGlobal("navigator", { ...navigator, maxTouchPoints: 5 });
  }

  it.each(["Video tutorial", "Video promozionale"])("shows %s in the hero slide without browser fullscreen on desktop", async (label) => {
    stubPlayer();
    desktop();
    const fullscreen = stubFullscreen();
    render(<HomeVideos />);
    // The tutorial autoplays on open; the promo replaces it from its button.
    if (label === "Video promozionale") fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => {
      expect(document.querySelector("video")).not.toBeNull();
    });
    expect(fullscreen.current()).toBeNull();
    expect(fullscreen.requested()).toBe(0);
    expect(document.querySelector(".home-promo-slide video")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Espandi video" })).not.toBeNull();
  });

  it("enters fullscreen only when the expand control is tapped, and returns to the slide", async () => {
    stubPlayer();
    desktop();
    const fullscreen = stubFullscreen();
    render(<HomeVideos />);
    await waitFor(() => { expect(document.querySelector("video")).not.toBeNull(); });
    const video = document.querySelector("video");
    fireEvent.click(screen.getByRole("button", { name: "Espandi video" }));
    await waitFor(() => { expect(fullscreen.current()).toBe(document.querySelector(".home-video-player")); });
    act(() => { fullscreen.exit(); });
    expect(fullscreen.current()).toBeNull();
    expect(document.querySelector("video")).toBe(video);
  });

  it("still plays the video when fullscreen is refused", async () => {
    stubPlayer();
    desktop();
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: () => Promise.reject(new Error("Fullscreen denied")) });
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: "Video promozionale" }));
    await waitFor(() => { expect(document.querySelector("video")).not.toBeNull(); });
    expect(screen.getByRole("button", { name: "Espandi video" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Espandi video" }));
    await waitFor(() => { expect(document.querySelector("video")).not.toBeNull(); });
  });

  it("uses native video fullscreen only after the expand tap", async () => {
    stubPlayer();
    desktop();
    const native = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, "webkitEnterFullscreen", { configurable: true, value: native });
    render(<HomeVideos />);
    await waitFor(() => { expect(document.querySelector("video")).not.toBeNull(); });
    expect(native).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Espandi video" }));
    expect(native).toHaveBeenCalledTimes(1);
  });

  it.each(["Video tutorial", "Video promozionale"])("on a phone opens %s fullscreen and landscape when tapped, and restores portrait on close", async (label) => {
    stubPlayer();
    phone();
    const lock = vi.fn(() => Promise.resolve());
    vi.stubGlobal("screen", { width: 390, height: 844, orientation: { lock, unlock: vi.fn() } });
    const fullscreen = stubFullscreen();
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    const player = document.querySelector('[role="dialog"] .home-video-player');
    expect(player?.querySelector("video")).not.toBeNull();
    expect(document.documentElement.hasAttribute("data-home-video")).toBe(true);
    await waitFor(() => { expect(fullscreen.current()).toBe(player); });
    await waitFor(() => { expect(lock).toHaveBeenCalledWith("landscape"); });
    expect(screen.queryByRole("button", { name: "Espandi video" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Chiudi video" }));
    expect(document.querySelector("video")).toBeNull();
    expect(fullscreen.current()).toBeNull();
    expect(document.documentElement.hasAttribute("data-home-video")).toBe(false);
    expect(document.documentElement.hasAttribute("data-home-video-landscape")).toBe(false);
    await waitFor(() => { expect(lock).toHaveBeenLastCalledWith("portrait-primary"); });
  });

  it("on a phone closes the video when the user leaves fullscreen with the back gesture", async () => {
    stubPlayer();
    phone();
    vi.stubGlobal("screen", { width: 390, height: 844, orientation: { lock: vi.fn(() => Promise.resolve()), unlock: vi.fn() } });
    const fullscreen = stubFullscreen();
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: "Video tutorial" }));
    await waitFor(() => { expect(fullscreen.current()).not.toBeNull(); });
    act(() => { fullscreen.exit(); });
    expect(document.querySelector("video")).toBeNull();
  });

  it("on a phone still plays landscape edge-to-edge when fullscreen is refused", async () => {
    stubPlayer();
    phone();
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: () => Promise.reject(new Error("denied")) });
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: "Video promozionale" }));
    await waitFor(() => { expect(document.querySelector('[role="dialog"] video')).not.toBeNull(); });
    expect(document.documentElement.hasAttribute("data-home-video")).toBe(true);
    expect(document.documentElement.hasAttribute("data-home-video-landscape")).toBe(true);
  });

  it("closes by upward swipe but leaves control gestures alone", () => {
    stubPlayer();
    phone();
    stubFullscreen();
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: "Video tutorial" }));
    const seek = screen.getByRole("slider", { name: "Avanzamento video" });
    fireEvent.touchStart(seek, { touches: [{ clientX: 100, clientY: 400 }] });
    fireEvent.touchEnd(seek, { changedTouches: [{ clientX: 100, clientY: 200 }] });
    expect(document.querySelector("video")).not.toBeNull();
    const video = document.querySelector("video");
    if (!video) throw new Error("Missing video");
    fireEvent.touchStart(video, { touches: [{ clientX: 100, clientY: 400 }] });
    fireEvent.touchEnd(video, { changedTouches: [{ clientX: 100, clientY: 200 }] });
    expect(document.querySelector("video")).toBeNull();
  });
});
