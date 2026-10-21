import { afterEach, describe, expect, it, vi } from "vitest";
import { isInstalledApp } from "@/lib/installed-app";

const media = (matches: boolean) => vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

describe("installed app detection", () => {
  afterEach(() => { vi.unstubAllGlobals(); Reflect.deleteProperty(navigator, "standalone"); });
  it("is false in a browser tab and true in an installed PWA window", () => {
    vi.stubGlobal("matchMedia", media(false));
    expect(isInstalledApp()).toBe(false);
    vi.stubGlobal("matchMedia", media(true));
    expect(isInstalledApp()).toBe(true);
  });
  it("recognises an iOS home-screen web app", () => {
    vi.stubGlobal("matchMedia", media(false));
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    expect(isInstalledApp()).toBe(true);
  });
});
