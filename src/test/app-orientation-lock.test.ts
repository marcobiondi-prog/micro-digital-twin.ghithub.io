import { afterEach, describe, expect, it, vi } from "vitest";

// Android aborts a pending lock() when a newer one arrives; that must not unlock (portrait flash).
function fakeOrientation() {
  let pendingReject: ((e: unknown) => void) | null = null;
  const lock = vi.fn((_value: string) => new Promise<void>((resolve, reject) => {
    pendingReject?.(new DOMException("superseded", "AbortError"));
    pendingReject = reject;
    setTimeout(() => { pendingReject = null; resolve(); }, 5);
  }));
  const unlock = vi.fn();
  Object.defineProperty(screen, "orientation", { configurable: true, value: { lock, unlock, angle: 0, type: "portrait-primary", addEventListener() {}, removeEventListener() {} } });
  return { lock, unlock };
}

describe("syncAppOrientation", () => {
  afterEach(() => { document.documentElement.removeAttribute("data-ar-camera"); vi.resetModules(); });
  it("never unlocks when a request is superseded, and does not repeat a held lock", async () => {
    const { lock, unlock } = fakeOrientation();
    const { syncAppOrientation } = await import("@/lib/ar-orientation");
    document.documentElement.setAttribute("data-ar-camera", "");
    const first = syncAppOrientation();
    const second = syncAppOrientation();
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(unlock).not.toHaveBeenCalled();
    const calls = lock.mock.calls.length;
    await expect(syncAppOrientation()).resolves.toBe(true);
    expect(lock.mock.calls.length).toBe(calls);
  });
});
