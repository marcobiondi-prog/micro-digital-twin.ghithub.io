import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

describe("compare card click", () => {
  it("decodes the recorded tap once and plays it softly on every choice", async () => {
    vi.resetModules();
    const starts = vi.fn();
    const gains: number[] = [];
    const node = () => ({ connect: vi.fn().mockReturnThis(), disconnect: vi.fn() });
    vi.stubGlobal("AudioContext", vi.fn(function () {
      return {
        state: "running", destination: {},
        decodeAudioData: async () => ({ duration: 0.1 }),
        createBufferSource: () => ({ ...node(), start: starts }),
        createGain: () => ({ ...node(), gain: { set value(v: number) { gains.push(v); } } }),
      };
    }));
    const fetcher = vi.fn(async () => new Response(new Uint8Array([1]), { headers: { "content-type": "audio/wav" } }));
    vi.stubGlobal("fetch", fetcher);
    const { playCompareClick, COMPARE_CLICK_URL } = await import("@/lib/ui-sounds");
    playCompareClick();
    playCompareClick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(COMPARE_CLICK_URL);
    expect(starts).toHaveBeenCalledTimes(2);
    expect(gains).toEqual([1, 1]);
  });
  it("stays silent without Web Audio", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const { playCompareClick } = await import("@/lib/ui-sounds");
    expect(() => playCompareClick()).not.toThrow();
  });
});
