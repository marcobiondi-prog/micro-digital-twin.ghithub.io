import { expect, it, vi } from "vitest";
import { setCameraTorch, supportsCameraTorch } from "@/lib/camera-torch";
it("applies torch on and off only on supported cameras", async () => {
  const applyConstraints = vi.fn().mockResolvedValue(undefined);
  const track = { getCapabilities: () => ({torch:true}), applyConstraints } as unknown as MediaStreamTrack;
  expect(await setCameraTorch(track, true)).toBe(true);
  expect(applyConstraints).toHaveBeenLastCalledWith({advanced:[{torch:true}]});
  expect(await setCameraTorch(track, false)).toBe(true);
  expect(applyConstraints).toHaveBeenLastCalledWith({advanced:[{torch:false}]});
});
it("does not enable unsupported or failing flash", async () => {
  expect(supportsCameraTorch(undefined)).toBe(false);
  const track = { getCapabilities: () => ({torch:true}), applyConstraints: vi.fn().mockRejectedValue(new Error()) } as unknown as MediaStreamTrack;
  expect(await setCameraTorch(track, true)).toBe(false);
});