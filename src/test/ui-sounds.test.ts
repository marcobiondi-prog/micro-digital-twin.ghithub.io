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
    expect(gains).toEqual([0.75, 0.75]);
  });
  it("taps for buttons and button-like links, not for text links, disabled buttons or camera views", async () => {
    vi.resetModules();
    const starts = vi.fn();
    const node = () => ({ connect: vi.fn().mockReturnThis(), disconnect: vi.fn() });
    vi.stubGlobal("AudioContext", vi.fn(function () {
      return { state: "running", destination: {}, decodeAudioData: async () => ({ duration: 0.03 }), createBufferSource: () => ({ ...node(), start: starts }), createGain: () => ({ ...node(), gain: { value: 1 } }) };
    }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]), { headers: { "content-type": "audio/wav" } })));
    const { installUiClicks } = await import("@/lib/ui-sounds");
    document.body.innerHTML = '<button id="b"><span id="inner">Ok</span></button><button id="off" disabled>No</button><a id="nav" href="/casi" style="display:inline-flex">Casi</a><p><a id="text" href="/fonti">fonte</a></p><div data-no-ui-click><button id="cam">Scatta</button></div><div id="plain">testo</div>';
    const stop = installUiClicks();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const press = (id: string) => document.getElementById(id)!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    for (const id of ["inner", "nav"]) press(id);
    expect(starts).toHaveBeenCalledTimes(2);
    for (const id of ["off", "text", "cam", "plain"]) press(id);
    expect(starts).toHaveBeenCalledTimes(2);
    document.getElementById("b")!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    document.getElementById("b")!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    expect(starts).toHaveBeenCalledTimes(3);
    stop();
    press("inner");
    expect(starts).toHaveBeenCalledTimes(3);
  });
  it("stays silent without Web Audio", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const { playCompareClick } = await import("@/lib/ui-sounds");
    expect(() => playCompareClick()).not.toThrow();
  });
});
