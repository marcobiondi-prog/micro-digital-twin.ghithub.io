import { afterEach, describe, expect, it, vi } from "vitest";
import { playCameraSound } from "@/lib/camera-sounds";

afterEach(() => vi.unstubAllGlobals());

describe("camera sounds", () => {
  it("plays a shutter and distinct video start/stop tones", () => {
    const frequencies: number[] = [];
    const peaks: number[] = [];
    const starts = vi.fn();
    const node = () => ({ connect: vi.fn().mockReturnThis(), disconnect: vi.fn(), start: starts, stop: vi.fn() });
    const Audio = vi.fn(function () {
      return {
        state: "running", currentTime: 0, sampleRate: 48000, destination: {},
        createBuffer: () => ({ getChannelData: () => new Float32Array(5760) }),
        createBufferSource: node,
        createBiquadFilter: () => ({ ...node(), frequency: { set value(v: number) { frequencies.push(v); } } }),
        createGain: () => ({ ...node(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: (value: number) => peaks.push(value), exponentialRampToValueAtTime: vi.fn() } }),
        createOscillator: () => ({ ...node(), frequency: { set value(v: number) { frequencies.push(v); } } }),
      };
    });
    vi.stubGlobal("AudioContext", Audio);
    playCameraSound("shutter");
    expect(starts).toHaveBeenCalledTimes(3);
    expect(frequencies).toEqual([3200, 2000, 120]);
    frequencies.length = 0;
    playCameraSound("video-start");
    expect(frequencies).toEqual([660, 880]);
    playCameraSound("video-stop");
    expect(frequencies).toEqual([660, 880, 880, 660]);
    expect(starts).toHaveBeenCalledTimes(7);
    expect(Audio).toHaveBeenCalledOnce();
    peaks.length = 0;
    playCameraSound("shutter", 1.8);
    expect(peaks.slice(0, 3).map((peak) => Math.round(peak * 100) / 100)).toEqual([0.9, 0.72, 0.36]);
    playCameraSound("video-start", 1.8);
    playCameraSound("video-stop", 1.8);
    expect(peaks.slice(3)).toEqual([0.216, 0.216, 0.216, 0.216]);
  });
  it("plays distinct AI scan start, result and failure cues", () => {
    const frequencies: number[] = [];
    const waves: string[] = [];
    const node = () => ({ connect: vi.fn().mockReturnThis(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() });
    vi.resetModules();
    vi.stubGlobal("AudioContext", vi.fn(function () {
      return {
        state: "running", currentTime: 0, sampleRate: 48000, destination: {},
        createGain: () => ({ ...node(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }),
        createOscillator: () => ({ ...node(), set type(v: string) { waves.push(v); }, frequency: { set value(v: number) { frequencies.push(v); } } }),
      };
    }));
    return import("@/lib/camera-sounds").then(({ playCameraSound: sound }) => {
      sound("scan-start");
      sound("scan-done");
      sound("scan-fail");
      expect(frequencies).toEqual([523, 659, 784, 784, 1047, 1319, 440, 330]);
      expect(waves).toEqual(["triangle", "triangle", "triangle", "triangle", "triangle", "triangle", "sine", "sine"]);
    });
  });
  const scanContext = (log: { stops: number[]; frequencies: number[]; ramps: number[]; loops: boolean[] }) => {
    const node = () => ({ connect: vi.fn().mockReturnThis(), disconnect: vi.fn(), start: vi.fn(), stop: (at: number) => log.stops.push(at) });
    return vi.fn(function () {
      return {
        state: "running", currentTime: 2, destination: {},
        decodeAudioData: async () => ({ duration: 4 }),
        createGain: () => ({ ...node(), gain: { value: 0.06, setValueAtTime: vi.fn(), linearRampToValueAtTime: (v: number) => log.ramps.push(v), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() } }),
        createBiquadFilter: () => ({ ...node(), frequency: { value: 0 } }),
        createOscillator: () => ({ ...node(), frequency: { set value(v: number) { log.frequencies.push(v); } } }),
        createBufferSource: () => ({ ...node(), set loop(v: boolean) { log.loops.push(v); } }),
      };
    });
  };
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  it("falls back to a hum in step with the sweep when no recorded loop exists, fading out once", async () => {
    const log = { stops: [] as number[], frequencies: [] as number[], ramps: [] as number[], loops: [] as boolean[] };
    vi.resetModules();
    vi.stubGlobal("AudioContext", scanContext(log));
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } })));
    const { startScanLoop } = await import("@/lib/camera-sounds");
    const stop = startScanLoop(1.8);
    await flush();
    expect(log.frequencies).toEqual([330, 1 / 3.6]);
    expect(log.ramps[0]).toBeCloseTo(0.063);
    stop();
    stop();
    expect(log.stops).toEqual([2.95, 2.95]);
  });
  it("loops the recorded scan sound with a fade in and out when the file is present", async () => {
    const log = { stops: [] as number[], frequencies: [] as number[], ramps: [] as number[], loops: [] as boolean[] };
    vi.resetModules();
    vi.stubGlobal("AudioContext", scanContext(log));
    const fetcher = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } }));
    vi.stubGlobal("fetch", fetcher);
    const { startScanLoop, SCAN_LOOP_URL } = await import("@/lib/camera-sounds");
    const stop = startScanLoop(1.8);
    await flush();
    expect(fetcher).toHaveBeenCalledWith(SCAN_LOOP_URL);
    expect(log.loops).toEqual([true]);
    expect(log.frequencies).toEqual([]);
    expect(log.ramps[0]).toBeCloseTo(0.63);
    stop();
    expect(log.stops).toEqual([2.95]);
    startScanLoop(1.8)();
    await flush();
    expect(fetcher).toHaveBeenCalledOnce();
    expect(log.loops).toEqual([true]);
  });
  it("keeps capture nonblocking when audio is unavailable", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const { playCameraSound: sound } = await import("@/lib/camera-sounds");
    expect(() => sound("shutter", 1.8)).not.toThrow();
  });
});