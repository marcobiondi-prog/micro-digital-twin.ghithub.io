import { describe, expect, it, vi, afterEach } from "vitest";
import { drawCameraVideo, freezeCameraFrame, paintArFrame, type ArFrameScene } from "@/lib/ar-frame";

function fixture({ videoWidth = 1280, videoHeight = 960 }: { videoWidth?: number; videoHeight?: number } = {}) {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { value: 400 });
  Object.defineProperty(canvas, "clientHeight", { value: 800 });
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const video = document.createElement("video");
  Object.defineProperty(video, "videoWidth", { value: videoWidth });
  Object.defineProperty(video, "videoHeight", { value: videoHeight });
  const sceneCanvas = document.createElement("canvas");
  const render = vi.fn();
  const scene: ArFrameScene = { canvas: sceneCanvas, render };
  return { canvas, drawImage, video, scene, sceneCanvas, render };
}

describe("AI camera frame composition", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps the perspective grid on the live preview", () => {
    const f = fixture();
    expect(paintArFrame(f.canvas, { video: f.video, scene: f.scene }, true)).toBe(true);
    expect(f.render).toHaveBeenCalledWith(400, 800, true);
    expect(f.drawImage).toHaveBeenCalledTimes(2);
    expect((f.drawImage.mock.calls[1] as unknown[])[0]).toBe(f.sceneCanvas);
  });

  it("drops the grid from the saved photo while still drawing the placed plants", () => {
    const f = fixture();
    expect(paintArFrame(f.canvas, { video: f.video, scene: f.scene }, false)).toBe(true);
    expect(f.render).toHaveBeenCalledWith(400, 800, false);
    // Two overlays remain: the video and the scene canvas holding the scanned photographs.
    expect(f.drawImage).toHaveBeenCalledTimes(2);
  });

  it("crops the video to fill the canvas without stretching it", () => {
    const f = fixture();
    expect(paintArFrame(f.canvas, { video: f.video, scene: null }, false)).toBe(true);
    const call = f.drawImage.mock.calls[0] as unknown as [unknown, number, number, number, number, number, number, number, number];
    expect(call[0]).toBe(f.video);
    expect(call[1]).toBeCloseTo(400);
    expect(call[2]).toBeCloseTo(0);
    expect(call[3]).toBeCloseTo(480);
    expect(call[4]).toBeCloseTo(960);
    expect(call[7]).toBe(400);
    expect(call[8]).toBe(800);
  });

  it("paints the thermal layer over the video before the 3D overlay", () => {
    const f = fixture();
    const order: string[] = [];
    f.render.mockImplementation(() => order.push("scene"));
    const heat = vi.fn(() => order.push("heat"));
    paintArFrame(f.canvas, { video: f.video, scene: f.scene, heat }, false);
    expect(order).toEqual(["heat", "scene"]);
  });

  it("paints nothing until the camera delivers a frame", () => {
    const f = fixture({ videoWidth: 0, videoHeight: 0 });
    expect(paintArFrame(f.canvas, { video: f.video, scene: f.scene }, false)).toBe(false);
    expect(f.render).not.toHaveBeenCalled();
    expect(f.drawImage).not.toHaveBeenCalled();
  });
  it("counter-rotates footage without rotating the HUD or stretching the frame", () => {
    const f = fixture();
    const g = { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
    drawCameraVideo(g as unknown as CanvasRenderingContext2D, f.video, 800, 400, -90);
    expect(g.rotate).toHaveBeenCalledWith(-Math.PI / 2);
    expect(g.translate).toHaveBeenCalledWith(400, 200);
    expect(g.drawImage.mock.calls[0]?.slice(5)).toEqual([-200, -400, 400, 800]);
    expect(g.restore).toHaveBeenCalledOnce();
  });
  it.each([0, -90, 90, -180])("keeps frozen scans aligned with live footage at %s degrees", rotation => {
    const f = fixture();
    f.canvas.width = 1600; f.canvas.height = 800;
    const g = { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(g as unknown as CanvasRenderingContext2D);
    const frame = freezeCameraFrame(f.canvas, f.video, rotation);
    expect(frame?.width).toBe(1536);
    expect(frame?.height).toBe(768);
    const frozenDraw = g.drawImage.mock.calls[0];
    const frozenRotation = g.rotate.mock.calls.slice();
    g.drawImage.mockClear(); g.rotate.mockClear();
    drawCameraVideo(g as unknown as CanvasRenderingContext2D, f.video, 1536, 768, rotation);
    expect(frozenDraw).toEqual(g.drawImage.mock.calls[0]);
    expect(frozenRotation).toEqual(g.rotate.mock.calls);
  });
});
