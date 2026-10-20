import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeVideos } from "@/views/HomeVideos";
import { PROMO_SEEN_KEY } from "@/models/home-videos";

describe("home video startup audio", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

  it.each(["Video tutorial", "Video promozionale"])("starts %s with audio enabled", async (label) => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    localStorage.setItem(PROMO_SEEN_KEY, "1");
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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
});