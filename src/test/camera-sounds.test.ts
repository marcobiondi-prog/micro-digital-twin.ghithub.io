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
  it("keeps capture nonblocking when audio is unavailable", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const { playCameraSound: sound } = await import("@/lib/camera-sounds");
    expect(() => sound("shutter", 1.8)).not.toThrow();
  });
});