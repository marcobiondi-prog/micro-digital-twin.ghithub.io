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
        createBiquadFilter: () => ({ ...node(), frequency: { value: 0 } }),
        createGain: () => ({ ...node(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: (value: number) => peaks.push(value), exponentialRampToValueAtTime: vi.fn() } }),
        createOscillator: () => ({ ...node(), frequency: { set value(v: number) { frequencies.push(v); } } }),
      };
    });
    vi.stubGlobal("AudioContext", Audio);
    playCameraSound("shutter");
    expect(starts).toHaveBeenCalledTimes(1);
    playCameraSound("video-start");
    expect(frequencies).toEqual([660, 880]);
    playCameraSound("video-stop");
    expect(frequencies).toEqual([660, 880, 880, 660]);
    expect(starts).toHaveBeenCalledTimes(5);
    expect(Audio).toHaveBeenCalledOnce();
    peaks.length = 0;
    playCameraSound("shutter", 1.8);
    expect(peaks[0]).toBeCloseTo(0.324);
    playCameraSound("video-start", 1.8);
    playCameraSound("video-stop", 1.8);
    expect(peaks.slice(1)).toEqual([0.216, 0.216, 0.216, 0.216]);
  });
  it("keeps capture nonblocking when audio is unavailable", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const { playCameraSound: sound } = await import("@/lib/camera-sounds");
    expect(() => sound("shutter", 1.8)).not.toThrow();
  });
});