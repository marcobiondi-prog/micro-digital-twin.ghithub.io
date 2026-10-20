import { describe, expect, it, vi } from "vitest";
import { startArFrameLoop } from "@/lib/ar-frame-loop";

describe("AI preview energy policy", () => {
  it("caps a 60 Hz display at 30 compositions per second", () => {
    const draw = vi.fn(); let next: FrameRequestCallback = () => {};
    const stop = startArFrameLoop(draw, { request: cb => { next = cb; return 1; }, cancel: vi.fn(), hidden: () => false, listen: () => () => {} });
    for (let i = 0; i < 60; i++) next(i * 1000 / 60);
    expect(draw).toHaveBeenCalledTimes(30);
    stop();
  });
  it("stops while hidden, resumes on return, and cleans up", () => {
    let hidden = false; let next: FrameRequestCallback = () => {}; let sync = () => {};
    const cancel = vi.fn(), unlisten = vi.fn(), draw = vi.fn();
    const stop = startArFrameLoop(draw, { request: cb => { next = cb; return 1; }, cancel, hidden: () => hidden, listen: cb => { sync = cb; return unlisten; } });
    next(0); hidden = true; sync(); next(100);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalled();
    hidden = false; sync(); next(200);
    expect(draw).toHaveBeenCalledTimes(2);
    stop(); next(300);
    expect(draw).toHaveBeenCalledTimes(2);
    expect(unlisten).toHaveBeenCalledOnce();
  });
});