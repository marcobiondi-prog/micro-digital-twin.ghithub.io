import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeVideos } from "@/views/HomeVideos";

describe("home video startup audio", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

  function stubPlayer() {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    return vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  }

  it.each(["Video tutorial", "Video promozionale"])("on a phone starts %s with audio enabled when tapped", async (label) => {
    const play = stubPlayer();
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 844);
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => {
      const video = document.querySelector("video");
      expect(video).not.toBeNull();
      expect(video?.muted).toBe(false);
      expect(video?.volume).toBe(1);
      expect(play).toHaveBeenCalled();
    });
  });

  it("opening the promo by hand on desktop plays it with audio", async () => {
    stubPlayer();
    vi.stubGlobal("innerWidth", 1440);
    vi.stubGlobal("innerHeight", 900);
    render(<HomeVideos />);
    fireEvent.click(screen.getByRole("button", { name: "Video promozionale" }));
    await waitFor(() => { expect(document.querySelector('.home-video-player[data-kind="promo"] video')).not.toBeNull(); });
    expect(document.querySelector("video")?.muted).toBe(false);
  });
});
